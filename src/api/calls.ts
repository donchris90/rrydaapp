import { apiClient } from './client';

export type CallStatus = 'RINGING' | 'ACCEPTED' | 'DECLINED' | 'ENDED' | 'MISSED';

export interface CallRecord {
  id: string;
  callerId: string;
  calleeId: string;
  providerChannel: string;
  status: CallStatus;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

export async function initiateCall(calleeId: string): Promise<CallRecord> {
  const response = await apiClient.post<CallRecord>('/calls', { calleeId });
  return response.data;
}

export async function fetchCallStatus(callId: string): Promise<CallRecord> {
  const response = await apiClient.get<CallRecord>(`/calls/${callId}`);
  return response.data;
}

export async function acceptCall(callId: string): Promise<CallRecord> {
  const response = await apiClient.post<CallRecord>(`/calls/${callId}/accept`);
  return response.data;
}

export async function declineCall(callId: string): Promise<CallRecord> {
  const response = await apiClient.post<CallRecord>(`/calls/${callId}/decline`);
  return response.data;
}

export async function endCall(callId: string): Promise<CallRecord> {
  const response = await apiClient.post<CallRecord>(`/calls/${callId}/end`);
  return response.data;
}

export async function joinCall(callId: string): Promise<{ call: CallRecord; token: string }> {
  const response = await apiClient.post<{ call: CallRecord; token: string }>(`/calls/${callId}/join`);
  return response.data;
}
