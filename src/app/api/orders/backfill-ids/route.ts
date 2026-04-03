import { NextResponse } from 'next/server';
import { backfillOrderIds } from '@/lib/orderId';

/**
 * POST /api/orders/backfill-ids
 * Backfills orderId (SB-ORD-XXXXXX) for existing orders that don't have one.
 * Should only be called once after adding the orderId column.
 */
export async function POST() {
  try {
    const count = await backfillOrderIds();
    return NextResponse.json({
      success: true,
      backfilled: count,
      message: count > 0
        ? `Successfully assigned Order IDs to ${count} order(s).`
        : 'All orders already have Order IDs.',
    });
  } catch (error) {
    console.error('Error backfilling order IDs:', error);
    return NextResponse.json(
      { error: 'Failed to backfill order IDs' },
      { status: 500 },
    );
  }
}
