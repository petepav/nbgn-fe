import axios from 'axios';

// Always use the full URL - backend should handle CORS
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://207.154.215.37:8080';

export interface CreateVoucherLinkRequest {
  voucher_id: string;
  password?: string;
}

export interface CreateVoucherLinkResponse {
  shareable_code: string;
  shareable_link: string;
}

export interface VerifyVoucherRequest {
  code: string;
  password?: string;
}

export interface VerifyVoucherResponse {
  valid: boolean;
  voucher?: {
    voucher_id: string;
    amount: string;
    creator_address: string;
    claimed: boolean;
    cancelled: boolean;
  };
  signature?: string;
  deadline?: number;
  contract_address?: string;
}

export interface ClaimVoucherRequest {
  code: string;
  password?: string;
  recipient_address: string;
}

export interface ClaimVoucherResponse {
  success: boolean;
  message: string;
  voucher_id: string;
  recipient: string;
  amount: string;
  deadline: number;
  signature: string;
  contract_address: string;
}

export interface UserVoucher {
  voucherId: string;
  amount: string;
  createdAt: string;
  expiresAt?: string;
  claimed: boolean;
  claimedBy?: string;
  claimedAt?: string;
  shareableLink: string;
}

class VoucherAPI {
  private api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add request interceptor for debugging
    this.api.interceptors.request.use(
      (config) => {
        console.log('API Request:', config.method?.toUpperCase(), config.url);
        console.log('Base URL:', config.baseURL);
        console.log('Full URL:', (config.baseURL || '') + (config.url || ''));
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for debugging
    this.api.interceptors.response.use(
      (response) => {
        console.log('API Response:', response.status, response.data);
        return response;
      },
      (error) => {
        console.error('API Error:', error.response?.status, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  async createVoucherLink(data: CreateVoucherLinkRequest): Promise<CreateVoucherLinkResponse> {
    const response = await this.api.post<CreateVoucherLinkResponse>('/api/vouchers/link', data);
    return response.data;
  }

  async verifyVoucher(data: VerifyVoucherRequest): Promise<VerifyVoucherResponse> {
    // Send multiple field names to increase compatibility
    const requestData = {
      code: data.code,
      voucher_code: data.code,
      shareable_code: data.code,
      password: data.password
    };
    
    console.log('Verify request data:', requestData);
    const response = await this.api.post<VerifyVoucherResponse>('/api/vouchers/verify', requestData);
    return response.data;
  }

  async claimVoucher(data: ClaimVoucherRequest): Promise<ClaimVoucherResponse> {
    console.log('Claim request data:', data);
    const response = await this.api.post<ClaimVoucherResponse>('/api/vouchers/claim', data);
    return response.data;
  }

  async syncVoucher(voucherId: string): Promise<any> {
    console.log('Calling sync endpoint for voucher:', voucherId);
    try {
      const response = await this.api.post(`/api/vouchers/sync/${voucherId}`);
      console.log('Sync response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Sync endpoint error:', error);
      throw error;
    }
  }

  async getUserVouchers(address: string): Promise<UserVoucher[]> {
    const response = await this.api.get<UserVoucher[]>(`/api/vouchers/user/${address}`);
    return response.data;
  }

  async deleteVoucher(voucherId: string): Promise<any> {
    console.log('Deleting voucher from backend:', voucherId);
    try {
      const response = await this.api.delete(`/api/vouchers/${voucherId}`);
      console.log('Delete response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Delete endpoint error:', error);
      throw error;
    }
  }

  async getBackendWallet(): Promise<{ wallet_address: string; message: string }> {
    console.log('Getting backend wallet address...');
    try {
      const response = await this.api.get('/api/debug/wallet');
      console.log('Backend wallet response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Backend wallet endpoint error:', error);
      throw error;
    }
  }

  async updateClaimStatus(code: string, txHash: string, success: boolean = true): Promise<any> {
    console.log('Updating claim status:', { code, txHash, success });
    const response = await this.api.post('/api/vouchers/claim-status', { 
      code: code,
      tx_hash: txHash,
      success: success
    });
    return response.data;
  }

  async executeClaimGasless(data: ClaimVoucherRequest): Promise<any> {
    console.log('Executing gasless claim:', data);
    const response = await this.api.post('/api/vouchers/execute-claim', data);
    return response.data;
  }
}

export const voucherAPI = new VoucherAPI();