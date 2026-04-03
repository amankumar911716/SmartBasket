import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, type, message } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'Please enter your name (at least 2 characters).' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json(
        { success: false, message: 'Please enter your feedback (at least 10 characters).' },
        { status: 400 }
      );
    }

    const validTypes = ['general', 'complaint', 'suggestion', 'compliment'];
    const feedbackType = validTypes.includes(type) ? type : 'general';

    const trimmedName = name.trim();
    const trimmedEmail = (email || '').trim();
    const trimmedMessage = message.trim();

    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return NextResponse.json(
          { success: false, message: 'Please enter a valid email address.' },
          { status: 400 }
        );
      }
    }

    await db.$executeRawUnsafe(
      `INSERT INTO Feedback (id, name, email, type, message, createdAt) VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, datetime('now'))`,
      trimmedName,
      trimmedEmail,
      feedbackType,
      trimmedMessage
    );

    return NextResponse.json(
      { success: true, message: 'Thank you! Your feedback has been submitted successfully. 🙏' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}
