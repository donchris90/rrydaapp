import { apiClient } from './client';

export interface PartyRoom {
  id: string;
  hostId: string;
  title: string;
  privacy: 'PUBLIC' | 'PRIVATE' | 'FOLLOWERS_ONLY' | 'INVITE_ONLY';
  seatCount: number;
  // A video party or an audio lounge — what the Party tab's two filters use.
  mode: 'VIDEO' | 'AUDIO';
  themeColor: string | null;
  locked: boolean;
  status: 'OPEN' | 'CLOSED';
  countryCode: string;
  createdAt: string;
}

export async function fetchOpenRooms(): Promise<PartyRoom[]> {
  const response = await apiClient.get<PartyRoom[] | { rooms?: PartyRoom[] }>('/rooms');
  // Normalize the transport boundary. A malformed/legacy response must never
  // reach FlatList/filter code as undefined or a non-array value.
  return Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.data?.rooms)
      ? response.data.rooms
      : [];
}

function normalizePartyRoom(raw: any): PartyRoom {
  return {
    id: String(raw?.id ?? ''),
    hostId: String(raw?.hostId ?? ''),
    title: typeof raw?.title === 'string' && raw.title.trim() ? raw.title : 'Party Room',
    privacy: ['PUBLIC', 'PRIVATE', 'FOLLOWERS_ONLY', 'INVITE_ONLY'].includes(raw?.privacy) ? raw.privacy : 'PUBLIC',
    seatCount: Number.isInteger(raw?.seatCount) && raw.seatCount >= 1 ? raw.seatCount : 8,
    mode: raw?.mode === 'VIDEO' ? 'VIDEO' : 'AUDIO',
    themeColor: typeof raw?.themeColor === 'string' ? raw.themeColor : null,
    locked: raw?.locked === true,
    status: raw?.status === 'CLOSED' ? 'CLOSED' : 'OPEN',
    countryCode: typeof raw?.countryCode === 'string' ? raw.countryCode : '',
    createdAt: typeof raw?.createdAt === 'string' ? raw.createdAt : new Date(0).toISOString(),
  };
}

export async function createRoom(params: {
  title: string;
  privacy?: PartyRoom['privacy'];
  seatCount?: number;
  category?: string;
  themeColor?: string;
  // 'VIDEO' for a video party, 'AUDIO' for an audio lounge.
  mode?: 'VIDEO' | 'AUDIO';
}): Promise<PartyRoom> {
  const response = await apiClient.post<PartyRoom>('/rooms', params);
  return normalizePartyRoom(response.data);
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
  // Guests currently muted by the host/a moderator (derived server-side
  // from the moderation log).
  mutedUserIds: string[];
  lockedSeatNumbers: number[];
}

function normalizeSeat(raw: any): RoomSeatOccupant | null {
  const seatNumber = Number(raw?.seatNumber);
  if (!Number.isInteger(seatNumber) || seatNumber < 0) return null;
  const userId = String(raw?.userId ?? '');
  if (!userId) return null;
  return {
    seatNumber,
    userId,
    displayName: typeof raw?.displayName === 'string' ? raw.displayName : null,
    joinedAt: typeof raw?.joinedAt === 'string' ? raw.joinedAt : new Date(0).toISOString(),
  };
}

function normalizeRoomArrays(raw: any) {
  const seats = Array.isArray(raw?.seats)
    ? raw.seats.map(normalizeSeat).filter((seat: RoomSeatOccupant | null): seat is RoomSeatOccupant => seat !== null)
    : [];
  const moderatorIds = Array.isArray(raw?.moderatorIds)
    ? raw.moderatorIds.map((id: any) => String(id)).filter(Boolean)
    : [];
  const mutedUserIds = Array.isArray(raw?.mutedUserIds)
    ? raw.mutedUserIds.map((id: any) => String(id)).filter(Boolean)
    : [];
  const lockedSeatNumbers = Array.isArray(raw?.lockedSeatNumbers)
    ? raw.lockedSeatNumbers.map((n: any) => Number(n)).filter((n: number) => Number.isInteger(n) && n >= 0)
    : [];
  return { seats, moderatorIds, mutedUserIds, lockedSeatNumbers };
}

export async function fetchRoomDetails(roomId: string): Promise<RoomDetails> {
  const response = await apiClient.get<Partial<RoomDetails> | { room?: Partial<RoomDetails> }>(`/rooms/${roomId}`);
  const raw: any = (response.data as any)?.room ?? response.data;
  if (!raw || typeof raw !== 'object') throw new Error('Invalid room response');
  return {
    ...normalizePartyRoom(raw),
    providerChannel: typeof raw.providerChannel === 'string' ? raw.providerChannel : '',
    ...normalizeRoomArrays(raw),
    seatCount: Number.isInteger(raw.seatCount) && raw.seatCount >= 1 ? raw.seatCount : 8,
    mode: raw.mode === 'VIDEO' ? 'VIDEO' : 'AUDIO',
  } as RoomDetails;
}

export interface RoomJoinResult {
  room: RoomDetails;
  token: string;
  role: 'host' | 'audience';
  // True when this user is currently muted in the room. A muted seat-holder
  // is issued an 'audience' token, so role === 'audience' with a seat means
  // "muted", not "not seated".
  muted?: boolean;
}

// Real, fresh token every time — role depends on whether you currently
// hold a seat (see rooms.service.ts's joinToken), so this must be called
// again after taking or leaving a seat, not cached across the visit.
export async function joinRoom(roomId: string): Promise<RoomJoinResult> {
  const response = await apiClient.post<RoomJoinResult>(`/rooms/${roomId}/join`);
  const raw: any = response.data;
  if (!raw || typeof raw !== 'object' || typeof raw.token !== 'string' || !raw.room) {
    throw new Error('Invalid room join response');
  }
  const roomRaw = raw.room;
  return {
    room: {
      ...normalizePartyRoom(roomRaw),
      providerChannel: typeof roomRaw.providerChannel === 'string' ? roomRaw.providerChannel : '',
      ...normalizeRoomArrays(roomRaw),
    },
    token: raw.token,
    role: raw.role === 'host' ? 'host' : 'audience',
    muted: raw.muted === true,
  };
}

export async function requestSeat(roomId: string, seatNumber: number): Promise<unknown> {
  const response = await apiClient.post(`/rooms/${roomId}/seats/${seatNumber}`);
  return response.data;
}

export async function leaveSeat(roomId: string): Promise<void> {
  await apiClient.delete(`/rooms/${roomId}/seats/me`);
}

// Host only. Everyone in the room is pushed a 'room:theme' event.
export async function updateRoomTheme(roomId: string, themeColor: string): Promise<{ themeColor: string }> {
  const response = await apiClient.patch<{ themeColor: string }>(`/rooms/${roomId}/theme`, { themeColor });
  return response.data;
}

// Host-only: switch an open room between video and audio while live.
export async function updateRoomMode(roomId: string, mode: PartyRoom['mode']): Promise<{ mode: PartyRoom['mode'] }> {
  const response = await apiClient.patch<{ mode: PartyRoom['mode'] }>(`/rooms/${roomId}/mode`, { mode });
  return response.data;
}

export async function updateRoomSeatCount(roomId: string, seatCount: number): Promise<{ seatCount: number }> {
  const response = await apiClient.patch<{ seatCount: number }>(`/rooms/${roomId}/seat-count`, { seatCount });
  return response.data;
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
  const response = await apiClient.get<SeatRequestRow[] | { requests?: SeatRequestRow[] }>(`/rooms/${roomId}/seat-requests`);
  return Array.isArray(response.data)
    ? response.data
    : Array.isArray((response.data as any)?.requests)
      ? (response.data as any).requests
      : [];
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
  const response = await apiClient.get<RoomInvite[] | { invites?: RoomInvite[] }>('/rooms/invites');
  return Array.isArray(response.data)
    ? response.data
    : Array.isArray((response.data as any)?.invites)
      ? (response.data as any).invites
      : [];
}

export async function acceptInvite(roomId: string, seatNumber: number): Promise<unknown> {
  const response = await apiClient.post(`/rooms/${roomId}/invite/accept/${seatNumber}`);
  return response.data;
}

export async function declineInvite(requestId: string): Promise<unknown> {
  const response = await apiClient.post(`/rooms/invites/${requestId}/decline`);
  return response.data;
}

export async function lockRoomSeat(roomId: string, seatNumber: number): Promise<void> {
  await apiClient.post(`/rooms/${roomId}/seats/${seatNumber}/lock`);
}

export async function unlockRoomSeat(roomId: string, seatNumber: number): Promise<void> {
  await apiClient.post(`/rooms/${roomId}/seats/${seatNumber}/unlock`);
}
