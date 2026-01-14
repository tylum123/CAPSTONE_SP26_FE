"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, CheckCircle, Clock, AlertCircle } from "lucide-react"

const walletBalance = 2500000
const escrowBalance = 1750000

const pendingPayments = [
  {
    id: 1,
    workerName: "Trần Văn Bình",
    job: "Gặt lúa 2 ngày",
    amount: 700000,
    completedAt: "16/01/2026",
    status: "pending",
  },
  {
    id: 2,
    workerName: "Lê Thị Cẩm",
    job: "Phun thuốc trừ sâu",
    amount: 400000,
    completedAt: "18/01/2026",
    status: "pending",
  },
]

const transactions = [
  {
    id: 1,
    type: "deposit",
    title: "Nạp tiền vào ví",
    description: "Chuyển khoản ngân hàng",
    amount: 5000000,
    date: "10/01/2026",
    status: "completed",
  },
  {
    id: 2,
    type: "escrow",
    title: "Escrow - Gặt lúa 2 ngày",
    description: "Tạm giữ cho công việc",
    amount: -1750000,
    date: "12/01/2026",
    status: "completed",
  },
  {
    id: 3,
    type: "release",
    title: "Thanh toán cho Phạm Văn Dũng",
    description: "Hoàn thành - Làm đất",
    amount: -1140000,
    date: "08/01/2026",
    status: "completed",
  },
  {
    id: 4,
    type: "deposit",
    title: "Nạp tiền vào ví",
    description: "Ví Momo",
    amount: 2000000,
    date: "05/01/2026",
    status: "completed",
  },
]

export default function PaymentsPage() {
  const [depositAmount, setDepositAmount] = useState("")

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý thanh toán</h1>
        <p className="text-muted-foreground">Ví tiền và thanh toán Escrow</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-agro-green/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Số dư ví</p>
                <p className="text-3xl font-bold text-agro-green">{walletBalance.toLocaleString()}đ</p>
              </div>
              <div className="p-4 rounded-full bg-agro-green/10">
                <Wallet className="h-8 w-8 text-agro-green" />
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full mt-4 bg-agro-green hover:bg-agro-green-dark text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Nạp tiền
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nạp tiền vào ví</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Số tiền nạp</Label>
                    <Input
                      type="number"
                      placeholder="Nhập số tiền"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[500000, 1000000, 2000000, 5000000].map((amount) => (
                      <Button
                        key={amount}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDepositAmount(amount.toString())}
                        className="bg-transparent"
                      >
                        {(amount / 1000000).toFixed(1)}M
                      </Button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label>Phương thức thanh toán</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" className="flex-col h-20 bg-transparent">
                        <img src="/vnpay-logo-blue.jpg" alt="VNPay" className="h-8 w-8 mb-1" />
                        <span className="text-xs">VNPay</span>
                      </Button>
                      <Button variant="outline" className="flex-col h-20 bg-transparent">
                        <img src="/momo-logo-pink.jpg" alt="Momo" className="h-8 w-8 mb-1" />
                        <span className="text-xs">Momo</span>
                      </Button>
                      <Button variant="outline" className="flex-col h-20 bg-transparent">
                        <span className="text-2xl mb-1">🏦</span>
                        <span className="text-xs">Ngân hàng</span>
                      </Button>
                    </div>
                  </div>
                  <Button className="w-full bg-agro-green hover:bg-agro-green-dark text-white">
                    Xác nhận nạp tiền
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="border-agro-orange/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Số dư Escrow</p>
                <p className="text-3xl font-bold text-agro-orange">{escrowBalance.toLocaleString()}đ</p>
              </div>
              <div className="p-4 rounded-full bg-agro-orange/10">
                <Clock className="h-8 w-8 text-agro-orange" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Số tiền đang giữ cho các công việc đang thực hiện. Sẽ được giải ngân khi bạn xác nhận hoàn thành.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Chờ xác nhận hoàn thành ({pendingPayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium">{payment.workerName}</p>
                    <p className="text-sm text-muted-foreground">{payment.job}</p>
                    <p className="text-xs text-muted-foreground">Hoàn thành: {payment.completedAt}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-agro-orange">{payment.amount.toLocaleString()}đ</p>
                    <Button size="sm" className="mt-2 bg-agro-green hover:bg-agro-green-dark text-white">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Xác nhận & Thanh toán
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Lịch sử giao dịch</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Giao dịch</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          tx.type === "deposit"
                            ? "bg-agro-green/10"
                            : tx.type === "escrow"
                              ? "bg-agro-orange/10"
                              : "bg-blue-100"
                        }`}
                      >
                        {tx.type === "deposit" ? (
                          <ArrowDownLeft className="h-4 w-4 text-agro-green" />
                        ) : (
                          <ArrowUpRight
                            className={`h-4 w-4 ${tx.type === "escrow" ? "text-agro-orange" : "text-blue-600"}`}
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{tx.title}</p>
                        <p className="text-xs text-muted-foreground">{tx.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{tx.date}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-agro-green/10 text-agro-green">
                      Hoàn thành
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={tx.amount > 0 ? "text-agro-green" : "text-foreground"}>
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount.toLocaleString()}đ
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
