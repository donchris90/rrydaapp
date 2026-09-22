import { apiClient } from './client';

export type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type IdType = 'NIN' | 'DRIVERS_LICENSE' | 'VOTERS_CARD' | 'PASSPORT';

export interface KycSubmission {
  id: string;
  status: KycStatus;
  submittedAt: string;
  reviewedAt: string | null;
  // Only set when rejected: what to fix before trying again.
  rejectionReason: string | null;
  fullName: string;
  idType: IdType;
  idLast4: string;
}

export interface KycState {
  verified: boolean;
  submission: KycSubmission | null;
}

export const fetchKycStatus = async () => (await apiClient.get<KycState>('/kyc')).data;

export const submitKyc = async (input: {
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  idType: IdType;
  idNumber: string;
  idImage: string; // base64
  selfieImage: string; // base64
}) => (await apiClient.post<KycSubmission>('/kyc', input)).data;
