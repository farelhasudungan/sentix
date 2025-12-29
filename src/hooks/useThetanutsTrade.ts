'use client'

import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { OPTION_BOOK_ABI, ERC20_ABI } from '@/lib/contracts/abi'
import { triggerSync } from '@/lib/api/positions'
import { useWalletModal } from '@/context/WalletModalContext'
import { REFERRER_ADDRESS, USDC_ADDRESS, BASE_CHAIN_ID } from '@/lib/constants'
import type { Option } from '@/types'

export function useThetanutsTrade() {
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

  // Request USDC approval
  const requestApproval = async (spender: `0x${string}`, amount: bigint): Promise<boolean> => {
    if (!address) return false

    try {
      console.log('Requesting USDC approval for amount:', amount.toString())
      await writeContractAsync({
        chainId: BASE_CHAIN_ID,
        address: USDC_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spender, amount],
      })

      console.log('Approval transaction submitted')
      return true
    } catch (error) {
      console.error('Approval failed:', error)
      return false
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
    const numContractsBigInt = (amountInUsdcUnits * BigInt(1e18)) / pricePerContract;

    const optionBookAddress = currentOption.raw.optionBookAddress as `0x${string}`;

    // Request USDC approval before trade
    const approved = await requestApproval(optionBookAddress, amountInUsdcUnits);
    if (!approved) {
      return { status: 'error', error: 'Failed to approve USDC' };
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
      await writeContractAsync({
        chainId: BASE_CHAIN_ID,
        address: optionBookAddress,
        abi: OPTION_BOOK_ABI,
        functionName: 'fillOrder',
        args: [orderArgs, currentOption.raw.signature as `0x${string}`, referrer as `0x${string}`],
      });
      
      // Trigger indexer sync
      triggerSync().catch(console.error);
      
      return { status: 'trade_initiated' };
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
