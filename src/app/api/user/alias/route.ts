import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Validation regex: alphanumeric + underscore, 3-20 chars
const ALIAS_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

// GET /api/user/alias - Get alias for wallet(s)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');
  const wallets = searchParams.get('wallets'); // comma-separated for batch

  const supabase = getSupabaseAdmin();

  try {
    // Batch fetch for multiple wallets
    if (wallets) {
      const walletList = wallets.split(',').map(w => w.toLowerCase().trim());
      
      const { data, error } = await supabase
        .from('user_aliases')
        .select('wallet_address, alias')
        .in('wallet_address', walletList);

      if (error) {
        console.error('Error fetching aliases batch:', error);
        return NextResponse.json({ error: 'Failed to fetch aliases' }, { status: 500 });
      }

      // Return as map: { walletAddress: alias }
      const aliasMap: Record<string, string> = {};
      data?.forEach(row => {
        aliasMap[row.wallet_address] = row.alias;
      });

      return NextResponse.json({ aliases: aliasMap });
    }

    // Single wallet fetch
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('user_aliases')
      .select('alias')
      .eq('wallet_address', wallet.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching alias:', error);
      return NextResponse.json({ error: 'Failed to fetch alias' }, { status: 500 });
    }

    return NextResponse.json({ 
      alias: data?.alias || null,
      wallet: wallet.toLowerCase()
    });
  } catch (error) {
    console.error('Error in alias GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/user/alias - Create or update alias
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address, alias } = body;

    if (!wallet_address) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    if (!alias || typeof alias !== 'string') {
      return NextResponse.json({ error: 'Alias required' }, { status: 400 });
    }

    const trimmedAlias = alias.trim();

    // Validate alias format
    if (!ALIAS_REGEX.test(trimmedAlias)) {
      return NextResponse.json({ 
        error: 'Alias must be 3-20 characters, alphanumeric and underscores only' 
      }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const walletLower = wallet_address.toLowerCase();

    // Check if alias is already taken by another user
    const { data: existing } = await supabase
      .from('user_aliases')
      .select('wallet_address')
      .ilike('alias', trimmedAlias)
      .single();

    if (existing && existing.wallet_address !== walletLower) {
      return NextResponse.json({ error: 'Alias already taken' }, { status: 409 });
    }

    // Upsert the alias
    const { data, error } = await supabase
      .from('user_aliases')
      .upsert({
        wallet_address: walletLower,
        alias: trimmedAlias,
        updated_at: new Date().toISOString(),
      }, { 
        onConflict: 'wallet_address' 
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving alias:', error);
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Alias already taken' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to save alias' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      alias: data.alias,
      wallet: data.wallet_address
    });
  } catch (error) {
    console.error('Error in alias POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
