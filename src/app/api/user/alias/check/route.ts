import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /api/user/alias/check - Check if alias is available
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const alias = searchParams.get('alias');

  if (!alias) {
    return NextResponse.json({ error: 'Alias required' }, { status: 400 });
  }

  const trimmedAlias = alias.trim();

  // Validate format first
  const ALIAS_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
  if (!ALIAS_REGEX.test(trimmedAlias)) {
    return NextResponse.json({ 
      available: false,
      reason: 'Alias must be 3-20 characters, alphanumeric and underscores only'
    });
  }

  const supabase = getSupabaseAdmin();

  try {
    // Check if alias exists (case-insensitive)
    const { data, error } = await supabase
      .from('user_aliases')
      .select('wallet_address')
      .ilike('alias', trimmedAlias)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking alias:', error);
      return NextResponse.json({ error: 'Failed to check alias' }, { status: 500 });
    }

    // Get the current user's wallet if provided (to allow them to keep their own alias)
    const currentWallet = searchParams.get('wallet')?.toLowerCase();

    const isOwnAlias = data && currentWallet && data.wallet_address === currentWallet;
    const available = !data || isOwnAlias;

    return NextResponse.json({ 
      available,
      alias: trimmedAlias,
      reason: available ? null : 'Alias already taken'
    });
  } catch (error) {
    console.error('Error in alias check:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
