import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: productId } = await context.params;

    // Read session from cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('smartbasket-session')?.value;
    let session: { userId?: string; email?: string } = {};
    try {
      session = JSON.parse(sessionCookie || '{}');
    } catch {}

    if (!session.userId) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to rate a product.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, rating, comment } = body;

    // Validate userId matches session
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required.' },
        { status: 400 }
      );
    }

    if (userId !== session.userId) {
      return NextResponse.json(
        { error: 'Authenticated user does not match the provided userId.' },
        { status: 403 }
      );
    }

    // Validate rating
    if (rating === undefined || rating === null) {
      return NextResponse.json(
        { error: 'Rating is required.' },
        { status: 400 }
      );
    }

    const ratingValue = Number(rating);
    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5.' },
        { status: 400 }
      );
    }

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

    // Insert the review
    const reviewId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.$executeRawUnsafe(
      `INSERT INTO Review (id, userId, productId, rating, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      reviewId,
      userId,
      productId,
      ratingValue,
      comment || null,
      now
    );

    // Recalculate average rating and review count
    const stats = await db.$queryRawUnsafe<any[]>(
      `SELECT AVG(rating) as averageRating, COUNT(*) as reviewCount FROM Review WHERE productId = ?`,
      productId
    );

    const averageRating = Math.round((stats[0].averageRating || 0) * 100) / 100;
    const reviewCount = Number(stats[0].reviewCount) || 0;

    // Update the Product row with new average and count
    await db.$executeRawUnsafe(
      `UPDATE Product SET rating = ?, reviewCount = ? WHERE id = ?`,
      averageRating,
      reviewCount,
      productId
    );

    return NextResponse.json({
      success: true,
      message: 'Rating submitted successfully.',
      averageRating,
      reviewCount,
    });
  } catch (error) {
    console.error('Error submitting product rating:', error);
    return NextResponse.json(
      { error: 'Failed to submit rating.' },
      { status: 500 }
    );
  }
}
