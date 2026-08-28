'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/auth-context';
import { api } from '../../../lib/api';
import { User, UserRole } from '../../../lib/types';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // New user form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>('MANAGER');
  const [department, setDepartment] = useState('');

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<User[]>('/users');
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);
    try {
      await api.post('/users', {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role,
        department: department || undefined,
      });
      setIsModalOpen(false);
      // Reset form
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setRole('MANAGER');
      setDepartment('');
      await fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (userToToggle: User) => {
    if (userToToggle.id === currentUser?.id) {
      alert('You cannot deactivate your own admin account');
      return;
    }
    try {
      await api.patch(`/users/${userToToggle.id}/toggle-active`);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  const getRoleBadgeVariant = (userRole: UserRole) => {
    switch (userRole) {
      case 'ADMIN':
        return 'primary';
      case 'REVIEWER':
        return 'warning';
      case 'MANAGER':
        return 'info';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
            User Management
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Manage system access, roles (Admin, Manager, Reviewer), and user accounts.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} size="md">
          + Add New User
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="max-w-md w-full">
          <Input
            placeholder="Search users by name, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-[var(--border)] text-xs uppercase font-bold text-[var(--muted)] tracking-wider">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Created</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--muted)]">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading user accounts...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--muted)]">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[var(--foreground)]">
                        {u.first_name} {u.last_name}
                      </div>
                      <div className="text-xs text-[var(--muted)]">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getRoleBadgeVariant(u.role)} size="sm">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-[var(--foreground)]">
                      {u.department || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={u.is_active ? 'success' : 'danger'} size="sm">
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-[var(--muted)]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant={u.is_active ? 'outline' : 'secondary'}
                        size="sm"
                        onClick={() => handleToggleActive(u)}
                        disabled={u.id === currentUser?.id}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New System User"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-xs font-medium">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Dawit"
              required
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Alemu"
              required
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@performance.com"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              options={[
                { value: 'MANAGER', label: 'Manager / Executive' },
                { value: 'REVIEWER', label: 'CEO / Reviewer' },
                { value: 'ADMIN', label: 'Administrator' },
              ]}
            />

            <Input
              label="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Operations"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-[var(--border)]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={formLoading}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
