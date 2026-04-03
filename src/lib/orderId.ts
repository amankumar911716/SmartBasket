import { db } from '@/lib/db';

/**
 * Generate a unique sequential Order ID in the format: SB-ORD-000001
 *
 * - "SB" = SmartBasket prefix
 * - "ORD" = Order identifier
 * - 6-digit zero-padded sequential number
 *
 * Uses the database count + 1 to determine next number,
 * ensuring no duplicates even after server restart.
 */
export async function generateOrderId(): Promise<string> {
  // Use $queryRawUnsafe to avoid Prisma client cache issues
  const result = await db.$queryRawUnsafe<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM "Order"'
  );

  const nextNum = (result?.[0]?.count ?? 0) + 1;

  // Format: SB-ORD-000001
  const orderId = `SB-ORD-${String(nextNum).padStart(6, '0')}`;

  // Double-check uniqueness (in case of race conditions)
  const exists = await db.$queryRawUnsafe<{ id: string }[]>(
    'SELECT id FROM "Order" WHERE "orderId" = ?',
    orderId,
  );

  if (exists && exists.length > 0) {
    // Collision: try next 100 numbers
    for (let i = nextNum + 1; i < nextNum + 101; i++) {
      const candidate = `SB-ORD-${String(i).padStart(6, '0')}`;
      const collision = await db.$queryRawUnsafe<{ id: string }[]>(
        'SELECT id FROM "Order" WHERE "orderId" = ?',
        candidate,
      );
      if (!collision || collision.length === 0) {
        return candidate;
      }
    }
    // Fallback: use timestamp-based suffix
    return `SB-ORD-${String(nextNum).padStart(6, '0')}-${Date.now()}`;
  }

  return orderId;
}

/**
 * Backfill existing orders that have an empty orderId field.
 * Assigns sequential IDs based on createdAt order.
 */
export async function backfillOrderIds(): Promise<number> {
  // Find orders without a proper orderId (empty or doesn't start with SB-)
  const orders = await db.$queryRawUnsafe<{ id: string; createdAt: string }[]>(
    'SELECT id, createdAt FROM "Order" WHERE "orderId" = "" OR "orderId" IS NULL ORDER BY createdAt ASC'
  );

  if (!orders || orders.length === 0) return 0;

  // Get the highest existing SB-ORD number
  const existingOrders = await db.$queryRawUnsafe<{ orderId: string }[]>(
    'SELECT orderId FROM "Order" WHERE "orderId" LIKE \'SB-ORD-%\' ORDER BY orderId DESC LIMIT 1'
  );

  let startNum = 1;
  if (existingOrders && existingOrders.length > 0) {
    const lastId = existingOrders[0].orderId;
    const match = lastId.match(/SB-ORD-(\d+)/);
    if (match) {
      startNum = parseInt(match[1], 10) + 1;
    }
  }

  let count = 0;
  for (const order of orders) {
    const orderId = `SB-ORD-${String(startNum + count).padStart(6, '0')}`;
    await db.$executeRawUnsafe(
      'UPDATE "Order" SET "orderId" = ? WHERE id = ?',
      orderId,
      order.id,
    );
    count++;
  }

  return count;
}
