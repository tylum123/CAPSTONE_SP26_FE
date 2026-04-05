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
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, Clock, Banknote, Loader2, AlertCircle, CheckCircle2, XCircle, Timer, CreditCard, Building, DollarSign, Wallet2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PaymentService } from "@/libs/api/services/payment.service"
import { WalletService } from "@/libs/api/services/wallet.service"
import { BankService, type VietQRBank } from "@/libs/api/services/bank.service"
import type { WalletDTO, WalletTransactionDTO, WithdrawalRequest, CreateWithdrawalRequest } from "@/libs/types/wallet.types"
import { BinBank, TransactionType } from "@/libs/types/wallet.types"

const WITHDRAWAL_STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; color: string }> = {
  PENDING: { label: "Đang chờ", variant: "secondary", icon: <Timer className="h-3 w-3" />, color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  APPROVED: { label: "Đã duyệt", variant: "default", icon: <CheckCircle2 className="h-3 w-3" />, color: "bg-blue-100 text-blue-700 border-blue-200" },
  REJECTED: { label: "Từ chối", variant: "destructive", icon: <XCircle className="h-3 w-3" />, color: "bg-red-100 text-red-700 border-red-200" },
  PAID: { label: "Đã thanh toán", variant: "default", icon: <CheckCircle2 className="h-3 w-3" />, color: "bg-green-100 text-green-700 border-green-200" },
}

const TRANSACTION_TYPE_LABELS: Record<number, string> = {
  [TransactionType.DEPOSIT]: "Nạp tiền",
  [TransactionType.WITHDRAW]: "Rút tiền",
  [TransactionType.JOB_PAYMENT]: "Thanh toán công việc",
  [TransactionType.REFUND]: "Hoàn tiền",
  [TransactionType.JOB_LOCK]: "Số dư Escrow",
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
  const [banks, setBanks] = useState<VietQRBank[]>([])
  const [isLookingUpAccount, setIsLookingUpAccount] = useState(false)
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

  const fetchBanks = async () => {
    const bankList = await BankService.getBanks()
    if (bankList.length > 0) {
      setBanks(bankList)
    }
  }

  useEffect(() => {
    fetchWalletData()
    fetchWithdrawals()
    fetchBanks()
  }, [])

  useEffect(() => {
    const lookup = async () => {
      if (withdrawForm.toBin && withdrawForm.toAccountNumber.length >= 6) {
        setIsLookingUpAccount(true)
        try {
          const name = await BankService.lookupAccount(withdrawForm.toBin, withdrawForm.toAccountNumber)
          if (name) {
            setWithdrawForm(prev => ({ ...prev, accountHolderName: name }))
          }
        } finally {
          setIsLookingUpAccount(false)
        }
      }
    }

    const timer = setTimeout(lookup, 800) // Debounce lookup
    return () => clearTimeout(timer)
  }, [withdrawForm.toBin, withdrawForm.toAccountNumber])

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
                  <Button className="flex-1 bg-agro-green hover:bg-agro-green/90 text-white shadow-lg shadow-agro-green/20 h-10 px-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Nạp tiền
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px] w-[95vw] p-0 gap-0 border-none shadow-2xl overflow-hidden rounded-3xl">
                  <div className="bg-agro-green/5 border-b px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-agro-green/10 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                        <Wallet className="h-7 w-7 text-agro-green" />
                      </div>
                      <div>
                        <DialogTitle className="text-2xl font-bold tracking-tight">Nạp tiền vào ví</DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1">Giao dịch nhanh qua cổng thanh toán PayOS</p>
                      </div>
                    </div>
                    <div className="bg-white px-5 py-3 rounded-2xl border border-agro-green/10 shadow-sm flex flex-col items-end min-w-[160px]">
                      <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Số dư hiện tại</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xl font-black text-agro-green">
                          {(wallet?.balance || 0).toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-agro-green/70 pt-1 uppercase ">VNĐ</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 space-y-8">
                    <div className="space-y-6">
                      {/* Amount Selection */}
                      <div className="space-y-4">
                        <Label className="text-sm font-bold flex items-center gap-2.5 text-slate-700">
                          <div className="p-1.5 bg-agro-green/10 rounded-lg">
                            <div className="text-agro-green text-[10px] font-black">VNĐ</div>
                          </div>
                          Số tiền muốn nạp <span className="text-red-500 font-black">*</span>
                        </Label>
                        <div className="relative group">
                          <Input
                            type="number"
                            placeholder="Nhập số tiền..."
                            value={depositAmount}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "" || Number(val) >= 0) {
                                setDepositAmount(val);
                              }
                            }}
                            className="pl-12 h-14 text-2xl font-black border-slate-200 focus:border-agro-green focus:ring-agro-green/20 transition-all rounded-xl placeholder:text-slate-300"
                            min={0}
                          />
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-agro-green transition-colors">
                            <Wallet2 className="h-6 w-6" />
                          </div>
                          <div className="absolute right-10 top-1/2 -translate-y-1/2 font-black text-sm text-agro-green/50">VNĐ</div>
                        </div>

                        <div className="grid grid-cols-4 gap-2.5 mt-4">
                          {[500000, 1000000, 2000000, 5000000].map((amount) => (
                            <Button
                              key={amount}
                              type="button"
                              variant={depositAmount === amount.toString() ? "default" : "outline"}
                              size="sm"
                              onClick={() => setDepositAmount(amount.toString())}
                              className={`text-[12px] h-11 font-black transition-all rounded-xl border-2 ${depositAmount === amount.toString()
                                ? "bg-agro-green hover:bg-agro-green/90 border-agro-green shadow-lg shadow-agro-green/20 scale-105"
                                : "bg-white border-slate-100 hover:border-agro-green/30 hover:bg-agro-green/5 text-slate-600"
                                }`}
                            >
                              {(amount / 1000000).toFixed(0)}M
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Payment Method Section */}
                      <div className="space-y-4 pt-4 border-t border-slate-50">
                        <Label className="text-sm font-bold flex items-center gap-2.5 text-slate-700">
                          <div className="p-1.5 bg-agro-green/10 rounded-lg">
                            <Building className="h-4 w-4 text-agro-green" />
                          </div>
                          Phương thức thanh toán
                        </Label>
                        <div className="grid grid-cols-1 gap-3">
                          <div className="relative group cursor-pointer">
                            <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-agro-green bg-agro-green/5 shadow-sm transition-all">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-xl border-2 border-agro-green flex items-center justify-center shadow-sm">
                                  <span className="font-bold text-agro-green text-xs">PayOS</span>
                                </div>
                                <div>
                                  <p className="font-bold text-agro-green">Cổng thanh toán PayOS</p>
                                  <p className="text-xs text-muted-foreground font-medium">Chuyển khoản / Quét mã QR ngân hàng</p>
                                </div>
                              </div>
                              <div className="h-6 w-6 rounded-full bg-agro-green flex items-center justify-center">
                                <div className="h-2 w-2 rounded-full bg-white" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="bg-slate-50/80 p-6 border-t px-8 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto ml-auto">
                      <Button
                        variant="ghost"
                        asChild
                        className="w-full sm:w-auto h-12 px-8 font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-all"
                      >
                        <DialogTrigger>Hủy bỏ</DialogTrigger>
                      </Button>
                      <Button
                        onClick={handleDeposit}
                        disabled={isDepositing || !depositAmount || Number(depositAmount) <= 0}
                        className="w-full sm:w-auto h-12 px-10 bg-agro-green hover:bg-agro-green/90 shadow-xl shadow-agro-green/30 rounded-xl font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {isDepositing ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                          "Xác nhận nạp tiền"
                        )}
                      </Button>
                    </div>
                  </DialogFooter>
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
                <DialogContent className="sm:max-w-[800px] w-[95vw] max-h-[95vh] overflow-y-auto p-0 gap-0 border-none shadow-2xl">
                  <div className="bg-agro-green/5 border-b px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-agro-green/10 rounded-2xl shadow-inner transition-transform">
                        <Banknote className="h-7 w-7 text-agro-green" />
                      </div>
                      <div>
                        <DialogTitle className="text-2xl font-bold tracking-tight">Rút tiền về ngân hàng</DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1">Chuyển tiền nhanh chóng về tài khoản của bạn</p>
                      </div>
                    </div>
                    <div className="bg-white px-5 py-3 rounded-2xl border border-agro-green/10 shadow-sm flex flex-col items-end min-w-[160px]">
                      <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Số dư khả dụng</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xl font-black text-agro-green">
                          {(wallet?.balance || 0).toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-agro-green/70 pt-1 uppercase">VNĐ</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left Side: Amount Selection */}
                      <div className="space-y-5">
                        <div className="space-y-4">
                          <Label htmlFor="withdraw-amount" className="text-sm font-bold flex items-center gap-2.5 text-slate-700">
                            <div className="p-1.5 bg-agro-green/10 rounded-lg">
                              <div className="text-agro-green">VNĐ</div>
                            </div>
                            Số tiền muốn rút <span className="text-red-500 font-black">*</span>
                          </Label>
                          <div className="relative group">
                            <Input
                              id="withdraw-amount"
                              type="number"
                              placeholder="0"
                              value={withdrawForm.amount}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "" || Number(val) >= 0) {
                                  setWithdrawForm(prev => ({ ...prev, amount: val }));
                                }
                              }}
                              className="pl-12 h-14 text-2xl font-black border-slate-200 focus:border-agro-green focus:ring-agro-green/20 transition-all rounded-xl placeholder:text-slate-300"
                              min={0}
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-agro-green transition-colors">
                              <Wallet2 className="h-6 w-6" />
                            </div>
                            <div className="absolute right-10 top-1/2 -translate-y-1/2 font-black text-sm text-agro-green/50">VNĐ</div>
                          </div>

                          <div className="grid grid-cols-4 gap-2.5 mt-4">
                            {[100000, 500000, 1000000, 2000000].map((amount) => (
                              <Button
                                key={amount}
                                type="button"
                                variant={withdrawForm.amount === amount.toString() ? "default" : "outline"}
                                size="sm"
                                onClick={() => setWithdrawForm(prev => ({ ...prev, amount: amount.toString() }))}
                                className={`text-[12px] h-11 font-black transition-all rounded-xl border-2 ${withdrawForm.amount === amount.toString()
                                  ? "bg-agro-green hover:bg-agro-green/90 border-agro-green shadow-lg shadow-agro-green/20 scale-105"
                                  : "bg-white border-slate-100 hover:border-agro-green/30 hover:bg-agro-green/5 text-slate-600"
                                  }`}
                              >
                                {amount >= 1000000 ? `${(amount / 1000000).toFixed(0)}M` : `${(amount / 1000).toFixed(0)}K`}
                              </Button>
                            ))}
                          </div>

                          {Number(withdrawForm.amount) > (wallet?.balance || 0) && Number(withdrawForm.amount) > 0 && (
                            <div className="flex items-center gap-3 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
                              <AlertCircle className="h-5 w-5 shrink-0" />
                              <span>Số dư ví của bạn không đủ để rút số tiền này.</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Side: Bank Selection */}
                      <div className="space-y-5">
                        <div className="space-y-4">
                          <Label className="text-sm font-bold flex items-center gap-2.5 text-slate-700">
                            <div className="p-1.5 bg-agro-green/10 rounded-lg">
                              <Building className="h-4 w-4 text-agro-green" />
                            </div>
                            Ngân hàng thụ hưởng <span className="text-red-500 font-black">*</span>
                          </Label>
                          <Select
                            value={withdrawForm.toBin}
                            onValueChange={(value) => setWithdrawForm(prev => ({ ...prev, toBin: value }))}
                            disabled={banks.length === 0}
                          >
                            <SelectTrigger className="h-14 border-slate-200 focus:ring-agro-green/20 rounded-xl text-left bg-white shadow-sm transition-all hover:border-agro-green/40">
                              <SelectValue placeholder={banks.length === 0 ? "Đang tải danh sách..." : "Chọn ngân hàng"} />
                            </SelectTrigger>
                            <SelectContent className="max-h-80 w-[var(--radix-select-trigger-width)] min-w-[350px] overflow-y-auto rounded-xl shadow-2xl border-slate-100">
                              {banks.length > 0 ? (
                                banks.map((bank) => (
                                  <SelectItem key={bank.bin} value={bank.bin} className="py-3 px-4 focus:bg-agro-green/5 cursor-pointer border-b border-slate-50 last:border-0 transition-colors">
                                    <div className="flex items-center gap-4">
                                      <div className="w-12 h-8 bg-white rounded-lg border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                        <img src={bank.logo} alt={bank.shortName} className="w-full h-full object-contain p-1" />
                                      </div>
                                      <div className="flex flex-col gap-0.5">
                                        <span className="font-black text-sm text-agro-green uppercase tracking-tight">{bank.shortName}</span>
                                        <span className="text-[11px] text-slate-400 font-medium leading-tight line-clamp-1">{bank.name}</span>
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="loading" disabled className="py-4 text-center text-slate-400">Đang tải danh sách...</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-50">
                      {/* Account Number */}
                      <div className="space-y-4">
                        <Label htmlFor="account-number" className="text-sm font-bold flex items-center gap-2.5 text-slate-700">
                          <div className="p-1.5 bg-agro-green/10 rounded-lg">
                            <CreditCard className="h-4 w-4 text-agro-green" />
                          </div>
                          Số tài khoản <span className="text-red-500 font-black">*</span>
                        </Label>
                        <div className="relative group">
                          <Input
                            id="account-number"
                            type="text"
                            placeholder="VD: 123456789"
                            value={withdrawForm.toAccountNumber}
                            onChange={(e) => setWithdrawForm(prev => ({ ...prev, toAccountNumber: e.target.value }))}
                            className="h-12 border-slate-200 focus:border-agro-green transition-all font-mono text-lg tracking-widest text-slate-700 rounded-xl bg-white"
                          />
                          {withdrawForm.toAccountNumber && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              <CheckCircle2 className={`h-5 w-5 transition-colors ${withdrawForm.toAccountNumber.length >= 6 ? "text-agro-green" : "text-slate-200"}`} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Account Holder Name */}
                      <div className="space-y-4">
                        <Label htmlFor="holder-name" className="text-sm font-bold flex items-center justify-between text-slate-700">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-agro-green/10 rounded-lg">
                              <Plus className="h-4 w-4 text-agro-green rotate-45" />
                            </div>
                            Chủ tài khoản thụ hưởng
                          </div>
                          {isLookingUpAccount && <Loader2 className="h-4 w-4 animate-spin text-agro-green" />}
                        </Label>
                        <Input
                          id="holder-name"
                          type="text"
                          placeholder={isLookingUpAccount ? "Đang xác thực thông tin..." : ""}
                          value={withdrawForm.accountHolderName}
                          className="h-12 bg-slate-50 uppercase font-black text-agro-green border-2 rounded-xl flex items-center px-4"
                          disabled
                        />
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">* Tên sẽ hiển thị sau khi nhập số tài khoản & chọn ngân hàng</p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-4 pt-4 border-t border-slate-50">
                      <Label htmlFor="withdraw-desc" className="text-sm font-bold text-slate-700">Ghi chú cho GD (Tùy chọn)</Label>
                      <Input
                        id="withdraw-desc"
                        type="text"
                        placeholder="VD: Rút tiền cá nhân..."
                        value={withdrawForm.description}
                        onChange={(e) => setWithdrawForm(prev => ({ ...prev, description: e.target.value }))}
                        className="h-12 border-slate-200 rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  <DialogFooter className="bg-slate-50/80 p-6 border-t px-8 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto ml-auto">
                      <Button
                        variant="ghost"
                        onClick={() => setWithdrawOpen(false)}
                        className="w-full sm:w-auto h-12 px-8 font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-all"
                      >
                        Hủy bỏ
                      </Button>
                      <Button
                        onClick={handleWithdraw}
                        disabled={isWithdrawing || !withdrawForm.amount || !withdrawForm.toBin || !withdrawForm.toAccountNumber || !withdrawForm.accountHolderName}
                        className="w-full sm:w-auto h-12 px-10 bg-agro-green hover:bg-agro-green/90 shadow-xl shadow-agro-green/30 rounded-xl font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {isWithdrawing ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                            Đang tạo yêu cầu...
                          </>
                        ) : (
                          "Xác nhận giao dịch"
                        )}
                      </Button>
                    </div>
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
                <TableHead className="text-right">Số dư sau GD</TableHead>
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
                transactions.map((tx) => {
                  const isIncoming = tx.type === TransactionType.DEPOSIT || tx.type === TransactionType.REFUND
                  const displayType = TRANSACTION_TYPE_LABELS[tx.type] || "Giao dịch"

                  return (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${isIncoming
                              ? "bg-agro-green/10"
                              : "bg-agro-orange/10"
                              }`}
                          >
                            {isIncoming ? (
                              <ArrowDownLeft className="h-4 w-4 text-agro-green" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-agro-orange" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-medium text-sm">{tx.referenceCode}</p>
                              <Badge variant="outline" className={`text-[10px] py-0 px-1.5 h-4 font-normal ${isIncoming ? "border-agro-green text-agro-green bg-agro-green/5" : "border-agro-orange text-agro-orange bg-agro-orange/5"}`}>
                                {displayType}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{tx.description}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{new Date(tx.createdAt).toLocaleString("vi-VN")}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {tx.balanceAfter.toLocaleString()} VNĐ
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={isIncoming ? "text-agro-green font-medium" : "text-agro-orange font-medium"}>
                          {isIncoming ? "+" : "-"}
                          {Math.abs(tx.amount).toLocaleString()} VNĐ
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
