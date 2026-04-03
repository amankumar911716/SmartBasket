import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: productId } = await context.params;

    // Parse pagination params
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 100) : 20;

    // Verify product exists
    const products = await db.$queryRawUnsafe<any[]>(
      `SELECT id FROM Product WHERE id = ? LIMIT 1`,
      productId
    );

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: 'Product not found.' },
        { status: 404 }
      );
    }

    // Fetch reviews with user name
    const reviews = await db.$queryRawUnsafe<any[]>(
      `SELECT r.id, r.userId, r.productId, r.rating, r.comment, r.createdAt, u.name as userName
       FROM Review r
       LEFT JOIN User u ON r.userId = u.id
       WHERE r.productId = ?
       ORDER BY r.createdAt DESC
       LIMIT ?`,
      productId,
      limit
    );

    // Get aggregate stats
    const stats = await db.$queryRawUnsafe<any[]>(
      `SELECT AVG(rating) as averageRating, COUNT(*) as reviewCount FROM Review WHERE productId = ?`,
      productId
    );

    const averageRating = Math.round((stats[0].averageRating || 0) * 100) / 100;
    const reviewCount = Number(stats[0].reviewCount) || 0;

    // Format reviews for response
    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      userId: review.userId,
      userName: review.userName || 'Anonymous',
      productId: review.productId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt instanceof Date
        ? review.createdAt.toISOString()
        : new Date(review.createdAt).toISOString(),
    }));

    return NextResponse.json({
      success: true,
      reviews: formattedReviews,
      averageRating,
      reviewCount,
    });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews.' },
      { status: 500 }
    );
  }
}
