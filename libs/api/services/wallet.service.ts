import axiosInstance from "../axios-instance";
import { API_ENDPOINTS } from "../endpoints/config";
import type { ApiResponse, PaginatedResponse } from "@/libs/types";
import type {
  WalletDTO,
  WalletTransactionDTO,
  CreateWithdrawalRequest,
  WithdrawalRequest,
  WithdrawalAccountBalanceResponse,
} from "@/libs/types/wallet.types";

export const WalletService = {
  getTransactionsByWallet: async (
    walletId: string,
    params?: { page?: number; limit?: number },
  ): Promise<PaginatedResponse<WalletTransactionDTO>> => {
    const response = await axiosInstance.get(
      API_ENDPOINTS.WALLET_TRANSACTION.GET_BY_WALLET(walletId),
      { params: { ...params } },
    );
    return response.data;
  },

  // Admin: get all wallet transactions with filters
  getAllTransactions: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<WalletTransactionDTO>> => {
    const response = await axiosInstance.get(
      API_ENDPOINTS.WALLET_TRANSACTION.GET_ALL,
      { params },
    );
    return response.data;
  },

  // Withdrawals
  createWithdrawal: async (
    data: CreateWithdrawalRequest,
  ): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post(
      API_ENDPOINTS.WITHDRAWAL.CREATE,
      data,
    );
    return response.data;
  },

  getMyWithdrawals: async (
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponse<WithdrawalRequest>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.WITHDRAWAL.CURRENT, {
      params: { page, limit },
    });
    return response.data;
  },

  getWithdrawalAccountBalance: async (): Promise<
    ApiResponse<WithdrawalAccountBalanceResponse>
  > => {
    const response = await axiosInstance.get(
      API_ENDPOINTS.WITHDRAWAL.ACCOUNT_BALANCE,
    );
    return response.data;
  },
};
