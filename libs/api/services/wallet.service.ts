import axiosInstance from "../axios-instance";
import { API_ENDPOINTS } from "../endpoints/config";
import type { ApiResponse, PaginatedResponse } from "@/libs/types";
import type {
  WalletDTO,
  WalletTransactionDTO,
  CreateWithdrawalRequest,
  WithdrawalRequest,
  WithdrawalAccountBalanceResponse
} from "@/libs/types/wallet.types";

export const WalletService = {
  // Wallet
  getMyWallet: async (): Promise<ApiResponse<WalletDTO>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.WALLET.CURRENT);
    return response.data;
  },

  getAllWallets: async (): Promise<PaginatedResponse<WalletDTO>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.WALLET.GET_ALL);
    return response.data;
  },

  getWalletDetail: async (id: string): Promise<ApiResponse<WalletDTO>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.WALLET.GET_DETAIL(id));
    return response.data;
  },

  // Transactions
  getTransactionsByWallet: async (walletId: string, page = 1, limit = 10): Promise<PaginatedResponse<WalletTransactionDTO>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.WALLET_TRANSACTION.GET_BY_WALLET(walletId), {
      params: { page, limit }
    });
    return response.data;
  },

  // Withdrawals
  createWithdrawal: async (data: CreateWithdrawalRequest): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.WITHDRAWAL.CREATE, data);
    return response.data;
  },

  getMyWithdrawals: async (page = 1, limit = 10): Promise<PaginatedResponse<WithdrawalRequest>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.WITHDRAWAL.CURRENT, {
      params: { page, limit }
    });
    return response.data;
  },

  getWithdrawalAccountBalance: async (): Promise<ApiResponse<WithdrawalAccountBalanceResponse>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.WITHDRAWAL.ACCOUNT_BALANCE);
    return response.data;
  }
};
