import { apiClient } from './client';

export interface PartyRoom {
  id: string;
  hostId: string;
  title: string;
  privacy: 'PUBLIC' | 'PRIVATE' | 'FOLLOWERS_ONLY' | 'INVITE_ONLY';
  seatCount: number;
  locked: boolean;
  status: 'OPEN' | 'CLOSED';
  countryCode: string;
  createdAt: string;
}

export async function fetchOpenRooms(): Promise<PartyRoom[]> {
  const response = await apiClient.get<PartyRoom[]>('/rooms');
  return response.data;
}

export async function createRoom(params: {
  title: string;
  privacy?: PartyRoom['privacy'];
  seatCount?: number;
  category?: string;
}): Promise<PartyRoom> {
  const response = await apiClient.post<PartyRoom>('/rooms', params);
  return response.data;
}

export interface RoomSeatOccupant {
  seatNumber: number;
  userId: string;
  displayName: string | null;
  joinedAt: string;
}

export interface RoomDetails extends PartyRoom {
  providerChannel: string;
  seats: RoomSeatOccupant[];
  moderatorIds: string[];
}

export async function fetchRoomDetails(roomId: string): Promise<RoomDetails> {
  const response = await apiClient.get<RoomDetails>(`/rooms/${roomId}`);
  return response.data;
}

export interface RoomJoinResult {
  room: RoomDetails;
  token: string;
  role: 'host' | 'audience';
}

// Real, fresh token every time — role depends on whether you currently
// hold a seat (see rooms.service.ts's joinToken), so this must be called
// again after taking or leaving a seat, not cached across the visit.
export async function joinRoom(roomId: string): Promise<RoomJoinResult> {
  const response = await apiClient.post<RoomJoinResult>(`/rooms/${roomId}/join`);
  return response.data;
}

export async function requestSeat(roomId: string, seatNumber: number): Promise<unknown> {
  const response = await apiClient.post(`/rooms/${roomId}/seats/${seatNumber}`);
  return response.data;
}

export async function leaveSeat(roomId: string): Promise<void> {
  await apiClient.delete(`/rooms/${roomId}/seats/me`);
}

export async function closeRoom(roomId: string): Promise<void> {
  await apiClient.post(`/rooms/${roomId}/close`);
}

export interface SeatRequestRow {
  id: string;
  userId: string;
  displayName: string | null;
  createdAt: string;
}

export async function fetchSeatRequests(roomId: string): Promise<SeatRequestRow[]> {
  const response = await apiClient.get<SeatRequestRow[]>(`/rooms/${roomId}/seat-requests`);
  return response.data;
}

export async function approveSeatRequest(roomId: string, requestId: string, seatNumber: number): Promise<unknown> {
  const response = await apiClient.post(`/rooms/${roomId}/seat-requests/${requestId}/approve/${seatNumber}`);
  return response.data;
}

export async function rejectSeatRequest(roomId: string, requestId: string): Promise<unknown> {
  const response = await apiClient.post(`/rooms/${roomId}/seat-requests/${requestId}/reject`);
  return response.data;
}

export async function removeGuest(roomId: string, userId: string): Promise<void> {
  await apiClient.post(`/rooms/${roomId}/remove/${userId}`);
}

export async function muteGuest(roomId: string, userId: string): Promise<void> {
  await apiClient.post(`/rooms/${roomId}/mute/${userId}`);
}

export async function unmuteGuest(roomId: string, userId: string): Promise<void> {
  await apiClient.post(`/rooms/${roomId}/unmute/${userId}`);
}

export async function banGuest(roomId: string, userId: string): Promise<void> {
  await apiClient.post(`/rooms/${roomId}/ban/${userId}`);
}

export async function inviteToSeat(roomId: string, userId: string): Promise<unknown> {
  const response = await apiClient.post(`/rooms/${roomId}/invite/${userId}`);
  return response.data;
}

export interface RoomInvite {
  requestId: string;
  roomId: string;
  roomTitle: string;
  hostDisplayName: string | null;
  createdAt: string;
}

export async function fetchMyInvites(): Promise<RoomInvite[]> {
  const response = await apiClient.get<RoomInvite[]>('/rooms/invites');
  return response.data;
}

export async function acceptInvite(roomId: string, seatNumber: number): Promise<unknown> {
  const response = await apiClient.post(`/rooms/${roomId}/invite/accept/${seatNumber}`);
  return response.data;
}

export async function declineInvite(requestId: string): Promise<unknown> {
  const response = await apiClient.post(`/rooms/invites/${requestId}/decline`);
  return response.data;
}
