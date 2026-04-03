import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { generateOrderId } from '@/lib/orderId';

/**
 * Enrich order items JSON with missing product data.
 * Handles both old format ({name, productId, quantity, price}) and
 * new format ({productName, productImage, total, ...}).
 * Fills in missing fields from the products table.
 */
async function enrichOrderItems(
  items: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  // Collect product IDs that need lookup
  const needLookup = items.filter(
    (item) => !item.productName || !item.productImage,
  );
  if (needLookup.length === 0) return items;

  const productIds = needLookup
    .map((item) => item.productId)
    .filter(Boolean) as string[];

  if (productIds.length === 0) return items;

  // Batch-fetch products
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
      // Normalize name: prefer productName, fallback to name, then product.name
      productName: item.productName || item.name || (product?.name as string) || 'Unknown Item',
      // Normalize image: prefer productImage, fallback to image, then product.image
      productImage: item.productImage || item.image || (product?.image as string) || '',
      // Ensure total exists
      total: item.total || (quantity * price),
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '10', 10)));

    const where: Prisma.OrderWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.orderStatus = status;
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: { address: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.order.count({ where }),
    ]);

    // Fetch orderId for all returned orders via raw SQL (avoids Prisma client cache issues)
    const orderIds = await db.$queryRawUnsafe<{ id: string; orderId: string }[]>(
      'SELECT id, "orderId" FROM "Order"'
    );
    const orderIdMap = new Map(
      (orderIds || []).map((r) => [r.id, r.orderId || r.id.slice(-8).toUpperCase()]),
    );

    // Enrich all orders' items in parallel
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const parsed = JSON.parse(order.items) as Record<string, unknown>[];
        const items = await enrichOrderItems(parsed);
        return {
          ...order,
          orderId: (order as Record<string, unknown>).orderId || orderIdMap.get(order.id) || order.id.slice(-8).toUpperCase(),
          items,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        };
      }),
    );

    return NextResponse.json({
      data: enrichedOrders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      addressId,
      items,
      paymentMethod,
      deliverySlot,
      deliveryDate,
      couponCode,
      notes,
    } = body;

    if (!userId || !addressId || !items || !items.length || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, addressId, items, paymentMethod' },
        { status: 400 }
      );
    }

    // Verify address belongs to user
    const address = await db.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) {
      return NextResponse.json(
        { error: 'Address not found or does not belong to user' },
        { status: 404 }
      );
    }

    // Fetch products and build order items
    const productIds = items.map((item: { productId: string }) => item.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate all products exist and are in stock
    const orderItems = items.map((item: { productId: string; quantity: number }) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      if (!product.inStock || product.stock < item.quantity) {
        throw new Error(`Product ${product.name} is out of stock or insufficient quantity`);
      }
      return {
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        quantity: item.quantity,
        price: product.price,
        total: product.price * item.quantity,
      };
    });

    const subtotal = orderItems.reduce((sum: number, item: { total: number }) => sum + item.total, 0);
    let discount = 0;

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await db.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
      if (coupon && coupon.active && coupon.usedCount < coupon.maxUses) {
        if (coupon.expiresAt && new Date() > coupon.expiresAt) {
          return NextResponse.json(
            { error: 'Coupon has expired' },
            { status: 400 }
          );
        }
        if (subtotal < coupon.minOrder) {
          return NextResponse.json(
            { error: `Minimum order amount for this coupon is ₹${coupon.minOrder}` },
            { status: 400 }
          );
        }
        if (coupon.type === 'percentage') {
          discount = Math.round((subtotal * coupon.discount) / 100 * 100) / 100;
        } else {
          discount = coupon.discount;
        }
      } else {
        return NextResponse.json(
          { error: 'Invalid or expired coupon' },
          { status: 400 }
        );
      }
    }

    const deliveryFee = subtotal >= 500 ? 0 : 30;
    const total = Math.max(0, subtotal - discount + deliveryFee);

    // Generate unique professional Order ID
    const orderId = await generateOrderId();

    // Create order and order items in a transaction
    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderId,
          userId,
          addressId,
          items: JSON.stringify(orderItems),
          total,
          discount,
          deliveryFee,
          paymentMethod,
          paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed',
          orderStatus: 'placed',
          deliverySlot: deliverySlot || '',
          deliveryDate: deliveryDate || '',
          notes: notes || '',
        },
        include: { address: true },
      });

      // Create order items
      await tx.orderItem.createMany({
        data: orderItems.map((item: { productId: string; productName: string; productImage: string; quantity: number; price: number; total: number }) => ({
          orderId: newOrder.id,
          ...item,
        })),
      });

      // Update product stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Increment coupon used count
      if (couponCode) {
        await tx.coupon.update({
          where: { code: couponCode.toUpperCase() },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Clear cart items for the user
      await tx.cartItem.deleteMany({ where: { userId } });

      return newOrder;
    });

    return NextResponse.json({
      ...order,
      items: JSON.parse(order.items),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating order:', error);

    const message = error instanceof Error ? error.message : 'Failed to create order';

    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
