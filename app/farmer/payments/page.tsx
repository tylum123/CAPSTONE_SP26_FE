"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, Clock, Banknote, Loader2, AlertCircle, CheckCircle2, XCircle, Timer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PaymentService } from "@/libs/api/services/payment.service"
import { WalletService } from "@/libs/api/services/wallet.service"
import type { WalletDTO, WalletTransactionDTO, WithdrawalRequest, CreateWithdrawalRequest } from "@/libs/types/wallet.types"
import { BinBank } from "@/libs/types/wallet.types"

// Map BinBank enum to human-readable bank names
const BANK_OPTIONS: { value: BinBank; label: string }[] = [
  { value: BinBank.Vietcombank, label: "Vietcombank" },
  { value: BinBank.BIDV, label: "BIDV" },
  { value: BinBank.VietinBank, label: "VietinBank" },
  { value: BinBank.Agribank, label: "Agribank" },
  { value: BinBank.MB, label: "MB Bank" },
  { value: BinBank.ACB, label: "ACB" },
  { value: BinBank.Techcombank, label: "Techcombank" },
  { value: BinBank.Sacombank, label: "Sacombank" },
  { value: BinBank.VPBank, label: "VPBank" },
  { value: BinBank.TPBank, label: "TPBank" },
  { value: BinBank.VIB, label: "VIB" },
  { value: BinBank.HDBank, label: "HDBank" },
  { value: BinBank.SHB, label: "SHB" },
  { value: BinBank.OCB, label: "OCB" },
  { value: BinBank.MSB, label: "MSB" },
  { value: BinBank.SeABank, label: "SeABank" },
  { value: BinBank.Eximbank, label: "Eximbank" },
  { value: BinBank.NamABank, label: "Nam A Bank" },
  { value: BinBank.PVcomBank, label: "PVcomBank" },
  { value: BinBank.LPBank, label: "LPBank" },
  { value: BinBank.NCB, label: "NCB" },
  { value: BinBank.SCB, label: "SCB" },
]

const WITHDRAWAL_STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; color: string }> = {
  PENDING: { label: "Đang chờ", variant: "secondary", icon: <Timer className="h-3 w-3" />, color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  APPROVED: { label: "Đã duyệt", variant: "default", icon: <CheckCircle2 className="h-3 w-3" />, color: "bg-blue-100 text-blue-700 border-blue-200" },
  REJECTED: { label: "Từ chối", variant: "destructive", icon: <XCircle className="h-3 w-3" />, color: "bg-red-100 text-red-700 border-red-200" },
  PAID: { label: "Đã thanh toán", variant: "default", icon: <CheckCircle2 className="h-3 w-3" />, color: "bg-green-100 text-green-700 border-green-200" },
}

export default function PaymentsPage() {
  const [depositAmount, setDepositAmount] = useState("")
  const [isDepositing, setIsDepositing] = useState(false)
  const { toast } = useToast()

  const [wallet, setWallet] = useState<WalletDTO | null>(null)
  const [transactions, setTransactions] = useState<WalletTransactionDTO[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Withdraw dialog state
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    toBin: "" as string,
    toAccountNumber: "",
    accountHolderName: "",
    description: "",
  })

  const fetchWalletData = async () => {
    try {
      setIsLoading(true)
      const walletRes = await WalletService.getMyWallet()
      if (walletRes.data) {
        setWallet(walletRes.data)
        const txRes = await WalletService.getTransactionsByWallet(walletRes.data.id, 1, 50)

        if (txRes.data) {
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

  const fetchWithdrawals = async () => {
    try {
      const res = await WalletService.getMyWithdrawals(1, 50)
      if (res.data) {
        const items = Array.isArray(res.data) ? res.data : (res.data as any).items || [];
        setWithdrawals(items)
      }
    } catch (error) {
      console.error("Failed to fetch withdrawals:", error)
    }
  }

  useEffect(() => {
    fetchWalletData()
    fetchWithdrawals()
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

  const handleWithdraw = async () => {
    const amount = Number(withdrawForm.amount)

    if (!amount || amount <= 0) {
      toast({ title: "Lỗi", description: "Vui lòng nhập số tiền rút hợp lệ", variant: "destructive" })
      return
    }

    if (amount > (wallet?.balance || 0)) {
      toast({ title: "Lỗi", description: "Số dư ví không đủ để thực hiện rút tiền", variant: "destructive" })
      return
    }

    if (!withdrawForm.toBin) {
      toast({ title: "Lỗi", description: "Vui lòng chọn ngân hàng", variant: "destructive" })
      return
    }

    if (!withdrawForm.toAccountNumber.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng nhập số tài khoản", variant: "destructive" })
      return
    }

    setIsWithdrawing(true)
    try {
      const payload: CreateWithdrawalRequest = {
        amount,
        toBin: Number(withdrawForm.toBin) as BinBank,
        toAccountNumber: withdrawForm.toAccountNumber.trim(),
        accountHolderName: withdrawForm.accountHolderName.trim() || undefined,
        description: withdrawForm.description.trim() || undefined,
        category: ["WITHDRAWAL"],
      }

      await WalletService.createWithdrawal(payload)

      toast({
        title: "Thành công",
        description: "Yêu cầu rút tiền đã được gửi. Vui lòng chờ xử lý.",
      })

      setWithdrawOpen(false)
      setWithdrawForm({
        amount: "",
        toBin: "",
        toAccountNumber: "",
        accountHolderName: "",
        description: "",
      })

      // Refresh data
      fetchWalletData()
      fetchWithdrawals()
    } catch (error: any) {
      console.error("Withdraw error:", error)
      const message = error?.response?.data?.message || "Đã có lỗi xảy ra khi tạo yêu cầu rút tiền"
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  const getStatusInfo = (status: string) => {
    return WITHDRAWAL_STATUS_MAP[status?.toUpperCase()] || WITHDRAWAL_STATUS_MAP.PENDING
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
            <div className="flex gap-2 mt-4">
              {/* Deposit Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="flex-1 bg-agro-green hover:bg-agro-green-dark text-white">
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

              {/* Withdraw Dialog */}
              <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 border-agro-green/30 text-agro-green hover:bg-agro-green/5">
                    <Banknote className="h-4 w-4 mr-2" />
                    Rút tiền
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-agro-green" />
                      Rút tiền về ngân hàng
                    </DialogTitle>
                    <DialogDescription>
                      Số dư khả dụng: <span className="font-semibold text-agro-green">{(wallet?.balance || 0).toLocaleString()}đ</span>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    {/* Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-amount">Số tiền rút <span className="text-red-500">*</span></Label>
                      <Input
                        id="withdraw-amount"
                        type="number"
                        placeholder="Nhập số tiền cần rút"
                        value={withdrawForm.amount}
                        onChange={(e) => setWithdrawForm(prev => ({ ...prev, amount: e.target.value }))}
                        min={0}
                      />
                      <div className="flex flex-wrap gap-2">
                        {[100000, 500000, 1000000, 2000000].map((amount) => (
                          <Button
                            key={amount}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setWithdrawForm(prev => ({ ...prev, amount: amount.toString() }))}
                            className="bg-transparent text-xs"
                          >
                            {amount >= 1000000 ? `${(amount / 1000000).toFixed(0)}M` : `${(amount / 1000).toFixed(0)}K`}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Bank Select */}
                    <div className="space-y-2">
                      <Label>Ngân hàng <span className="text-red-500">*</span></Label>
                      <Select
                        value={withdrawForm.toBin}
                        onValueChange={(value) => setWithdrawForm(prev => ({ ...prev, toBin: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn ngân hàng" />
                        </SelectTrigger>
                        <SelectContent>
                          {BANK_OPTIONS.map((bank) => (
                            <SelectItem key={bank.value} value={bank.value.toString()}>
                              {bank.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Account Number */}
                    <div className="space-y-2">
                      <Label htmlFor="account-number">Số tài khoản <span className="text-red-500">*</span></Label>
                      <Input
                        id="account-number"
                        type="text"
                        placeholder="Nhập số tài khoản ngân hàng"
                        value={withdrawForm.toAccountNumber}
                        onChange={(e) => setWithdrawForm(prev => ({ ...prev, toAccountNumber: e.target.value }))}
                      />
                    </div>

                    {/* Account Holder Name */}
                    <div className="space-y-2">
                      <Label htmlFor="holder-name">Tên chủ tài khoản</Label>
                      <Input
                        id="holder-name"
                        type="text"
                        placeholder="VD: NGUYEN VAN A"
                        value={withdrawForm.accountHolderName}
                        onChange={(e) => setWithdrawForm(prev => ({ ...prev, accountHolderName: e.target.value.toUpperCase() }))}
                        className="uppercase"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-desc">Ghi chú</Label>
                      <Input
                        id="withdraw-desc"
                        type="text"
                        placeholder="Ghi chú (không bắt buộc)"
                        value={withdrawForm.description}
                        onChange={(e) => setWithdrawForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>

                    {/* Warning */}
                    {Number(withdrawForm.amount) > (wallet?.balance || 0) && Number(withdrawForm.amount) > 0 && (
                      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>Số tiền rút vượt quá số dư khả dụng</span>
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setWithdrawOpen(false)}
                      disabled={isWithdrawing}
                    >
                      Hủy
                    </Button>
                    <Button
                      className="bg-agro-green hover:bg-agro-green-dark text-white"
                      onClick={handleWithdraw}
                      disabled={isWithdrawing || !withdrawForm.amount || !withdrawForm.toBin || !withdrawForm.toAccountNumber}
                    >
                      {isWithdrawing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        "Xác nhận rút tiền"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
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

      {/* Tabbed History */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="transactions">Lịch sử giao dịch</TabsTrigger>
          <TabsTrigger value="withdrawals">
            Yêu cầu rút tiền
            {withdrawals.filter(w => w.status?.toUpperCase() === "PENDING").length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                {withdrawals.filter(w => w.status?.toUpperCase() === "PENDING").length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
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
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Yêu cầu rút tiền</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngân hàng</TableHead>
                    <TableHead>Số tài khoản</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        Chưa có yêu cầu rút tiền nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    withdrawals.map((wd) => {
                      const statusInfo = getStatusInfo(wd.status)
                      return (
                        <TableRow key={wd.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-blue-50">
                                <Banknote className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">{wd.bankName}</p>
                                <p className="text-xs text-muted-foreground">{wd.accountHolderName}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{wd.bankAccountNumber}</TableCell>
                          <TableCell>{new Date(wd.createdAt).toLocaleDateString("vi-VN")}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`gap-1 ${statusInfo.color}`}>
                              {statusInfo.icon}
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            -{wd.amount.toLocaleString()}đ
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
