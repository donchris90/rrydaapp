import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { UserProfileSheet } from '../components/UserProfileSheet';

interface ProfileSheetApi {
  open: (userId: string) => void;
}
const Ctx = createContext<ProfileSheetApi>({ open: () => {} });

// One profile card for the whole signed-in app: any screen can call
// useProfileSheet().open(userId) (a host's name in a live, a row in search or a
// follower list, a "viewed your profile" notification) and the card appears above
// whatever is on screen.
export function ProfileSheetProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const open = useCallback((id: string) => setUserId(id), []);
  const value = useMemo(() => ({ open }), [open]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <UserProfileSheet userId={userId} visible={!!userId} onClose={() => setUserId(null)} />
    </Ctx.Provider>
  );
}

export const useProfileSheet = () => useContext(Ctx);
