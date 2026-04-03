import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [
      totalOrders,
      totalRevenue,
      totalProducts,
      totalUsers,
      recentOrders,
      ordersByStatusRaw,
    ] = await Promise.all([
      db.order.count(),
      db.order.aggregate({ _sum: { total: true } }),
      db.product.count(),
      db.user.count(),
      db.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { address: true },
      }),
      db.order.groupBy({
        by: ['orderStatus'],
        _count: { orderStatus: true },
      }),
    ]);

    const recentOrdersFormatted = recentOrders.map((order) => ({
      ...order,
      items: JSON.parse(order.items),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }));

    const ordersByStatus = ordersByStatusRaw.map((item) => ({
      status: item.orderStatus,
      count: item._count.orderStatus,
    }));

    // Revenue for last 7 days (chart data)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentRevenueOrders = await db.order.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        orderStatus: { notIn: ['cancelled', 'rejected'] },
      },
      select: {
        total: true,
        createdAt: true,
        orderStatus: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day — store raw ISO date for client-side parsing
    const dailyRevenue: { date: string; dateLabel: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dayStr = d.toISOString(); // full ISO string for safe parsing on client

      const dayOrders = recentRevenueOrders.filter((o) => {
        const oDate = new Date(o.createdAt);
        oDate.setHours(0, 0, 0, 0);
        const targetDate = new Date(dayStr);
        targetDate.setHours(0, 0, 0, 0);
        return oDate.getTime() === targetDate.getTime();
      });

      dailyRevenue.push({
        date: dayStr,
        dateLabel: `${d.getDate()} ${d.toLocaleDateString('en-IN', { month: 'short' })}`,
        revenue: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
        orders: dayOrders.length,
      });
    }

    // Top selling products — handle both old (name) and new (productName) field formats
    const allOrders = await db.order.findMany({
      where: { orderStatus: { notIn: ['cancelled', 'rejected'] } },
      select: { items: true },
    });

    type ItemRaw = {
      productName?: string; productImage?: string;
      name?: string; image?: string;
      productId?: string; price?: number; quantity?: number;
    };

    const productSales: Record<string, { name: string; image: string; revenue: number; qty: number; productId?: string }> = {};
    // Collect productIds that need DB lookup (missing name/image)
    const unresolvedIds = new Set<string>();

    for (const order of allOrders) {
      let parsed: ItemRaw[] = [];
      try { parsed = JSON.parse(order.items); } catch { continue; }
      for (const item of parsed) {
        // Support both old format (name/image) and new format (productName/productImage)
        const itemName = item.productName || item.name || '';
        const itemImage = item.productImage || item.image || '';
        const pid = item.productId;

        const key = pid || itemName || 'Unknown';
        if (!productSales[key]) {
          productSales[key] = {
            name: itemName || '',
            image: itemImage || '',
            revenue: 0,
            qty: 0,
            productId: pid || undefined,
          };
          // Track products that need DB resolution
          if (pid && !itemName) unresolvedIds.add(pid);
          if (pid && !itemImage) unresolvedIds.add(pid);
        }
        productSales[key].revenue += (item.price || 0) * (item.quantity || 1);
        productSales[key].qty += item.quantity || 1;
      }
    }

    // Resolve missing product names/images from database
    if (unresolvedIds.size > 0) {
      const dbProducts = await db.product.findMany({
        where: { id: { in: Array.from(unresolvedIds) } },
        select: { id: true, name: true, image: true },
      });
      const productLookup = new Map(dbProducts.map((p) => [p.id, p]));
      for (const entry of Object.values(productSales)) {
        if (entry.productId && (!entry.name || !entry.image)) {
          const dbProduct = productLookup.get(entry.productId);
          if (dbProduct) {
            if (!entry.name) entry.name = dbProduct.name;
            if (!entry.image) entry.image = dbProduct.image || '';
          }
        }
      }
    }

    const topProducts = Object.values(productSales)
      .filter((p) => p.name) // only include products with a valid name
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return NextResponse.json({
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      totalProducts,
      totalUsers,
      recentOrders: recentOrdersFormatted,
      ordersByStatus,
      dailyRevenue,
      topProducts,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
