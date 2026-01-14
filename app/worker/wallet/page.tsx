"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowDownLeft, ArrowUpRight, Eye, EyeOff, Wallet, TrendingUp, TrendingDown } from "lucide-react"

const transactions = [
  {
    id: 1,
    type: "in",
    title: "Thanh toan tu cong viec",
    description: "Lam dat chuan bi vu mua",
    amount: "+1,140,000d",
    date: "12/01/2026",
    status: "completed",
  },
  {
    id: 2,
    type: "out",
    title: "Rut tien ve Momo",
    description: "****6789",
    amount: "-500,000d",
    date: "11/01/2026",
    status: "completed",
  },
  {
    id: 3,
    type: "in",
    title: "Thanh toan tu cong viec",
    description: "Thu hoach dua hau",
    amount: "+640,000d",
    date: "06/01/2026",
    status: "completed",
  },
  {
    id: 4,
    type: "out",
    title: "Rut tien ve VNPay",
    description: "****1234",
    amount: "-400,000d",
    date: "05/01/2026",
    status: "completed",
  },
]

export default function WalletPage() {
  const [showBalance, setShowBalance] = useState(true)
  const [withdrawAmount, setWithdrawAmount] = useState("")

  const balance = 1280000

  return (
    <div className="container mx-auto px-4 lg:px-8 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Vi cua toi</h1>
        <p className="text-muted-foreground">Quan ly so du va rut tien</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Balance & Actions */}
        <div className="space-y-6">
          {/* Balance Card */}
          <Card className="bg-gradient-to-br from-agro-orange to-agro-orange-dark text-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-6 w-6" />
                  <span className="font-medium">So du vi</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => setShowBalance(!showBalance)}
                >
                  {showBalance ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </Button>
              </div>
              <p className="text-4xl font-bold mb-6">{showBalance ? `${balance.toLocaleString()}d` : "********"}</p>
              <div className="grid grid-cols-2 gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="bg-white text-agro-orange hover:bg-white/90 gap-2">
                      <img src="/momo-logo-pink.jpg" alt="Momo" className="h-5 w-5 rounded" />
                      Rut ve Momo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Rut tien ve Momo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>So tien rut</Label>
                        <Input
                          type="number"
                          placeholder="Nhap so tien"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Toi thieu 50,000d - Toi da {balance.toLocaleString()}d
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          So tai khoan Momo: <span className="font-medium">0912 345 678</span>
                        </p>
                      </div>
                      <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white">Xac nhan rut tien</Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="bg-white text-agro-orange hover:bg-white/90 gap-2">
                      <img src="/vnpay-logo-blue.jpg" alt="VNPay" className="h-5 w-5 rounded" />
                      Rut ve VNPay
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Rut tien ve VNPay</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>So tien rut</Label>
                        <Input
                          type="number"
                          placeholder="Nhap so tien"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Toi thieu 50,000d - Toi da {balance.toLocaleString()}d
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          Tai khoan VNPay: <span className="font-medium">****1234</span>
                        </p>
                      </div>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Xac nhan rut tien</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-agro-green/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-agro-green" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tong thu</p>
                  <p className="font-bold text-agro-green">1,780,000d</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-agro-orange/10 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-agro-orange" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Da rut</p>
                  <p className="font-bold text-agro-orange">900,000d</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Transaction History */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownLeft className="h-5 w-5" />
                Lich su giao dich
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          tx.type === "in" ? "bg-agro-green/10" : "bg-agro-orange/10"
                        }`}
                      >
                        {tx.type === "in" ? (
                          <ArrowDownLeft className="h-6 w-6 text-agro-green" />
                        ) : (
                          <ArrowUpRight className="h-6 w-6 text-agro-orange" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{tx.title}</p>
                        <p className="text-sm text-muted-foreground">{tx.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${tx.type === "in" ? "text-agro-green" : "text-agro-orange"}`}>
                        {tx.amount}
                      </p>
                      <p className="text-sm text-muted-foreground">{tx.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
