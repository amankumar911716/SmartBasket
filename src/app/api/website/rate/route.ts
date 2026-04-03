import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Read session from cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('smartbasket-session')?.value;
    let session: { userId?: string; email?: string } = {};
    try {
      session = JSON.parse(sessionCookie || '{}');
    } catch {}

    if (!session.userId) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to rate the website.' },
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

    // Insert the website rating
    const ratingId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.$executeRawUnsafe(
      `INSERT INTO WebsiteRating (id, userId, rating, comment, createdAt) VALUES (?, ?, ?, ?, ?)`,
      ratingId,
      userId,
      ratingValue,
      comment || null,
      now
    );

    // Calculate average rating and total count
    const stats = await db.$queryRawUnsafe<any[]>(
      `SELECT AVG(rating) as averageRating, COUNT(*) as totalCount FROM WebsiteRating`
    );

    const averageRating = Math.round((stats[0].averageRating || 0) * 100) / 100;
    const totalCount = Number(stats[0].totalCount) || 0;

    return NextResponse.json({
      success: true,
      message: 'Website rating submitted successfully.',
      averageRating,
      totalCount,
    });
  } catch (error) {
    console.error('Error submitting website rating:', error);
    return NextResponse.json(
      { error: 'Failed to submit website rating.' },
      { status: 500 }
    );
  }
}
