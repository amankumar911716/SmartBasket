import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/password';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const action = searchParams.get('action');
    const body = await request.json();

    // Register action
    if (action === 'register') {
      const { name, email, phone, password } = body;

      if (!name || !email || !phone || !password) {
        return NextResponse.json(
          { error: 'Missing required fields: name, email, phone, password' },
          { status: 400 }
        );
      }

      if (typeof name !== 'string' || name.trim().length < 2) {
        return NextResponse.json(
          { error: 'Name must be at least 2 characters' },
          { status: 400 }
        );
      }

      if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { error: 'Please enter a valid email address' },
          { status: 400 }
        );
      }

      if (typeof password !== 'string' || password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }

      // Check for existing user with same email and 'user' role
      const existingUser = await db.user.findFirst({
        where: { email: email.trim().toLowerCase(), role: 'user' },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this email already exists. If you already have an account, please login.' },
          { status: 409 }
        );
      }

      const hashedPassword = hashPassword(password);

      const user = await db.user.create({
        data: {
          name,
          email: email.trim().toLowerCase(),
          phone,
          role: 'user',
          avatar: '',
          password: hashedPassword,
          isActive: true,
        },
      });

      return NextResponse.json({ user }, { status: 201 });
    }

    // Login action (default)
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find all users with this email (may be admin + user)
    const users = await db.user.findMany({
      where: { email: email.trim().toLowerCase() },
    });

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found. Please register first.' },
        { status: 404 }
      );
    }

    // Try to match password against all accounts with this email
    let matchedUser: typeof users[0] | null = null;
    let deactivatedUsers: typeof users = [];

    for (const user of users) {
      if (!user.isActive) {
        deactivatedUsers.push(user);
        continue;
      }
      const isPasswordValid = verifyPassword(password, user.password);
      if (isPasswordValid) {
        matchedUser = user;
        break;
      }
    }

    // If a deactivated user matched, report deactivation
    if (!matchedUser && deactivatedUsers.length > 0) {
      // Check if any deactivated user has matching password
      for (const user of deactivatedUsers) {
        const isPasswordValid = verifyPassword(password, user.password);
        if (isPasswordValid) {
          return NextResponse.json(
            {
              error: 'Your account has been deactivated by an administrator. Please contact support if you believe this is an error.',
              code: 'ACCOUNT_INACTIVE',
            },
            { status: 403 }
          );
        }
      }
    }

    // No password matched any account
    if (!matchedUser) {
      return NextResponse.json(
        {
          error: 'Invalid email or password. Please check your credentials and try again.',
          code: 'INVALID_CREDENTIALS',
        },
        { status: 401 }
      );
    }

    // Update lastLoginAt
    await db.user.update({
      where: { id: matchedUser.id },
      data: { lastLoginAt: new Date() },
    });

    return NextResponse.json(matchedUser);
  } catch (error: unknown) {
    console.error('Error in auth:', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as Record<string, unknown>).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
