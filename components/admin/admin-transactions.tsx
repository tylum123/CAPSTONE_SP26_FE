"use client";

import { Search, ArrowUpRight, ArrowDownLeft, DollarSign } from "lucide-react";
import { useState } from "react";

export function AdminTransactions() {
  const [transactions] = useState([
    {
      id: 1,
      type: "Deposit",
      user: "Nguyễn Văn A",
      amount: "+$500",
      date: "2024-03-15 10:30",
      status: "Success",
      balance: "$1,200",
    },
    {
      id: 2,
      type: "Payment",
      user: "Trần Thị B",
      amount: "-$150",
      date: "2024-03-14 15:45",
      status: "Success",
      balance: "$850",
    },
    {
      id: 3,
      type: "Refund",
      user: "Lê Văn C",
      amount: "+$200",
      date: "2024-03-13 09:20",
      status: "Success",
      balance: "$950",
    },
    {
      id: 4,
      type: "Withdrawal",
      user: "Phạm Thị D",
      amount: "-$300",
      date: "2024-03-12 14:15",
      status: "Pending",
      balance: "$600",
    },
    {
      id: 5,
      type: "Deposit",
      user: "Đỗ Minh E",
      amount: "+$1,000",
      date: "2024-03-11 11:00",
      status: "Success",
      balance: "$2,100",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredTransactions = transactions.filter((tx) => {
    const matchSearch = tx.user
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchType = typeFilter === "All" || tx.type === typeFilter;
    const matchStatus = statusFilter === "All" || tx.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const getTransactionIcon = (type: string) => {
    if (type === "Deposit" || type === "Refund") {
      return <ArrowDownLeft size={20} className="text-green-600" />;
    }
    return <ArrowUpRight size={20} className="text-destructive" />;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Deposit: "bg-green-100 text-green-700",
      Payment: "bg-primary/20 text-primary",
      Refund: "bg-[#10B981]/20 text-[#10B981]",
      Withdrawal: "bg-[#D28228]/20 text-[#D28228]",
    };
    return colors[type] ?? "bg-muted text-muted-foreground";
  };

  const getStatusColor = (status: string) => {
    return status === "Success"
      ? "bg-green-100 text-green-700"
      : "bg-[#D28228]/20 text-[#D28228]";
  };

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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">
                Tổng giao dịch hôm nay
              </p>
              <p className="text-3xl font-bold text-foreground mt-2">$1,250</p>
              <p className="text-sm text-green-600 mt-2">+15% so với hôm qua</p>
            </div>
            <div className="bg-primary/20 p-3 rounded-lg">
              <DollarSign size={24} className="text-primary" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">
                Số dư ví trung bình
              </p>
              <p className="text-3xl font-bold text-foreground mt-2">$1,342</p>
              <p className="text-sm text-green-600 mt-2">
                +8% so với tuần trước
              </p>
            </div>
            <div className="bg-[#10B981]/20 p-3 rounded-lg">
              <DollarSign size={24} className="text-[#10B981]" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">
                Giao dịch đang chờ
              </p>
              <p className="text-3xl font-bold text-foreground mt-2">$300</p>
              <p className="text-sm text-[#D28228] mt-2">
                1 giao dịch chờ xử lý
              </p>
            </div>
            <div className="bg-[#D28228]/20 p-3 rounded-lg">
              <DollarSign size={24} className="text-[#D28228]" />
            </div>
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
          <option>All</option>
          <option>Deposit</option>
          <option>Payment</option>
          <option>Refund</option>
          <option>Withdrawal</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-card text-foreground"
        >
          <option>All</option>
          <option>Success</option>
          <option>Pending</option>
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
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Số dư hiện tại
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
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
                        {tx.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">{tx.user}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p
                      className={`font-bold ${tx.amount.startsWith("+") ? "text-green-600" : "text-destructive"}`}
                    >
                      {tx.amount}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-muted-foreground text-sm">{tx.date}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(tx.status)}`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">
                      {tx.balance}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
