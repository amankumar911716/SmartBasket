/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { User, PaginatedResponse } from '@/types';
import { formatFullDate, formatShortDate } from '@/types';
import { toast } from '@/hooks/use-toast';
import {
  Search,
  Users,
  ShieldCheck,
  ShieldX,
  Trash2,
  RefreshCw,
  Mail,
  Phone,
  UserCog,
  Loader2,
  UserCheck,
  Eye,
  UserPlus,
  Pencil,
  Ban,
  ShieldAlert,
  History,
  CheckSquare,
  MoreHorizontal,
  Download,
  Filter,
  ArrowUpDown,
  Clock,
  AlertTriangle,
  CircleCheckBig,
  CircleX,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ActivityLogEntry {
  id: string;
  action: string;
  details: string;
  performedBy: string;
  createdAt: string;
}

interface UserWithCount extends User {
  _count?: { orders: number; reviews: number };
  recentLogs?: ActivityLogEntry[];
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  USER_CREATED: { label: 'Created', color: 'bg-green-100 text-green-700' },
  USER_UPDATED: { label: 'Updated', color: 'bg-blue-100 text-blue-700' },
  USER_ACTIVATED: { label: 'Activated', color: 'bg-emerald-100 text-emerald-700' },
  USER_DEACTIVATED: { label: 'Deactivated', color: 'bg-red-100 text-red-700' },
  USER_DELETED: { label: 'Deleted', color: 'bg-gray-100 text-gray-700' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return 'Never';
  try {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    if (isNaN(then)) return 'Never';
    const diffSec = Math.floor((now - then) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    if (diffSec < 2592000) return `${Math.floor(diffSec / 604800)}w ago`;
    return formatShortDate(dateStr);
  } catch {
    return 'Never';
  }
}

// ─── User Detail Dialog ─────────────────────────────────────────────────────

function UserDetailDialog({
  user,
  open,
  onClose,
}: {
  user: UserWithCount | null;
  open: boolean;
  onClose: () => void;
}) {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setLogsLoading(true);
      fetch(`/api/admin/users?userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data && data.data[0]?.activityLogs) {
            setLogs(data.data[0].activityLogs);
          } else {
            setLogs([]);
          }
        })
        .catch(() => setLogs([]))
        .finally(() => setLogsLoading(false));
    }
  }, [open, user]);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                user.role === 'admin' ? 'bg-violet-500' : 'bg-emerald-500'
              }`}
            >
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="text-left">
              <span className="text-lg">{user.name}</span>
              <p className="text-sm font-normal text-gray-400">{user.email}</p>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            User details and activity log
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Status & Role */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-xs text-gray-600">Status</span>
              <Badge
                className={`${
                  user.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                } text-xs border-0 px-3 py-1`}
              >
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-xs text-gray-600">Role</span>
              <Badge
                className={`${
                  user.role === 'admin'
                    ? 'bg-violet-100 text-violet-700'
                    : 'bg-gray-100 text-gray-600'
                } text-xs border-0 px-3 py-1`}
              >
                {user.role === 'admin' ? 'Administrator' : 'Customer'}
              </Badge>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2.5 text-sm">
              <Phone className="size-4 text-gray-400" />
              <span className="text-gray-600">{user.phone || 'Not provided'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <Mail className="size-4 text-gray-400" />
              <span className="text-gray-600">{user.email}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-emerald-50 rounded-xl text-center">
              <p className="text-lg font-bold text-emerald-700">
                {user._count?.orders ?? 0}
              </p>
              <p className="text-[11px] text-emerald-600">Total Orders</p>
            </div>
            <div className="p-3 bg-violet-50 rounded-xl text-center">
              <p className="text-lg font-bold text-violet-700">
                {user._count?.reviews ?? 0}
              </p>
              <p className="text-[11px] text-violet-600">Reviews</p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="size-3.5 text-gray-400" />
                <span className="text-[11px] text-gray-500">Joined</span>
              </div>
              <p className="text-xs font-medium text-gray-700">
                {formatFullDate(user.createdAt)}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="size-3.5 text-gray-400" />
                <span className="text-[11px] text-gray-500">Last Login</span>
              </div>
              <p className="text-xs font-medium text-gray-700">
                {user.lastLoginAt
                  ? formatRelativeTime(user.lastLoginAt)
                  : 'Never'}
              </p>
            </div>
          </div>

          {/* Activity Log */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-3">
              <History className="size-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-700">
                Activity Log
              </h3>
            </div>
            {logsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                No activity recorded
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {logs.map((log) => {
                  const actionInfo =
                    ACTION_LABELS[log.action] || {
                      label: log.action,
                      color: 'bg-gray-100 text-gray-600',
                    };
                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-2.5 p-2 bg-gray-50 rounded-lg"
                    >
                      <Badge
                        className={`${actionInfo.color} text-[10px] border-0 shrink-0 mt-0.5`}
                      >
                        {actionInfo.label}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {log.details}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          by {log.performedBy} &middot;{' '}
                          {formatFullDate(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add / Edit User Dialog ─────────────────────────────────────────────────

function UserFormDialog({
  mode,
  user,
  open,
  onClose,
  onSubmit,
}: {
  mode: 'add' | 'edit';
  user: UserWithCount | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    email: string;
    phone: string;
    role: string;
    isActive?: boolean;
  }) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('user');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && user) {
        setName(user.name);
        setEmail(user.email);
        setPhone(user.phone);
        setRole(user.role);
        setIsActive(user.isActive);
      } else {
        setName('');
        setEmail('');
        setPhone('');
        setRole('user');
        setIsActive(true);
      }
      setErrors({});
      setLoading(false);
    }
  }, [open, mode, user]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'A valid email address is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await onSubmit({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      isActive,
    });
    setLoading(false);
  };

  const title = mode === 'add' ? 'Add New User' : 'Edit User';
  const description =
    mode === 'add'
      ? 'Create a new user account. They will be set to Active by default.'
      : `Edit details for "${user?.name}"`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="user-name" className="text-sm font-medium">
              Full Name *
            </Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="h-10"
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-email" className="text-sm font-medium">
              Email Address *
            </Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="h-10"
              readOnly={mode === 'edit'}
            />
            {mode === 'edit' && (
              <p className="text-[11px] text-gray-400">
                Email cannot be changed after creation
              </p>
            )}
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-phone" className="text-sm font-medium">
              Phone Number
            </Label>
            <Input
              id="user-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Customer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === 'edit' && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <Label className="text-sm font-medium">Account Status</Label>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Inactive users cannot log in
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium ${
                    isActive ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </span>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  disabled={user?.role === 'admin'}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading && <Loader2 className="size-4 mr-1.5 animate-spin" />}
            {mode === 'add' ? 'Create User' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Bulk Actions Dialog ────────────────────────────────────────────────────

function BulkActionsDialog({
  open,
  onClose,
  selectedIds,
  selectedUsers,
  onAction,
}: {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  selectedUsers: UserWithCount[];
  onAction: (action: 'activate' | 'deactivate' | 'delete') => void;
}) {
  const [loading, setLoading] = useState(false);

  const nonAdminCount = selectedUsers.filter((u) => u.role !== 'admin').length;
  const adminCount = selectedUsers.filter((u) => u.role === 'admin').length;
  const hasActive = selectedUsers.some((u) => u.isActive && u.role !== 'admin');
  const hasInactive = selectedUsers.some(
    (u) => !u.isActive && u.role !== 'admin',
  );

  const handleAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    setLoading(true);
    await onAction(action);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="size-5 text-green-600" />
            Bulk Actions
          </DialogTitle>
          <DialogDescription>
            {selectedIds.length} user(s) selected. Choose an action below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {adminCount > 0 && (
            <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
              <ShieldAlert className="size-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">
                {adminCount} admin account(s) will be skipped. Admin accounts
                cannot be modified.
              </p>
            </div>
          )}

          <p className="text-sm text-gray-600">
            <span className="font-medium">{nonAdminCount}</span> eligible
            user(s) for bulk operations.
          </p>

          <div className="grid gap-2">
            {hasInactive && (
              <Button
                variant="outline"
                className="justify-start gap-2 h-11 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
                onClick={() => handleAction('activate')}
                disabled={loading || nonAdminCount === 0}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserCheck className="size-4" />
                )}
                Activate Selected Users
              </Button>
            )}
            {hasActive && (
              <Button
                variant="outline"
                className="justify-start gap-2 h-11 text-amber-700 border-amber-200 hover:bg-amber-50 hover:text-amber-800"
                onClick={() => handleAction('deactivate')}
                disabled={loading || nonAdminCount === 0}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Ban className="size-4" />
                )}
                Deactivate Selected Users
              </Button>
            )}
            <Button
              variant="outline"
              className="justify-start gap-2 h-11 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={() => handleAction('delete')}
              disabled={loading || nonAdminCount === 0}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete Selected Users Permanently
            </Button>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Status Toggle Confirmation Dialog ──────────────────────────────────────

function StatusToggleDialog({
  user,
  open,
  onClose,
  onConfirm,
  loading,
}: {
  user: UserWithCount | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!user) return null;

  const willActivate = !user.isActive;

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle
            className={`flex items-center gap-2 ${willActivate ? 'text-green-600' : 'text-amber-600'}`}
          >
            {willActivate ? (
              <CircleCheckBig className="size-5" />
            ) : (
              <CircleX className="size-5" />
            )}
            {willActivate ? 'Activate User?' : 'Deactivate User?'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                    user.role === 'admin' ? 'bg-violet-500' : 'bg-emerald-500'
                  }`}
                >
                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Current Status</p>
                  <p
                    className={`font-semibold mt-0.5 ${user.isActive ? 'text-green-600' : 'text-red-500'}`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">New Status</p>
                  <p
                    className={`font-semibold mt-0.5 ${willActivate ? 'text-green-600' : 'text-red-500'}`}
                  >
                    {willActivate ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>

              <div
                className={`flex items-start gap-2 p-2.5 rounded-lg border ${
                  willActivate
                    ? 'bg-green-50 border-green-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <AlertTriangle
                  className={`size-4 mt-0.5 shrink-0 ${willActivate ? 'text-green-600' : 'text-amber-600'}`}
                />
                <p
                  className={`text-xs ${willActivate ? 'text-green-700' : 'text-amber-700'}`}
                >
                  {willActivate
                    ? `"${user.name}" will be able to log in and use the platform immediately.`
                    : `"${user.name}" will lose access to the platform immediately. They will not be able to log in until reactivated.`}
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className={
              willActivate
                ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-600'
                : 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-600'
            }
          >
            {loading && <Loader2 className="size-4 mr-1.5 animate-spin" />}
            {willActivate ? 'Confirm Activation' : 'Confirm Deactivation'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Delete Confirmation Dialog ─────────────────────────────────────────────

function DeleteConfirmDialog({
  user,
  open,
  onClose,
  onConfirm,
  loading,
}: {
  user: UserWithCount | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="size-5" />
            Delete User Permanently?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                    user.role === 'admin' ? 'bg-violet-500' : 'bg-emerald-500'
                  }`}
                >
                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Role</p>
                  <p className="font-semibold mt-0.5 text-gray-700">
                    {user.role === 'admin' ? 'Admin' : 'Customer'}
                  </p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Orders</p>
                  <p className="font-semibold mt-0.5 text-gray-700">
                    {user._count?.orders ?? 0}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="size-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700">
                  This will permanently delete{' '}
                  <strong>{user.name}</strong> and{' '}
                  <strong>all related data</strong> including orders, reviews,
                  addresses, cart items, and activity logs. This action{' '}
                  <strong>cannot be undone</strong>.
                </p>
              </div>

              {(user._count?.orders ?? 0) > 0 && (
                <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="size-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    <strong>Warning:</strong> This user has{' '}
                    {user._count?.orders} order(s). All order history and
                    associated data will be permanently erased.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
          >
            {loading && <Loader2 className="size-4 mr-1.5 animate-spin" />}
            Delete Permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AdminUserManager() {
  const [users, setUsers] = useState<UserWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [sortBy, setSortBy] = useState('newest');

  // Toggle status confirmation
  const [toggleUser, setToggleUser] = useState<UserWithCount | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Delete dialog
  const [deleteUser, setDeleteUser] = useState<UserWithCount | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // User detail dialog
  const [viewUser, setViewUser] = useState<UserWithCount | null>(null);

  // Add / Edit dialog
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserWithCount | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  // Search debounce
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '20');
    params.set('logs', 'true');
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (sortBy) params.set('sortBy', sortBy);

    fetch(`/api/admin/users?${params}`)
      .then((res) => res.json())
      .then(
        (data: PaginatedResponse<User> & {
          activeCount?: number;
          inactiveCount?: number;
          adminCount?: number;
        }) => {
          setUsers(data.data || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
          setActiveCount(data.activeCount || 0);
          setInactiveCount(data.inactiveCount || 0);
          setAdminCount(data.adminCount || 0);
          setSelectedIds(new Set());
        },
      )
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [page, search, roleFilter, statusFilter, sortBy]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  // Re-fetch users when browser tab/window regains focus
  useEffect(() => {
    const handleFocus = () => {
      if (!loading) {
        fetchUsers();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchUsers, loading]);

  // Search debounce handler
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 300);
  };

  // ─── Selection ────────────────────────────────────────────────────────────

  const allVisibleNonAdminIds = users
    .filter((u) => u.role !== 'admin')
    .map((u) => u.id);
  const allSelected =
    allVisibleNonAdminIds.length > 0 &&
    allVisibleNonAdminIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set([...selectedIds, ...allVisibleNonAdminIds]));
    }
  };

  const toggleSelectUser = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleConfirmToggleStatus = async () => {
    if (!toggleUser) return;
    setToggleLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: toggleUser.id,
          isActive: !toggleUser.isActive,
          performedBy: 'admin',
        }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === toggleUser.id ? { ...u, isActive: !u.isActive } : u,
          ),
        );
        setActiveCount((prev) => prev + (toggleUser.isActive ? -1 : 1));
        setInactiveCount((prev) => prev + (toggleUser.isActive ? 1 : -1));
        toast({
          title: `User ${toggleUser.isActive ? 'Deactivated' : 'Activated'}`,
          description: `"${toggleUser.name}" is now ${toggleUser.isActive ? 'inactive and cannot log in' : 'active'}.`,
        });
        setToggleUser(null);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update user status',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    }
    setToggleLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteUser) return;
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: deleteUser.id,
          performedBy: 'admin',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
        setTotal((prev) => prev - 1);
        if (deleteUser.isActive) {
          setActiveCount((prev) => prev - 1);
        } else {
          setInactiveCount((prev) => prev - 1);
        }
        if (deleteUser.role === 'admin') {
          setAdminCount((prev) => prev - 1);
        }
        toast({
          title: 'User Deleted',
          description: `"${deleteUser.name}" has been permanently removed from the system.`,
        });
        setDeleteUser(null);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete user',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
    setDeleteLoading(false);
  };

  const handleOpenAdd = () => {
    setFormMode('add');
    setEditUser(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (user: UserWithCount) => {
    setFormMode('edit');
    setEditUser(user);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: {
    name: string;
    email: string;
    phone: string;
    role: string;
    isActive?: boolean;
  }) => {
    if (formMode === 'add') {
      try {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (res.ok && result.id) {
          toast({
            title: 'User Created',
            description: `"${result.name}" has been added as a ${result.role === 'admin' ? 'Admin' : 'Customer'}.`,
          });
          setFormOpen(false);
          fetchUsers();
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to create user',
            variant: 'destructive',
          });
        }
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to create user',
          variant: 'destructive',
        });
      }
    } else if (editUser) {
      try {
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: editUser.id,
            ...data,
            performedBy: 'admin',
          }),
        });
        const result = await res.json();
        if (res.ok && result.id) {
          toast({
            title: 'User Updated',
            description: `"${result.name}" has been updated successfully.`,
          });
          setFormOpen(false);
          setEditUser(null);
          fetchUsers();
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to update user',
            variant: 'destructive',
          });
        }
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to update user',
          variant: 'destructive',
        });
      }
    }
  };

  // ─── Bulk Actions ─────────────────────────────────────────────────────────

  const handleBulkAction = async (
    action: 'activate' | 'deactivate' | 'delete',
  ) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const loadingMsg =
      action === 'delete' ? 'Deleting users...' : 'Updating users...';
    toast({ title: loadingMsg, description: 'Please wait...' });

    try {
      let res: Response;
      if (action === 'delete') {
        res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bulkAction: 'delete',
            userIds: ids,
            performedBy: 'admin',
          }),
        });
      } else {
        res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bulkAction: 'toggleStatus',
            userIds: ids,
            isActive: action === 'activate',
            performedBy: 'admin',
          }),
        });
      }

      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title:
            action === 'delete'
              ? 'Users Deleted'
              : action === 'activate'
                ? 'Users Activated'
                : 'Users Deactivated',
          description: data.message,
        });
        setBulkDialogOpen(false);
        setSelectedIds(new Set());
        fetchUsers();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Bulk operation failed',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Bulk operation failed',
        variant: 'destructive',
      });
    }
  };

  // ─── Export ───────────────────────────────────────────────────────────────

  const handleExport = () => {
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Role',
      'Status',
      'Orders',
      'Last Login',
      'Joined',
    ];
    const rows = users.map((u) => [
      u.name,
      u.email,
      u.phone,
      u.role,
      u.isActive ? 'Active' : 'Inactive',
      (u._count?.orders ?? 0).toString(),
      u.lastLoginAt ? formatFullDate(u.lastLoginAt) : 'Never',
      formatFullDate(u.createdAt),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export Complete', description: 'User data exported as CSV.' });
  };

  // ─── Pagination Window ────────────────────────────────────────────────────

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 3) return [1, 2, 3, 4, 5];
    if (page >= totalPages - 2)
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    return [page - 2, page - 1, page, page + 1, page + 2];
  };

  const startItem = (page - 1) * 20 + 1;
  const endItem = Math.min(page * 20, total);

  // ─── Render ───────────────────────────────────────────────────────────────

  const selectedUsers = users.filter((u) => selectedIds.has(u.id));

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-5">
        {/* ── Summary Cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border shadow-sm p-4 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-800">
                  {total}
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                  Total Users
                </p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <Users className="size-4 sm:size-5 text-gray-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border shadow-sm p-4 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {activeCount}
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                  Active
                </p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <UserCheck className="size-4 sm:size-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border shadow-sm p-4 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-red-500">
                  {inactiveCount}
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                  Inactive
                </p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <Ban className="size-4 sm:size-5 text-red-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border shadow-sm p-4 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-violet-600">
                  {adminCount}
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                  Admins
                </p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <ShieldAlert className="size-4 sm:size-5 text-violet-600" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Filters & Actions Bar ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border shadow-sm p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by name, email, phone..."
                    className="pl-10 h-9"
                  />
                </div>

                {/* Role Filter */}
                <Select
                  value={roleFilter || 'all'}
                  onValueChange={(v) => {
                    setRoleFilter(v === 'all' ? '' : v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[130px] h-9 text-xs">
                    <Filter className="size-3.5 mr-1 text-gray-400" />
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                    <SelectItem value="user">Customers</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select
                  value={statusFilter || 'all'}
                  onValueChange={(v) => {
                    setStatusFilter(v === 'all' ? '' : v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[130px] h-9 text-xs">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select
                  value={sortBy}
                  onValueChange={(v) => {
                    setSortBy(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                    <ArrowUpDown className="size-3.5 mr-1 text-gray-400" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="name_asc">Name A-Z</SelectItem>
                    <SelectItem value="name_desc">Name Z-A</SelectItem>
                    <SelectItem value="recent_login">Recent Login</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleOpenAdd}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white h-9"
                >
                  <UserPlus className="size-3.5 mr-1.5" />
                  <span className="hidden sm:inline">Add User</span>
                  <span className="sm:hidden">Add</span>
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleExport}
                      variant="outline"
                      size="sm"
                      className="h-9"
                    >
                      <Download className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export CSV</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={fetchUsers}
                      variant="outline"
                      size="sm"
                      className="h-9"
                    >
                      <RefreshCw
                        className={`size-3.5 ${loading ? 'animate-spin' : ''}`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between p-2.5 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <CheckSquare className="size-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {selectedIds.size} user(s) selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs text-green-700 border-green-300 hover:bg-green-100"
                    onClick={() => setBulkDialogOpen(true)}
                  >
                    <MoreHorizontal className="size-3.5 mr-1" />
                    Bulk Actions
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-gray-500"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Users Table ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-4 mb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-xs font-semibold w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                    </TableHead>
                    <TableHead className="text-xs font-semibold">User</TableHead>
                    <TableHead className="text-xs font-semibold">Role</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold hidden lg:table-cell">
                      Last Login
                    </TableHead>
                    <TableHead className="text-xs font-semibold hidden sm:table-cell">
                      Joined
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-center hidden md:table-cell">
                      Orders
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-40 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <Users className="size-10 mb-2 opacity-30" />
                          <p className="text-sm font-medium">No users found</p>
                          <p className="text-xs mt-0.5">
                            Try adjusting your search or filters
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow
                        key={user.id}
                        className={`hover:bg-gray-50/50 transition-colors ${
                          !user.isActive ? 'opacity-60' : ''
                        } ${selectedIds.has(user.id) ? 'bg-green-50/50' : ''}`}
                      >
                        {/* Checkbox */}
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(user.id)}
                            onCheckedChange={() => toggleSelectUser(user.id)}
                            disabled={user.role === 'admin'}
                            className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                          />
                        </TableCell>

                        {/* User Info */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                                user.role === 'admin'
                                  ? 'bg-violet-500'
                                  : 'bg-emerald-500'
                              }`}
                            >
                              {user.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate max-w-[160px]">
                                {user.name}
                              </p>
                              <p className="text-xs text-gray-400 truncate max-w-[160px]">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Role */}
                        <TableCell>
                          <Badge
                            className={`text-[10px] border-0 ${
                              user.role === 'admin'
                                ? 'bg-violet-100 text-violet-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {user.role === 'admin' ? 'Admin' : 'Customer'}
                          </Badge>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.isActive}
                              onCheckedChange={() => {
                                if (user.role === 'admin') return;
                                setToggleUser(user);
                              }}
                              disabled={user.role === 'admin'}
                              className={`data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-400 scale-75 ${
                                user.role === 'admin' ? 'opacity-40' : ''
                              }`}
                            />
                            <span
                              className={`text-xs font-medium ${user.isActive ? 'text-green-600' : 'text-red-500'}`}
                            >
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>

                        {/* Last Login */}
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3 text-gray-400" />
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {user.lastLoginAt
                                ? formatRelativeTime(user.lastLoginAt)
                                : 'Never'}
                            </span>
                          </div>
                        </TableCell>

                        {/* Joined */}
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatShortDate(user.createdAt)}
                          </span>
                        </TableCell>

                        {/* Orders */}
                        <TableCell className="text-center hidden md:table-cell">
                          <span className="text-sm font-medium text-gray-700">
                            {user._count?.orders ?? 0}
                          </span>
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <div className="flex items-center justify-end gap-0.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setViewUser(user)}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <Eye className="size-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>View details</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleOpenEdit(user)}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Edit user</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => {
                                    if (user.role === 'admin') return;
                                    setDeleteUser(user);
                                  }}
                                  disabled={user.role === 'admin'}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-40"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Delete permanently</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-t">
                <p className="text-xs text-gray-500 hidden sm:block">
                  Showing {startItem}–{endItem} of {total} users
                </p>
                <div className="flex items-center gap-1.5 mx-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="h-8 text-xs"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? 'default' : 'outline'}
                        size="sm"
                        className={`w-8 h-8 p-0 text-xs ${
                          pageNum === page
                            ? 'bg-green-600 hover:bg-green-700'
                            : ''
                        }`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 px-1.5">
                    of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="h-8 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Info Notice ─────────────────────────────────────────────────── */}
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <UserCog className="size-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-800">
              Admin Protection
            </p>
            <p className="text-[11px] text-amber-600 mt-0.5">
              Admin accounts cannot be deactivated or deleted to protect system
              access. Only customer accounts can be fully managed (status
              toggled and deleted). All data is stored permanently in the database and persists across server restarts.
            </p>
          </div>
        </div>

        {/* ── Inactive Users Warning ─────────────────────────────────────── */}
        {inactiveCount > 0 && (
          <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl">
            <ShieldX className="size-4 text-orange-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-orange-800">
                {inactiveCount} Inactive User{inactiveCount !== 1 ? 's' : ''}
              </p>
              <p className="text-[11px] text-orange-600 mt-0.5">
                Inactive users are blocked from logging in and cannot access the platform.
                Use the filter above to view them, or toggle their status to reactivate.
              </p>
            </div>
          </div>
        )}

        {/* ── Dialogs ────────────────────────────────────────────────────── */}

        {/* Status Toggle Confirmation */}
        <StatusToggleDialog
          user={toggleUser}
          open={!!toggleUser}
          onClose={() => setToggleUser(null)}
          onConfirm={handleConfirmToggleStatus}
          loading={toggleLoading}
        />

        {/* Delete Confirmation */}
        <DeleteConfirmDialog
          user={deleteUser}
          open={!!deleteUser}
          onClose={() => setDeleteUser(null)}
          onConfirm={handleConfirmDelete}
          loading={deleteLoading}
        />

        {/* User Detail Dialog */}
        <UserDetailDialog
          user={viewUser}
          open={!!viewUser}
          onClose={() => setViewUser(null)}
        />

        {/* Add / Edit User Dialog */}
        <UserFormDialog
          mode={formMode}
          user={editUser}
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditUser(null);
          }}
          onSubmit={handleFormSubmit}
        />

        {/* Bulk Actions Dialog */}
        <BulkActionsDialog
          open={bulkDialogOpen}
          onClose={() => setBulkDialogOpen(false)}
          selectedIds={Array.from(selectedIds)}
          selectedUsers={selectedUsers}
          onAction={handleBulkAction}
        />
      </div>
    </TooltipProvider>
  );
}
