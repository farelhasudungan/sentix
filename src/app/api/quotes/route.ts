import { NextResponse } from 'next/server';
import { THETANUTS_API_URL } from '@/lib/constants';

export async function GET() {
  try {
    const response = await fetch(THETANUTS_API_URL, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 30 } // Cache for 30 seconds
    });

    if (!response.ok) {
      throw new Error(`Upstream API failed: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}
