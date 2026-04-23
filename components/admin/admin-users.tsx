"use client";

import {
  Search,
  Lock,
  Unlock,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { adminService } from "@/libs/api/services";
import type { GetUserResponse } from "@/libs/types";

const LIMIT = 10;

const ROLE_LABEL: Record<string, string> = {
  farmer: "Nông dân",
  worker: "Người làm",
  admin: "Quản trị viên",
};

const ROLE_COLOR: Record<string, string> = {
  farmer: "bg-yellow-100 text-yellow-700",
  worker: "bg-[#10B981]/20 text-[#10B981]",
  admin: "bg-[#6366F1]/20 text-[#6366F1]",
};

export function AdminUsers() {
  const [users, setUsers] = useState<GetUserResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(
      () => setDebouncedSearch(searchTerm),
      400,
    );
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchTerm]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: LIMIT };
      if (debouncedSearch) params.search = debouncedSearch;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== "") params.isActive = statusFilter === "active";

      const res = await adminService.getUsers(
        params as Parameters<typeof adminService.getUsers>[0],
      );
      const payload = res;

      if (Array.isArray(payload)) {
        setUsers(payload);
        setTotal(payload.length);
        setTotalPages(1);
      } else {
        setUsers(payload.data);
        setTotal(payload.total);
        setTotalPages(payload.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, statusFilter]);

  const handleToggleActive = async (user: GetUserResponse) => {
    setActionLoading(user.id);
    try {
      await adminService.setUserActiveStatus(user, !user.isActive);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isActive: !u.isActive } : u,
        ),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (user: GetUserResponse) => {
    if (
      !confirm(
        `Xóa tài khoản "${user.fullName}"? Hành động này không thể hoàn tác.`,
      )
    )
      return;
    setActionLoading(user.id);
    try {
      await adminService.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setTotal((t) => t - 1);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Quản lý người dùng
        </h1>
        <p className="text-muted-foreground mt-2">
          Quản lý tài khoản Farmer và Worker
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64 relative">
          <Search
            size={20}
            className="absolute left-3 top-2.5 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-card text-foreground"
        >
          <option value="">Tất cả vai trò</option>
          <option value="farmer">Nông dân</option>
          <option value="worker">Người làm</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-card text-foreground"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="blocked">Đã khóa</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Vai trò
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Đánh giá
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Ngày tham gia
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-16 text-center text-muted-foreground"
                  >
                    <Loader2 size={28} className="inline animate-spin mr-2" />
                    Đang tải...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-16 text-center text-muted-foreground"
                  >
                    Không tìm thấy người dùng nào.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
                            {user.fullName?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <p className="font-semibold text-foreground">
                          {user.fullName}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          ROLE_COLOR[user.role] ??
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {ROLE_LABEL[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        {user.isActive ? "Hoạt động" : "Đã khóa"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground">
                        {user.rating != null ? `⭐ ${user.rating}` : "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-muted-foreground text-sm">
                        {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          disabled={actionLoading === user.id}
                          onClick={() => handleToggleActive(user)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                          title={
                            user.isActive
                              ? "Khóa tài khoản"
                              : "Mở khóa tài khoản"
                          }
                        >
                          {actionLoading === user.id ? (
                            <Loader2
                              size={18}
                              className="animate-spin text-muted-foreground"
                            />
                          ) : user.isActive ? (
                            <Lock size={18} className="text-[#D28228]" />
                          ) : (
                            <Unlock size={18} className="text-[#10B981]" />
                          )}
                        </button>
                        <button
                          disabled={actionLoading === user.id}
                          onClick={() => handleDelete(user)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                          title="Xóa tài khoản"
                        >
                          <Trash2 size={18} className="text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-card rounded-b-lg">
          <p className="text-sm text-muted-foreground">
            {/* Tổng{" "}
            <span className="font-semibold text-foreground">
              {total.toLocaleString()}
            </span>{" "}
            người dùng */}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-foreground">
              Trang <span className="font-semibold">{page}</span> / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm">Tổng người dùng</p>
          <p className="text-3xl font-bold text-foreground mt-2">
            {total.toLocaleString()}
          </p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm">Hoạt động (trang này)</p>
          <p className="text-3xl font-bold text-foreground mt-2">
            {activeCount}
          </p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm">Đã khóa (trang này)</p>
          <p className="text-3xl font-bold text-destructive mt-2">
            {users.length - activeCount}
          </p>
        </div>
      </div>
    </div>
  );
}
