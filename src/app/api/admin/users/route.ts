import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// Helper to log activity
async function logActivity(userId: string, action: string, details: string, performedBy: string) {
  try {
    await db.activityLog.create({
      data: {
        userId,
        action,
        details,
        performedBy,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// ─── GET: List users with filtering, search, pagination, sorting, and activity logs ────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const includeLogs = searchParams.get('logs') === 'true';
    const targetUserId = searchParams.get('userId') || '';
    const sortBy = searchParams.get('sortBy') || 'newest';

    // If userId is provided, return a single user with their activity logs
    if (targetUserId) {
      const user = await db.user.findUnique({
        where: { id: targetUserId },
        include: {
          _count: {
            select: { orders: true, reviews: true, activityLogs: true },
          },
          activityLogs: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({
        data: [{
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt?.toISOString() || null,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          _count: user._count,
          activityLogs: user.activityLogs.map((log) => ({
            id: log.id,
            action: log.action,
            details: log.details,
            performedBy: log.performedBy,
            createdAt: log.createdAt.toISOString(),
          })),
        }],
        total: 1,
        page: 1,
        limit: 1,
        totalPages: 1,
      });
    }

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Build orderBy clause based on sortBy parameter
    let orderBy: Prisma.UserOrderByWithRelationInput;
    switch (sortBy) {
      case 'name_asc':
        orderBy = { name: 'asc' };
        break;
      case 'name_desc':
        orderBy = { name: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'recent_login':
        orderBy = { lastLoginAt: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const [users, total, activeCount, inactiveCount, adminCount] = await Promise.all([
      db.user.findMany({
        where,
        include: {
          _count: {
            select: { orders: true, reviews: true },
          },
          ...(includeLogs ? {
            activityLogs: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          } : {}),
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
      db.user.count({ where: { isActive: true } }),
      db.user.count({ where: { isActive: false } }),
      db.user.count({ where: { role: 'admin' } }),
    ]);

    const result = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      _count: user._count,
      ...(includeLogs ? {
        recentLogs: (user as unknown as { activityLogs?: Array<{ id: string; action: string; details: string; performedBy: string; createdAt: Date }> }).activityLogs?.map((log) => ({
          id: log.id,
          action: log.action,
          details: log.details,
          performedBy: log.performedBy,
          createdAt: log.createdAt.toISOString(),
        })) || [],
      } : {}),
    }));

    return NextResponse.json({
      data: result,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      activeCount,
      inactiveCount,
      adminCount,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// ─── POST: Create a new user ────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, role } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters long' },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Name must be less than 100 characters' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    if (phone && typeof phone === 'string') {
      if (phone.trim().length > 20) {
        return NextResponse.json(
          { error: 'Phone number is too long (max 20 characters)' },
          { status: 400 }
        );
      }
      if (phone.trim() && !/^[\d\s\-+().]+$/.test(phone.trim())) {
        return NextResponse.json(
          { error: 'Phone number contains invalid characters' },
          { status: 400 }
        );
      }
    }

    const validRoles = ['admin', 'user'];
    const userRole = validRoles.includes(role) ? role : 'user';

    // Check for existing user with same email and role
    const existingUser = await db.user.findFirst({
      where: { email: email.trim().toLowerCase(), role: userRole },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: `A user with this email already exists as "${userRole}".` },
        { status: 409 }
      );
    }

    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : '',
        role: userRole,
        avatar: '',
        isActive: true,
      },
      include: {
        _count: {
          select: { orders: true, reviews: true },
        },
      },
    });

    // Log the creation activity
    await logActivity(user.id, 'USER_CREATED', `Account created with role "${userRole}"`, 'system');

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      _count: user._count,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating user:', error);

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
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// ─── PUT: Update user status (active/inactive) ──────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, isActive, performedBy } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (isActive === undefined || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive field is required (boolean)' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deactivating admin accounts
    if (user.role === 'admin' && !isActive) {
      return NextResponse.json(
        { error: 'Admin accounts cannot be deactivated' },
        { status: 403 }
      );
    }

    // Skip if status hasn't changed
    if (user.isActive === isActive) {
      return NextResponse.json(
        { error: `User is already ${isActive ? 'active' : 'inactive'}` },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { isActive },
      include: {
        _count: {
          select: { orders: true, reviews: true },
        },
      },
    });

    // Log the status change
    const action = isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED';
    const details = `Account status changed from ${user.isActive ? 'Active' : 'Inactive'} to ${isActive ? 'Active' : 'Inactive'}`;
    await logActivity(userId, action, details, performedBy || 'admin');

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      isActive: updatedUser.isActive,
      lastLoginAt: updatedUser.lastLoginAt?.toISOString() || null,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
      _count: updatedUser._count,
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}

// ─── PATCH: Edit user details (name, phone, role) or bulk operations ─────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // ── Bulk status toggle ──
    if (body.bulkAction === 'toggleStatus') {
      const { userIds, isActive, performedBy } = body;
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return NextResponse.json({ error: 'User IDs array is required' }, { status: 400 });
      }
      if (userIds.length > 100) {
        return NextResponse.json({ error: 'Maximum 100 users can be updated at once' }, { status: 400 });
      }
      if (typeof isActive !== 'boolean') {
        return NextResponse.json({ error: 'isActive boolean is required' }, { status: 400 });
      }

      // Filter out admins from deactivation
      const users = await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, role: true, name: true, isActive: true },
      });

      const adminIds = new Set(users.filter(u => u.role === 'admin').map(u => u.id));
      // Also filter out users already in the target state
      const alreadyInState = new Set(users.filter(u => u.isActive === isActive).map(u => u.id));
      const targetIds = userIds.filter((id: string) => !adminIds.has(id) && !alreadyInState.has(id));

      if (targetIds.length === 0) {
        const reason = adminIds.size > 0
          ? 'No eligible users to update (admin accounts and users already in target state were skipped)'
          : 'All selected users are already in the target state';
        return NextResponse.json({ error: reason }, { status: 400 });
      }

      const result = await db.user.updateMany({
        where: { id: { in: targetIds } },
        data: { isActive },
      });

      // Log activity for each user
      for (const id of targetIds) {
        const action = isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED';
        await logActivity(id, action, `Bulk status change to ${isActive ? 'Active' : 'Inactive'}`, performedBy || 'admin');
      }

      return NextResponse.json({
        success: true,
        updatedCount: result.count,
        skippedAdmins: adminIds.size,
        skippedAlreadyInState: alreadyInState.size,
        message: `${result.count} user(s) ${isActive ? 'activated' : 'deactivated'} successfully.${adminIds.size > 0 ? ` ${adminIds.size} admin account(s) were skipped.` : ''}${alreadyInState.size > 0 ? ` ${alreadyInState.size} user(s) were already in target state.` : ''}`,
      });
    }

    // ── Bulk delete ──
    if (body.bulkAction === 'delete') {
      const { userIds, performedBy } = body;
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return NextResponse.json({ error: 'User IDs array is required' }, { status: 400 });
      }
      if (userIds.length > 100) {
        return NextResponse.json({ error: 'Maximum 100 users can be deleted at once' }, { status: 400 });
      }

      const users = await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, role: true, name: true },
      });

      const adminIds = new Set(users.filter(u => u.role === 'admin').map(u => u.id));
      const targetIds = userIds.filter((id: string) => !adminIds.has(id));

      if (targetIds.length === 0) {
        return NextResponse.json(
          { error: 'No eligible users to delete (admin accounts cannot be deleted)' },
          { status: 400 }
        );
      }

      // Log deletion for each user BEFORE deleting (cascade will remove activity logs)
      for (const id of targetIds) {
        const user = users.find(u => u.id === id);
        await logActivity(id, 'USER_DELETED', `Account "${user?.name}" permanently deleted`, performedBy || 'admin');
      }

      // Delete in transaction
      await db.$transaction(async (tx) => {
        await tx.cartItem.deleteMany({ where: { userId: { in: targetIds } } });
        await tx.orderItem.deleteMany({
          where: { order: { userId: { in: targetIds } } },
        });
        await tx.order.deleteMany({ where: { userId: { in: targetIds } } });
        await tx.review.deleteMany({ where: { userId: { in: targetIds } } });
        await tx.address.deleteMany({ where: { userId: { in: targetIds } } });
        await tx.activityLog.deleteMany({ where: { userId: { in: targetIds } } });
        await tx.user.deleteMany({ where: { id: { in: targetIds } } });
      });

      return NextResponse.json({
        success: true,
        deletedCount: targetIds.length,
        skippedAdmins: adminIds.size,
        message: `${targetIds.length} user(s) permanently deleted.${adminIds.size > 0 ? ` ${adminIds.size} admin account(s) were skipped.` : ''}`,
      });
    }

    // ── Single user edit ──
    const { userId, name, phone, role, isActive, performedBy } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Build update data
    const data: Record<string, unknown> = {};
    const changes: string[] = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return NextResponse.json(
          { error: 'Name must be at least 2 characters long' },
          { status: 400 }
        );
      }
      if (name.trim().length > 100) {
        return NextResponse.json(
          { error: 'Name must be less than 100 characters' },
          { status: 400 }
        );
      }
      if (name.trim() !== user.name) {
        changes.push(`Name: "${user.name}" → "${name.trim()}"`);
      }
      data.name = name.trim();
    }

    if (phone !== undefined) {
      const phoneStr = typeof phone === 'string' ? phone.trim() : '';
      if (phoneStr.length > 20) {
        return NextResponse.json(
          { error: 'Phone number is too long (max 20 characters)' },
          { status: 400 }
        );
      }
      if (phoneStr && !/^[\d\s\-+().]+$/.test(phoneStr)) {
        return NextResponse.json(
          { error: 'Phone number contains invalid characters' },
          { status: 400 }
        );
      }
      if (phoneStr !== user.phone) {
        changes.push(`Phone: "${user.phone}" → "${phoneStr || 'Not provided'}"`);
      }
      data.phone = phoneStr;
    }

    if (role !== undefined) {
      const validRoles = ['admin', 'user'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role. Must be "admin" or "user"' },
          { status: 400 }
        );
      }
      if (role !== user.role) {
        changes.push(`Role: "${user.role}" → "${role}"`);
      }
      data.role = role;
    }

    if (isActive !== undefined) {
      if (user.role === 'admin' && !isActive) {
        return NextResponse.json(
          { error: 'Admin accounts cannot be deactivated' },
          { status: 403 }
        );
      }
      if (isActive !== user.isActive) {
        changes.push(`Status: ${user.isActive ? 'Active' : 'Inactive'} → ${isActive ? 'Active' : 'Inactive'}`);
      }
      data.isActive = isActive;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No changes detected' },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data,
      include: {
        _count: {
          select: { orders: true, reviews: true },
        },
      },
    });

    // Log the changes
    if (changes.length > 0) {
      const hasStatusChange = data.isActive !== undefined;
      const action = hasStatusChange
        ? (data.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED')
        : 'USER_UPDATED';
      await logActivity(userId, action, `Profile updated: ${changes.join(', ')}`, performedBy || 'admin');
    }

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      isActive: updatedUser.isActive,
      lastLoginAt: updatedUser.lastLoginAt?.toISOString() || null,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
      _count: updatedUser._count,
    });
  } catch (error) {
    console.error('Error editing user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// ─── DELETE: Permanently delete a user and all related data ─────────────────
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, performedBy } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { orders: true, reviews: true, addresses: true, cartItems: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting admin accounts
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Admin accounts cannot be deleted' },
        { status: 403 }
      );
    }

    // Log deletion before actual delete (cascade will remove logs)
    await logActivity(userId, 'USER_DELETED', `Account "${user.name}" (${user.email}) permanently deleted by ${performedBy || 'admin'}`, performedBy || 'admin');

    // Delete related records in a transaction
    await db.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { userId } });
      await tx.orderItem.deleteMany({
        where: {
          order: { userId },
        },
      });
      await tx.order.deleteMany({ where: { userId } });
      await tx.review.deleteMany({ where: { userId } });
      await tx.address.deleteMany({ where: { userId } });
      await tx.activityLog.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({
      success: true,
      message: `User "${user.name}" has been permanently deleted along with ${user._count.orders} order(s), ${user._count.reviews} review(s), and ${user._count.addresses} address(es).`,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
