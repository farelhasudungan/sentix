import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /api/notifications - Fetch notifications for a wallet
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');
  const limit = parseInt(searchParams.get('limit') || '50');

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  try {
    const { data: notifications, error, count } = await supabase
      .from('user_notifications')
      .select('*', { count: 'exact' })
      .eq('wallet_address', wallet.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

    return NextResponse.json({
      notifications: notifications || [],
      total: count || 0,
      unreadCount,
    });
  } catch (error) {
    console.error('Error in notifications GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/notifications - Create a notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address, type, title, message, tx_hash } = body;

    if (!wallet_address) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    if (!type || !title || !message) {
      return NextResponse.json({ error: 'Type, title, and message required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: notification, error } = await supabase
      .from('user_notifications')
      .insert({
        wallet_address: wallet_address.toLowerCase(),
        type,
        title,
        message,
        tx_hash: tx_hash || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error in notifications POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address, notification_ids, mark_all } = body;

    if (!wallet_address) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    if (mark_all) {
      // Mark all notifications as read for this wallet
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('wallet_address', wallet_address.toLowerCase());

      if (error) {
        console.error('Error marking all as read:', error);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
      }
    } else if (notification_ids && Array.isArray(notification_ids)) {
      // Mark specific notifications as read
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .in('id', notification_ids)
        .eq('wallet_address', wallet_address.toLowerCase());

      if (error) {
        console.error('Error marking as read:', error);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in notifications PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/notifications - Clear all notifications for a wallet
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address } = body;

    if (!wallet_address) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('user_notifications')
      .delete()
      .eq('wallet_address', wallet_address.toLowerCase());

    if (error) {
      console.error('Error deleting notifications:', error);
      return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in notifications DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
