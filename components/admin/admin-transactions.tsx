"use client";

import { Search, ArrowUpRight, ArrowDownLeft, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { adminService } from "@/libs/api/services/admin.service";

export function AdminTransactions() {
  type Transaction = {
    id: number;
    type: string;
    userName: string;
    amount: string;
    createdAt: string;
    status: string;
    balanceAfter: number | null;
  };

  type Stats = {
    systemBalance?: {
      total: number;
      locked: number;
      available: number;
      changeToday: number;
    };
    payosToday?: {
      depositAmount: number;
      withdrawAmount: number;
      depositCount: number;
      withdrawCount: number;
      totalTransactions: number;
      netFlow: number;
    };
  };

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // We'll fetch transactions from API; local filtering is not used now.

  const getTransactionIcon = (type: string) => {
    const t = type?.toLowerCase() ?? "";
    if (t === "deposit" || t === "refund") {
      return <ArrowDownLeft size={20} className="text-green-600" />;
    }
    return <ArrowUpRight size={20} className="text-destructive" />;
  };

  const getTypeColor = (type: string) => {
    const t = (type ?? "").toLowerCase();
    const colors: Record<string, string> = {
      deposit: "bg-green-100 text-green-700",
      payment: "bg-primary/20 text-primary",
      refund: "bg-[#10B981]/20 text-[#10B981]",
      withdrawal: "bg-[#D28228]/20 text-[#D28228]",
    };
    return colors[t] ?? "bg-muted text-muted-foreground";
  };

  const getStatusColor = (status: string) => {
    const s = (status ?? "").toLowerCase();
    return s === "success" || s === "ok" || s === "succeeded"
      ? "bg-green-100 text-green-700"
      : "bg-[#D28228]/20 text-[#D28228]";
  };

  // --- API calls ---
  const fetchStats = async () => {
    try {
      const res = await adminService.getWalletStats();
      if (res) {
        // Expecting res.data to follow { systemBalance, payosToday }
        setStats(res as any as Stats);
      } else setStats(null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to load stats");
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (searchTerm) params.set("search", searchTerm);
      if (typeFilter && typeFilter !== "All")
        params.set("type", typeFilter.toUpperCase());

      const queryParams: any = { page, limit };
      if (searchTerm) queryParams.search = searchTerm;
      if (typeFilter && typeFilter !== "All")
        queryParams.type = typeFilter.toUpperCase();

      const res = await adminService.getWalletTransactions(queryParams as any);
      const items = (res as any)?.data ?? (res as any)?.items ?? [];
      setTransactions(Array.isArray(items) ? items : (items.items ?? []));
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  // Optional: fetch withdrawals list helper (not displayed here yet)
  const fetchWithdrawals = async (
    opts: { page?: number; limit?: number; status?: string } = {},
  ) => {
    const params = new URLSearchParams();
    if (opts.page) params.set("page", String(opts.page));
    if (opts.limit) params.set("limit", String(opts.limit));
    if (opts.status) params.set("status", opts.status);
    const res = await fetch(`/admin/withdrawals?${params.toString()}`);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const msg = `Withdrawals fetch failed: ${res.status} ${text}`;
      console.error(msg);
      setError(msg);
      return { data: [] };
    }
    return res.json();
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, searchTerm, typeFilter]);

  const formatCurrency = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(0) : "0";
  };

  const formatMoney = (v: any) => {
    const n = Number(v) || 0;
    return new Intl.NumberFormat("vi-VN").format(n);
  };

  const totalSystem = Number(stats?.systemBalance?.total ?? 0);
  const lockedAmount = Number(stats?.systemBalance?.locked ?? 0);
  const availableAmount =
    Number(stats?.systemBalance?.available ?? totalSystem - lockedAmount) || 0;
  const depositToday = Number(stats?.payosToday?.depositAmount ?? 0);
  const withdrawalToday = Number(stats?.payosToday?.withdrawAmount ?? 0);
  const depositCount = Number(stats?.payosToday?.depositCount ?? 0);
  const withdrawalCount = Number(stats?.payosToday?.withdrawCount ?? 0);
  const totalTransactions = Number(
    stats?.payosToday?.totalTransactions ?? depositCount + withdrawalCount,
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Quản lý giao dịch & Ví
        </h1>
        <p className="text-muted-foreground mt-2">
          Theo dõi các giao dịch và quản lý ví của người dùng
        </p>
      </div>

      {/* Key Metrics - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">
                Tổng tiền hệ thống
              </p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {formatMoney(totalSystem)} VND
              </p>
            </div>
            <div className="bg-primary/20 p-3 rounded-lg">
              <DollarSign size={24} className="text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Tiền đang bị khóa</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {formatMoney(lockedAmount)} VND
              </p>
            </div>
            <div className="bg-[#D28228]/20 p-3 rounded-lg">
              <DollarSign size={24} className="text-[#D28228]" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Tiền khả dụng</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {formatMoney(availableAmount)} VND
              </p>
            </div>
            <div className="bg-[#10B981]/20 p-3 rounded-lg">
              <DollarSign size={24} className="text-[#10B981]" />
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Nạp hôm nay</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {formatMoney(depositToday)} VND
              </p>
            </div>
            <div className="bg-primary/20 p-3 rounded-lg">
              <DollarSign size={24} className="text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Rút hôm nay</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {formatMoney(withdrawalToday)} VND
              </p>
            </div>
            <div className="bg-[#D28228]/20 p-3 rounded-lg">
              <DollarSign size={24} className="text-[#D28228]" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div>
            <p className="text-muted-foreground text-sm">Số giao dịch</p>
            <p className="text-foreground font-semibold mt-2">
              Nạp: {depositCount}
            </p>
            <p className="text-foreground font-semibold">
              Rút: {withdrawalCount}
            </p>
            <p className="text-foreground font-bold mt-2">
              Tổng: {totalTransactions}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64 relative">
          <Search
            size={20}
            className="absolute left-3 top-3 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên người dùng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-card text-foreground"
        >
          <option>Tất cả</option>
          <option value={1}>Nạp tiền</option>
          <option value={3}>Thanh toán</option>
          <option value={4}>Hoàn tiền</option>
          <option value={2}>Rút tiền</option>
          <option value={5}>Khóa tiền</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Số tiền
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Ngày giờ
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Số dư hiện tại
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-6 text-center text-muted-foreground"
                  >
                    Đang tải...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-6 text-center text-destructive"
                  >
                    {error}
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-6 text-center text-muted-foreground"
                  >
                    Không có giao dịch
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const amountStr = String(tx.amount ?? "");
                  const typeKey = (tx.type ?? "").toLowerCase();
                  const typeLabels: Record<string, string> = {
                    deposit: "Nạp tiền",
                    job_payment: "Thanh toán",
                    refund: "Hoàn tiền",
                    withdraw: "Rút tiền",
                    job_lock: "Khóa tiền",
                  };
                  const displayType =
                    typeLabels[typeKey] ??
                    (tx.type
                      ? `${tx.type[0].toUpperCase()}${tx.type.slice(1).toLowerCase()}`
                      : tx.type);
                  // Format amount to vi-VN thousands separators, keep sign if present
                  const sign = amountStr.startsWith("+")
                    ? "+"
                    : amountStr.startsWith("-")
                      ? "-"
                      : "";
                  const numericPart = amountStr.replace(/[^0-9.-]/g, "");
                  const absNum = Number(numericPart) || 0;
                  const formattedAmount = `${sign}${new Intl.NumberFormat("vi-VN").format(Math.abs(absNum))}`;
                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(tx.type)}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(tx.type)}`}
                          >
                            {displayType}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">
                          {tx.userName ?? "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p
                          className={`font-bold ${sign === "+" ? "text-green-600" : "text-destructive"}`}
                        >
                          {formattedAmount}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-muted-foreground text-sm">
                          {tx.createdAt}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">
                          {tx.balanceAfter != null
                            ? `${formatMoney(tx.balanceAfter)} VND`
                            : "—"}
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
