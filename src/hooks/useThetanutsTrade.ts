'use client'

import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useConfig } from 'wagmi'
import { waitForTransactionReceipt } from 'wagmi/actions'
import { OPTION_BOOK_ABI, ERC20_ABI } from '@/lib/contracts/abi'
import { triggerSync } from '@/lib/api/positions'
import { useWalletModal } from '@/context/WalletModalContext'
import { REFERRER_ADDRESS, USDC_ADDRESS, BASE_CHAIN_ID } from '@/lib/constants'
import type { Option } from '@/types'

// Helper function to record trade in active tournaments
async function recordTournamentTrade(
  walletAddress: string, 
  premiumPaid: number, 
  profit: number = 0
): Promise<void> {
  try {
    // Fetch active tournaments user is enrolled in
    const response = await fetch(`/api/tournaments?wallet=${walletAddress}`)
    if (!response.ok) return
    
    const tournaments = await response.json()
    
    // Find live tournaments user has joined
    const liveTournaments = tournaments.filter(
      (t: { status: string; user_joined: boolean }) => t.status === 'live' && t.user_joined
    )
    
    // Record trade score for each active tournament
    for (const tournament of liveTournaments) {
      try {
        await fetch(`/api/tournaments/${tournament.id}/score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress, premiumPaid, profit }),
        })
        console.log(`Tournament score updated for ${tournament.name}`)
      } catch (err) {
        console.error(`Failed to update tournament score:`, err)
      }
    }
  } catch (error) {
    console.error('Failed to record tournament trade:', error)
  }
}

export function useThetanutsTrade() {
  const config = useConfig()
  const { isConnected, address, chainId } = useAccount()
  const { openWalletModal } = useWalletModal()
  const { writeContractAsync, isPending, data: hash } = useWriteContract()
  const { switchChainAsync } = useSwitchChain()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Ensure we're on Base chain
  const ensureBaseChain = async (): Promise<boolean> => {
    if (chainId !== BASE_CHAIN_ID) {
      try {
        console.log('Switching to Base chain...')
        await switchChainAsync({ chainId: BASE_CHAIN_ID })
        return true
      } catch (error) {
        console.error('Failed to switch chain:', error)
        return false
      }
    }
    return true
  }

  // Request USDC approval and wait for confirmation
  const requestApproval = async (spender: `0x${string}`, amount: bigint): Promise<`0x${string}` | null> => {
    if (!address) return null

    try {
      console.log('Requesting USDC approval for amount:', amount.toString())
      const hash = await writeContractAsync({
        chainId: BASE_CHAIN_ID,
        address: USDC_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spender, amount],
      })

      console.log('Approval transaction submitted:', hash)
      return hash
    } catch (error) {
      console.error('Approval failed:', error)
      return null
    }
  }

  const executeTrade = async (currentOption: Option, investmentAmount: string) => {
    const amount = parseFloat(investmentAmount) || 0;
    
    // Validate amount - must be positive
    if (amount <= 0) {
      return { status: 'invalid_amount', error: 'Amount must be greater than 0' };
    }

    // Check wallet connection first
    if (!isConnected) {
      openWalletModal();
      return { status: 'connecting_wallet' };
    }

    // Ensure we're on Base chain
    const onBase = await ensureBaseChain();
    if (!onBase) {
      return { status: 'error', error: 'Please switch to Base network' };
    }

    // Convert user input (USD) to USDC units (6 decimals)
    const amountInUsdcUnits = BigInt(Math.floor(amount * 1_000_000));
    
    // Calculate numContracts
    const pricePerContract = BigInt(currentOption.raw.order.price);
    let numContractsBigInt = (amountInUsdcUnits * BigInt(1e8)) / pricePerContract;
    
    // Cap numContracts to not exceed maxCollateralUsable from the order
    const maxCollateralUsable = BigInt(currentOption.raw.order.maxCollateralUsable);
    if (numContractsBigInt > maxCollateralUsable) {
      console.warn(`Capping numContracts from ${numContractsBigInt.toString()} to ${maxCollateralUsable.toString()}`);
      numContractsBigInt = maxCollateralUsable;
    }

    const optionBookAddress = currentOption.raw.optionBookAddress as `0x${string}`;

    // Request USDC approval before trade
    const approvalHash = await requestApproval(optionBookAddress, amountInUsdcUnits);
    if (!approvalHash) {
      return { status: 'error', error: 'Failed to approve USDC' };
    }

    // Wait for approval transaction to be confirmed before sending trade
    console.log('Waiting for approval confirmation...');
    try {
      await waitForTransactionReceipt(config, { 
        hash: approvalHash,
        confirmations: 1,
      });
      console.log('Approval confirmed!');
    } catch (error) {
      console.error('Approval confirmation failed:', error);
      return { status: 'error', error: 'Approval transaction failed' };
    }

    const orderArgs = {
      maker: currentOption.raw.order.maker as `0x${string}`,
      orderExpiryTimestamp: BigInt(currentOption.raw.order.orderExpiryTimestamp),
      collateral: currentOption.raw.order.collateral as `0x${string}`,
      isCall: currentOption.raw.order.isCall,
      priceFeed: currentOption.raw.order.priceFeed as `0x${string}`,
      implementation: currentOption.raw.order.implementation as `0x${string}`,
      isLong: currentOption.raw.order.isLong,
      maxCollateralUsable: BigInt(currentOption.raw.order.maxCollateralUsable),
      strikes: currentOption.raw.order.strikes.map(s => BigInt(s)),
      expiry: BigInt(currentOption.raw.order.expiry),
      price: BigInt(currentOption.raw.order.price),
      extraOptionData: currentOption.raw.order.extraOptionData as `0x${string}`,
      numContracts: numContractsBigInt
    };

    const referrer = REFERRER_ADDRESS;

    try {
      const tradeHash = await writeContractAsync({
        chainId: BASE_CHAIN_ID,
        address: optionBookAddress,
        abi: OPTION_BOOK_ABI,
        functionName: 'fillOrder',
        args: [orderArgs, currentOption.raw.signature as `0x${string}`, referrer as `0x${string}`],
      });
      
      // Trigger indexer sync
      triggerSync().catch(console.error);
      
      // Record trade for tournament scoring (async, don't block)
      if (address) {
        recordTournamentTrade(address, amount, 0).catch(console.error);
      }
      
      return { status: 'success', hash: tradeHash };
    } catch (error) {
      console.error('Trade execution failed:', error);
      return { status: 'error', error };
    }
  }

  return {
    executeTrade,
    isPending,
    isConfirming,
    isConfirmed,
    isConnected
  }
}

