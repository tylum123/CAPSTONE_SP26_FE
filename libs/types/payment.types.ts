// Payment Types
export interface Payment {
  id: string;
  jobId: string;
  farmerId: string;
  workerId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  transactionDate: string;
  paymentMethod: string;
}

// Wallet Types
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface PaymentItem {
  name: string;
  quantity: number;
  price: number;
  unit: string;
  taxPercentage: number;
}

export interface PaymentTransaction {
  reference: string;
  amount: number;
  accountNumber: string;
  description: string;
  transactionDateTime: string;
  virtualAccountName: string;
  virtualAccountNumber: string;
  counterAccountBankId: string;
  counterAccountBankName: string;
  counterAccountName: string;
  counterAccountNumber: string;
}

export interface PaymentDTO {
  id: string;
  orderCode: number;
  totalAmount: number;
  description: string;
  paymentLinkId: string;
  qrCode: string;
  checkoutUrl: string;
  status: string;
  amount: number;
  amountPaid: number;
  amountRemaining: number;
  bin: string;
  accountNumber: string;
  accountName: string;
  currency: string;
  returnUrl: string;
  cancelUrl: string;
  createdAt: string;
  canceledAt: string;
  cancellationReason: string;
  lastTransactionUpdate: string;
  buyerName: string;
  buyerCompanyName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress: string;
  expiredAt: string;
  buyerNotGetInvoice: boolean;
  taxPercentage: number;
  items: PaymentItem[];
  transactions: PaymentTransaction[];
}

export interface PaymentRequest {
  totalAmount: number;
  description: string;
}

export interface CancelPaymentDTO {
  id: string;
  orderCode: number;
  amount: number;
  amountPaid: number;
  amountRemaining: number;
  status: string;
  createdAt: string;
  transactions: PaymentTransaction[];
  cancellationReason: string;
  canceledAt: string;
}

export interface PaymentCallbackRequestParams {
  code?: string;
  id?: string;
  cancel: boolean;
  status?: string;
  orderCode: number;
}

export interface VerifyPaymentData {
  orderCode: number;
  amount: number;
  description: string;
  accountNumber: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  code: string;
  desc: string;
  counterAccountBankId: string;
  counterAccountBankName: string;
  counterAccountName: string;
  counterAccountNumber: string;
  virtualAccountName: string;
  virtualAccountNumber: string;
}

export interface VerifyPaymentDTO {
  code: string;
  desc: string;
  success: boolean;
  data: VerifyPaymentData;
  signature: string;
}
