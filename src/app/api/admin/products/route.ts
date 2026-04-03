import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { brand: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { updates } = await request.json();

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'updates array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate all updates have required fields
    for (const update of updates) {
      if (!update.productId || update.stock === undefined) {
        return NextResponse.json(
          { error: 'Each update must have productId and stock fields' },
          { status: 400 }
        );
      }
      if (update.stock < 0) {
        return NextResponse.json(
          { error: `Stock cannot be negative for product ${update.productId}` },
          { status: 400 }
        );
      }
    }

    // Bulk update stock in a transaction
    const results = await db.$transaction(
      updates.map((update: { productId: string; stock: number }) =>
        db.product.update({
          where: { id: update.productId },
          data: {
            stock: update.stock,
            inStock: update.stock > 0,
          },
          include: { category: true },
        })
      )
    );

    return NextResponse.json({
      message: `Updated stock for ${results.length} products`,
      updatedProducts: results,
    });
  } catch (error: unknown) {
    console.error('Error bulk updating stock:', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as Record<string, unknown>).code === 'P2025'
    ) {
      return NextResponse.json(
        { error: 'One or more products not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update stock' },
      { status: 500 }
    );
  }
}
