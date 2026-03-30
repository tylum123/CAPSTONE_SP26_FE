"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PaymentService } from "@/libs/api/services/payment.service"
import { WalletService } from "@/libs/api/services/wallet.service"
import type { WalletDTO, WalletTransactionDTO } from "@/libs/types/wallet.types"

export default function PaymentsPage() {
  const [depositAmount, setDepositAmount] = useState("")
  const [isDepositing, setIsDepositing] = useState(false)
  const { toast } = useToast()

  const [wallet, setWallet] = useState<WalletDTO | null>(null)
  const [transactions, setTransactions] = useState<WalletTransactionDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setIsLoading(true)
        const walletRes = await WalletService.getMyWallet()
        if (walletRes.data) {
          setWallet(walletRes.data)
          const txRes = await WalletService.getTransactionsByWallet(walletRes.data.id, 1, 50)
          
          if (txRes.data) {
            // Check if PaginatedResponse or direct array
            const txItems = Array.isArray(txRes.data) ? txRes.data : (txRes.data as any).items || [];
            setTransactions(txItems)
          }
        }
      } catch (error) {
        console.error("Failed to fetch wallet data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchWalletData()
  }, [])

  const handleDeposit = async () => {
    if (!depositAmount || Number(depositAmount) <= 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số tiền hợp lệ",
        variant: "destructive",
      })
      return
    }

    setIsDepositing(true)
    try {
      const response = await PaymentService.create({
        totalAmount: Number(depositAmount),
        description: "Nạp tiền vào ví AgroTemp",
      })

      if (response.data?.checkoutUrl) {
        window.location.href = response.data.checkoutUrl
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể tạo link thanh toán",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "Lỗi",
        description: "Đã có lỗi xảy ra khi tạo giao dịch",
        variant: "destructive",
      })
    } finally {
      setIsDepositing(false)
    }
  }

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
                {isLoading ? (
                  <p className="text-3xl font-bold text-agro-green animate-pulse">...</p>
                ) : (
                  <p className="text-3xl font-bold text-agro-green">{(wallet?.balance || 0).toLocaleString()}đ</p>
                )}
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
                    <div className="grid grid-cols-1 gap-2">
                      <Button variant="outline" className="flex-col h-20 bg-agro-green/5 border-agro-green">
                        <span className="text-2xl mb-1 text-agro-green font-bold text-center">PayOS</span>
                        <span className="text-xs">Chuyển khoản / Quét QR</span>
                      </Button>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-agro-green hover:bg-agro-green-dark text-white"
                    onClick={handleDeposit}
                    disabled={isDepositing}
                  >
                    {isDepositing ? "Đang xử lý..." : "Xác nhận nạp tiền"}
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
                {isLoading ? (
                  <p className="text-3xl font-bold text-agro-orange animate-pulse">...</p>
                ) : (
                  <p className="text-3xl font-bold text-agro-orange">{(wallet?.lockedBalance || 0).toLocaleString()}đ</p>
                )}
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
              {transactions.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    Không có giao dịch nào
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${tx.amount > 0
                            ? "bg-agro-green/10"
                            : "bg-agro-orange/10"
                            }`}
                        >
                          {tx.amount > 0 ? (
                            <ArrowDownLeft className="h-4 w-4 text-agro-green" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-agro-orange" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{tx.referenceCode}</p>
                          <p className="text-xs text-muted-foreground">{tx.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(tx.createdAt).toLocaleDateString("vi-VN")}</TableCell>
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
