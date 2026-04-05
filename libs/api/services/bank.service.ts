import axios from "axios";
import { API_CONFIG } from "../endpoints/config";

export interface VietQRBank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
}

export interface BankLookupResponse {
  code: number;
  success: boolean;
  msg: string;
  data: {
    ownerName: string;
  } | null;
}

const VIETQR_API_URL = "https://api.vietqr.io/v2";
const BANKLOOKUP_API_URL = "https://api.banklookup.net";

export const BankService = {
  getBanks: async (): Promise<VietQRBank[]> => {
    try {
      const response = await axios.get(`${VIETQR_API_URL}/banks`);
      return response.data.data || [];
    } catch (error) {
      console.error("Failed to fetch banks from VietQR:", error);
      return [];
    }
  },

  lookupAccount: async (bank: string, account: string): Promise<any> => {
    if (!bank || !account) return null;

    const apiKey = API_CONFIG.BANKLOOKUP_API_KEY;
    const apiSecret = API_CONFIG.BANKLOOKUP_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.warn("BankLookup API Key or API Secret is missing in API_CONFIG. Account lookup disabled.");
      return null;
    }

    try {
      const response = await axios.post<BankLookupResponse>(
        `${BANKLOOKUP_API_URL}`,
        {
          bank,
          account,
        },
        {
          headers: {
            "x-api-key": apiKey,
            "x-api-secret": apiSecret,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data.ownerName;
      } else {
        console.warn("BankLookup returned non-success code:", response.data);
      }
      return null;
    } catch (error: any) {
      console.error("BankLookUp failed:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return null;
    }
  },
};
