import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const brand = searchParams.get('brand');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const rating = searchParams.get('rating');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '12', 10)));
    const featured = searchParams.get('featured');

    const where: Prisma.ProductWhereInput = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { brand: { contains: search } },
      ];
    }

    if (brand) {
      where.brand = { contains: brand };
    }

    if (minPrice !== null && minPrice !== '') {
      where.price = { ...(where.price as Prisma.FloatNullableFilter || {}), gte: parseFloat(minPrice) };
    }

    if (maxPrice !== null && maxPrice !== '') {
      where.price = { ...(where.price as Prisma.FloatNullableFilter || {}), lte: parseFloat(maxPrice) };
    }

    if (rating) {
      where.rating = { gte: parseFloat(rating) };
    }

    if (featured !== null && featured !== '') {
      where.featured = featured === 'true';
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = (() => {
      switch (sortBy) {
        case 'price-asc':
          return { price: 'asc' };
        case 'price-desc':
          return { price: 'desc' };
        case 'rating':
          return { rating: 'desc' };
        case 'name':
          return { name: 'asc' };
        case 'newest':
        default:
          return { createdAt: 'desc' };
      }
    })();

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy,
        include: { category: true },
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
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      slug,
      description,
      price,
      mrp,
      unit,
      categoryId,
      image,
      images,
      inStock,
      stock,
      rating,
      reviewCount,
      featured,
      brand,
    } = body;

    if (!name || !slug || !categoryId || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, categoryId, price' },
        { status: 400 }
      );
    }

    const product = await db.product.create({
      data: {
        name,
        slug,
        description: description || '',
        price: parseFloat(price),
        mrp: parseFloat(mrp || price),
        unit: unit || '1 pc',
        categoryId,
        image: image || '',
        images: images || '',
        inStock: inStock !== undefined ? inStock : true,
        stock: stock || 100,
        rating: rating || 4.0,
        reviewCount: reviewCount || 0,
        featured: featured || false,
        brand: brand || '',
      },
      include: { category: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating product:', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as Record<string, unknown>).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'A product with this slug already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
