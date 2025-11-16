// lib/context/FollowedGroupsContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";

export type GroupMinimal = {
  id: string;
  name: string;
  avatar_url?: string | null;
  owner_id: string;
};

type FollowedGroupsContextType = {
  groups: GroupMinimal[];
  refreshGroups: () => void;
};

const FollowedGroupsContext = createContext<FollowedGroupsContextType>({
  groups: [],
  refreshGroups: () => {},
});

export const FollowedGroupsProvider = ({ children }: { children: ReactNode }) => {
  const [groups, setGroups] = useState<GroupMinimal[]>([]);

  const fetchGroups = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // กลุ่มที่สร้าง
    const { data: ownedGroups } = await supabase
      .from("groups")
      .select("id,name,avatar_url,owner_id")
      .eq("owner_id", user.id);

    // กลุ่มที่ติดตาม
    const { data: followedGroups } = await supabase
      .from("group_members")
      .select("groups(id,name,avatar_url,owner_id)")
      .eq("user_id", user.id);

    // กำหนด type ให้ตรงกับ array จริงของ Supabase
    type FollowedGroupRow = {
      groups?: GroupMinimal[] | null;
    };

    const followedGroupsData: GroupMinimal[] = (followedGroups ?? [])
      .flatMap((f: FollowedGroupRow) => f.groups ?? []) // flatten + ป้องกัน undefined
      .map(g => ({
        id: g.id,
        name: g.name,
        avatar_url: g.avatar_url ?? null,
        owner_id: g.owner_id,
      }));

    // รวม owned + followed และกรองซ้ำ
    const combinedGroups: GroupMinimal[] = [
      ...(ownedGroups ?? []),
      ...followedGroupsData,
    ].filter(
      (value, index, self) => index === self.findIndex(g => g.id === value.id)
    );

    setGroups(combinedGroups);
  };

  useEffect(() => {
  // สร้างฟังก์ชัน async ภายใน effect
  const loadGroups = async () => {
    await fetchGroups();
  };

  loadGroups();
}, []);


  return (
    <FollowedGroupsContext.Provider value={{ groups, refreshGroups: fetchGroups }}>
      {children}
    </FollowedGroupsContext.Provider>
  );
};

export const useFollowedGroups = () => useContext(FollowedGroupsContext);
