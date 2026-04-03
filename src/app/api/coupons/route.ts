import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const coupons = await db.coupon.findMany({
      where: {
        active: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { code, orderTotal } = await request.json();

    if (!code || orderTotal === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: code, orderTotal' },
        { status: 400 }
      );
    }

    const coupon = await db.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: 'Invalid coupon code', valid: false },
        { status: 404 }
      );
    }

    if (!coupon.active) {
      return NextResponse.json(
        { error: 'This coupon is no longer active', valid: false },
        { status: 400 }
      );
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return NextResponse.json(
        { error: 'This coupon has expired', valid: false },
        { status: 400 }
      );
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { error: 'This coupon has reached its maximum usage limit', valid: false },
        { status: 400 }
      );
    }

    if (orderTotal < coupon.minOrder) {
      return NextResponse.json(
        {
          error: `Minimum order amount for this coupon is ₹${coupon.minOrder}`,
          valid: false,
          minOrder: coupon.minOrder,
        },
        { status: 400 }
      );
    }

    let discountAmount: number;
    if (coupon.type === 'percentage') {
      discountAmount = Math.round((orderTotal * coupon.discount) / 100 * 100) / 100;
    } else {
      discountAmount = coupon.discount;
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      discount: coupon.discount,
      discountAmount,
      message: `Coupon applied! You save ₹${discountAmount}`,
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}
