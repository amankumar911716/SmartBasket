import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email is required.' },
        { status: 400 }
      );
    }

    const trimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmed)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const existing = await db.$queryRawUnsafe(
      `SELECT id, isActive FROM NewsletterSubscriber WHERE email = ?`,
      trimmed
    ) as Array<{ id: string; isActive: boolean }>;

    if (existing && existing.length > 0) {
      if (existing[0].isActive) {
        return NextResponse.json(
          { success: true, message: 'You are already subscribed! Thank you. 😊' },
          { status: 200 }
        );
      } else {
        // Re-activate
        await db.$executeRawUnsafe(
          `UPDATE NewsletterSubscriber SET isActive = 1 WHERE email = ?`,
          trimmed
        );
        return NextResponse.json(
          { success: true, message: 'Welcome back! Your subscription has been reactivated. 🎉' },
          { status: 200 }
        );
      }
    }

    // Insert new subscriber
    await db.$executeRawUnsafe(
      `INSERT INTO NewsletterSubscriber (id, email, isActive, createdAt) VALUES (lower(hex(randomblob(16))), ?, 1, datetime('now'))`,
      trimmed
    );

    return NextResponse.json(
      { success: true, message: 'Successfully subscribed! Welcome to SmartBasket. 🎉' },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Subscription failed.';
    // Handle unique constraint error
    if (typeof msg === 'string' && msg.includes('UNIQUE')) {
      return NextResponse.json(
        { success: true, message: 'You are already subscribed! Thank you. 😊' },
        { status: 200 }
      );
    }
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}
