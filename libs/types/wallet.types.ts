export interface WalletDTO {
    id: string;
    userId: string;
    balance: number;
    lockedBalance: number;
    isActive: boolean;
    createdAt?: string;
    updateAt?: string;
}

export interface WalletTransactionDTO {
    id: string;
    walletId: string;
    wallet?: WalletDTO;
    jobDetailId?: string;
    type: string | number;
    amount: number;
    balanceAfter: number;
    referenceCode: string;
    description: string;
    createdAt: string;
}

export interface WithdrawalRequest {
    id: string;
    walletId: string;
    wallet?: WalletDTO;
    amount: number;
    bankAccountNumber: string;
    bankName: string;
    accountHolderName: string;
    status: string; // PENDING / APPROVED / REJECTED / PAID
    note: string;
    createdAt: string;
    processedAt?: string;
}

export enum BinBank {
    Vietcombank = 970436,
    BIDV = 970418,
    VietinBank = 970415,
    Agribank = 970405,
    MB = 970422,
    ACB = 970416,
    Techcombank = 970407,
    Sacombank = 970403,
    VPBank = 970432,
    TPBank = 970423,
    VIB = 970441,
    HDBank = 970437,
    SHB = 970443,
    OCB = 970448,
    MSB = 970426,
    SeABank = 970440,
    Eximbank = 970431,
    NamABank = 970428,
    PVcomBank = 970412,
    LPBank = 970449,
    NCB = 970419,
    SCB = 970429,
    Saigonbank = 970400,
    BaoVietBank = 970438,
    KienlongBank = 970452,
    VietBank = 970454,
    CoOpBank = 970446,
    PublicBank = 970439,
    WooriBank = 970457,
    UOB = 970458
}

export interface CreateWithdrawalRequest {
    amount: number;
    toBin: BinBank;
    toAccountNumber: string;
    description?: string;
    category: string[];
    accountHolderName?: string;
}

export interface WithdrawalAccountBalanceResponse {
    balance: number;
    availableBalance: number;
    currency?: string;
}
