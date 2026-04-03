import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { createHash, randomBytes } from 'crypto';

// Generate a 6-digit OTP
function generateOTP(): string {
  const num = parseInt(randomBytes(3).toString('hex'), 16);
  return (num % 1000000).toString().padStart(6, '0');
}

// Generate a secure token
function generateToken(): string {
  return createHash('sha256').update(`${randomBytes(32).toString('hex')}-${Date.now()}`).digest('hex');
}

// Raw SQL helpers to bypass Prisma client schema cache for resetToken fields
async function setResetToken(userId: string, token: string, expiry: Date) {
  await db.$executeRawUnsafe(
    `UPDATE User SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?`,
    token,
    expiry.toISOString(),
    userId,
  );
}

async function clearResetToken(userId: string) {
  await db.$executeRawUnsafe(
    `UPDATE User SET resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?`,
    userId,
  );
}

async function getResetTokenData(userId: string): Promise<{ resetToken: string | null; resetTokenExpiry: string | null } | null> {
  const rows = await db.$queryRawUnsafe<Array<{ resetToken: string | null; resetTokenExpiry: string | null }>>(
    `SELECT resetToken, resetTokenExpiry FROM User WHERE id = ?`,
    userId,
  );
  return rows[0] ?? null;
}

async function updatePasswordRaw(userId: string, hashedPassword: string) {
  await db.$executeRawUnsafe(
    `UPDATE User SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?`,
    hashedPassword,
    userId,
  );
}

// POST /api/auth/forgot-password — request OTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = request.nextUrl;
    const action = searchParams.get('action');

    // Step 1: Request OTP
    if (action === 'request-otp') {
      const { identifier } = body;

      if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
        return NextResponse.json(
          { error: 'Please provide your email address or phone number.' },
          { status: 400 }
        );
      }

      const trimmed = identifier.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
      const isPhone = /^[0-9]{10}$/.test(trimmed.replace(/\s/g, ''));

      if (!isEmail && !isPhone) {
        return NextResponse.json(
          { error: 'Please enter a valid email address or 10-digit phone number.' },
          { status: 400 }
        );
      }

      // Find user (using standard Prisma for known fields)
      let user;
      if (isEmail) {
        user = await db.user.findFirst({
          where: { email: trimmed.toLowerCase(), role: 'user' },
        });
      } else {
        const phoneClean = trimmed.replace(/\s/g, '');
        user = await db.user.findFirst({
          where: { phone: phoneClean, role: 'user' },
        });
      }

      if (!user) {
        return NextResponse.json({
          success: true,
          message: 'If an account exists with this identifier, a verification code has been sent.',
          masked: isEmail
            ? trimmed.replace(/(.{2})(.*)(@.*)/, '$1***$3')
            : trimmed.replace(/(.{3})(.*)(.{2})/, '$1****$3'),
        });
      }

      if (!user.isActive) {
        return NextResponse.json({
          success: true,
          message: 'If an account exists with this identifier, a verification code has been sent.',
          masked: isEmail
            ? trimmed.replace(/(.{2})(.*)(@.*)/, '$1***$3')
            : trimmed.replace(/(.{3})(.*)(.{2})/, '$1****$3'),
        });
      }

      // Generate OTP and token
      const otp = generateOTP();
      const token = generateToken();
      const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Use raw SQL to set reset token (bypasses Prisma schema cache)
      await setResetToken(user.id, `${token}:${otp}`, expiry);

      return NextResponse.json({
        success: true,
        message: 'Verification code sent successfully.',
        masked: isEmail
          ? trimmed.replace(/(.{2})(.*)(@.*)/, '$1***$3')
          : trimmed.replace(/(.{3})(.*)(.{2})/, '$1****$3'),
        // Include OTP for demo/testing (remove in production)
        otp: otp,
        expiresIn: '10 minutes',
      });
    }

    // Step 2: Verify OTP
    if (action === 'verify-otp') {
      const { identifier, otp } = body;

      if (!identifier || !otp) {
        return NextResponse.json(
          { error: 'Please provide your identifier and verification code.' },
          { status: 400 }
        );
      }

      const trimmed = identifier.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

      // Find user
      let user;
      if (isEmail) {
        user = await db.user.findFirst({
          where: { email: trimmed.toLowerCase(), role: 'user' },
        });
      } else {
        user = await db.user.findFirst({
          where: { phone: trimmed.replace(/\s/g, ''), role: 'user' },
        });
      }

      if (!user) {
        return NextResponse.json(
          { error: 'Invalid or expired verification code. Please request a new one.' },
          { status: 400 }
        );
      }

      // Get reset token data via raw SQL
      const resetData = await getResetTokenData(user.id);

      if (!resetData || !resetData.resetToken) {
        return NextResponse.json(
          { error: 'Invalid or expired verification code. Please request a new one.' },
          { status: 400 }
        );
      }

      // Check token expiry
      if (resetData.resetTokenExpiry && new Date(resetData.resetTokenExpiry) < new Date()) {
        await clearResetToken(user.id);
        return NextResponse.json(
          { error: 'Verification code has expired. Please request a new one.' },
          { status: 400 }
        );
      }

      // Verify OTP
      const storedParts = resetData.resetToken.split(':');
      const storedOTP = storedParts[storedParts.length - 1];

      if (storedOTP !== otp.trim()) {
        return NextResponse.json(
          { error: 'Invalid verification code. Please check and try again.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Verification successful. You can now set a new password.',
        resetToken: resetData.resetToken,
      });
    }

    // Step 3: Reset password
    if (action === 'reset-password') {
      const { identifier, otp, newPassword, confirmPassword } = body;

      if (!identifier || !otp || !newPassword || !confirmPassword) {
        return NextResponse.json(
          { error: 'All fields are required.' },
          { status: 400 }
        );
      }

      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long.' },
          { status: 400 }
        );
      }

      if (newPassword !== confirmPassword) {
        return NextResponse.json(
          { error: 'Password and confirm password do not match.' },
          { status: 400 }
        );
      }

      const trimmed = identifier.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

      // Find user
      let user;
      if (isEmail) {
        user = await db.user.findFirst({
          where: { email: trimmed.toLowerCase(), role: 'user' },
        });
      } else {
        user = await db.user.findFirst({
          where: { phone: trimmed.replace(/\s/g, ''), role: 'user' },
        });
      }

      if (!user) {
        return NextResponse.json(
          { error: 'Invalid or expired session. Please start the password reset process again.' },
          { status: 400 }
        );
      }

      // Get reset token data via raw SQL
      const resetData = await getResetTokenData(user.id);

      if (!resetData || !resetData.resetToken) {
        return NextResponse.json(
          { error: 'Invalid or expired session. Please start the password reset process again.' },
          { status: 400 }
        );
      }

      // Check token expiry
      if (resetData.resetTokenExpiry && new Date(resetData.resetTokenExpiry) < new Date()) {
        await clearResetToken(user.id);
        return NextResponse.json(
          { error: 'Session has expired. Please request a new verification code.' },
          { status: 400 }
        );
      }

      // Verify OTP one final time
      const storedParts = resetData.resetToken.split(':');
      const storedOTP = storedParts[storedParts.length - 1];

      if (storedOTP !== otp.trim()) {
        return NextResponse.json(
          { error: 'Invalid verification code. Please start over.' },
          { status: 400 }
        );
      }

      // Update password and clear reset token via raw SQL
      const hashedPassword = hashPassword(newPassword);
      await updatePasswordRaw(user.id, hashedPassword);

      return NextResponse.json({
        success: true,
        message: 'Password has been reset successfully. You can now login with your new password.',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use request-otp, verify-otp, or reset-password.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
