import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const VALID_STATUSES = [
  'placed',
  'pending',
  'confirmed',
  'packing',
  'packed',
  'shipped',
  'in_transit',
  'delivered',
  'cancelled',
  'rejected',
  'returned',
];

const VALID_PAYMENT_STATUSES = ['paid', 'unpaid', 'pending', 'refunded'];

/**
 * Enrich order items JSON with missing product data.
 * Handles both old format ({name, productId, quantity, price}) and
 * new format ({productName, productImage, total, ...}).
 * Fills in missing fields from the products table.
 */
async function enrichOrderItems(
  items: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  const needLookup = items.filter(
    (item) => !item.productName || !item.productImage,
  );
  if (needLookup.length === 0) return items;

  const productIds = needLookup
    .map((item) => item.productId)
    .filter(Boolean) as string[];

  if (productIds.length === 0) return items;

  const products = await db.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  return items.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    const product = productMap.get(String(item.productId));

    return {
      ...item,
      productName: item.productName || item.name || (product?.name as string) || 'Unknown Item',
      productImage: item.productImage || item.image || (product?.image as string) || '',
      total: item.total || (quantity * price),
    };
  });
}

/**
 * Determine the auto payment status based on the new order status and payment method.
 *
 * Rules:
 *   - returned              → refunded (always)
 *   - cancelled             → refunded (prepaid) / unpaid (COD)
 *   - rejected              → refunded (prepaid) / unpaid (COD)
 *   - delivered             → paid (always — COD becomes paid on delivery)
 *   - placed/confirmed/etc. → keep current paymentStatus (no change)
 */
function computeAutoPaymentStatus(
  newOrderStatus: string,
  paymentMethod: string,
  _currentPaymentStatus: string,
): string | null {
  switch (newOrderStatus) {
    case 'returned':
      return 'refunded';
    case 'cancelled':
    case 'rejected':
      // Prepaid orders get refunded; COD orders were never charged
      return paymentMethod === 'cod' ? 'unpaid' : 'refunded';
    case 'delivered':
      // COD becomes paid on delivery; prepaid already stays paid
      return 'paid';
    default:
      // No automatic change for in-progress statuses
      return null;
  }
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const order = await db.order.findUnique({
      where: { id },
      include: {
        address: true,
        orderItems: { include: { product: true } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Enrich items with product data
    const parsed = JSON.parse(order.items) as Record<string, unknown>[];
    const items = await enrichOrderItems(parsed);

    // Fetch orderId via raw SQL (avoids Prisma client cache issues)
    const row = await db.$queryRawUnsafe<{ orderId: string }[]>(
      'SELECT "orderId" FROM "Order" WHERE id = ?',
      id,
    );
    const orderId = (order as Record<string, unknown>).orderId
      || (row?.[0]?.orderId)
      || id.slice(-8).toUpperCase();

    return NextResponse.json({
      ...order,
      orderId,
      items,
      orderItems: order.orderItems,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { status, paymentStatus: explicitPaymentStatus } = body;

    const existing = await db.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, string> = {};
    let autoPaymentStatus: string | null = null;

    // ── Handle order status update ─────────────────────────────────────
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.orderStatus = status;

      // Compute the auto payment status
      autoPaymentStatus = computeAutoPaymentStatus(
        status,
        existing.paymentMethod,
        existing.paymentStatus,
      );
    }

    // ── Handle explicit payment status (admin override) ────────────────
    if (explicitPaymentStatus) {
      if (!VALID_PAYMENT_STATUSES.includes(explicitPaymentStatus)) {
        return NextResponse.json(
          { error: `Invalid payment status. Must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}` },
          { status: 400 }
        );
      }
      // Explicit override takes precedence
      updateData.paymentStatus = explicitPaymentStatus;
      autoPaymentStatus = null; // explicit wins
    } else if (autoPaymentStatus) {
      // Auto-computed payment status
      updateData.paymentStatus = autoPaymentStatus;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const order = await db.order.update({
      where: { id },
      data: updateData,
      include: { address: true },
    });

    // Build response metadata about what changed
    const responseMeta: Record<string, unknown> = {};
    if (updateData.orderStatus) {
      responseMeta.orderStatusUpdated = true;
      responseMeta.newOrderStatus = updateData.orderStatus;
    }
    if (updateData.paymentStatus) {
      responseMeta.paymentStatusUpdated = true;
      responseMeta.newPaymentStatus = updateData.paymentStatus;
      responseMeta.paymentAutoUpdated = !!autoPaymentStatus;
    }

    // Enrich items in the response too
    const parsed = JSON.parse(order.items) as Record<string, unknown>[];
    const items = await enrichOrderItems(parsed);

    // Fetch orderId via raw SQL
    const row = await db.$queryRawUnsafe<{ orderId: string }[]>(
      'SELECT "orderId" FROM "Order" WHERE id = ?',
      id,
    );
    const orderId = (order as Record<string, unknown>).orderId
      || (row?.[0]?.orderId)
      || id.slice(-8).toUpperCase();

    return NextResponse.json({
      ...order,
      orderId,
      items,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      ...responseMeta,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
