"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";

// --- กำหนดโครงสร้างข้อมูลกลุ่มแบบย่อ (Type Definition) ---
export type GroupMinimal = {
  id: string;
  name: string;
  avatar_url?: string | null;
  owner_id: string;
};

// --- กำหนดรูปแบบของ Context ---
type FollowedGroupsContextType = {
  groups: GroupMinimal[];
  refreshGroups: () => void; // ฟังก์ชันสำหรับรีโหลดข้อมูลกลุ่ม
};

// สร้าง Context พร้อมค่าเริ่มต้น
const FollowedGroupsContext = createContext<FollowedGroupsContextType>({
  groups: [],
  refreshGroups: () => {},
});

// --- Provider: ตัวให้บริการข้อมูลแก่ Component ลูก ---
export const FollowedGroupsProvider = ({ children }: { children: ReactNode }) => {
  const [groups, setGroups] = useState<GroupMinimal[]>([]);

  // --- ฟังก์ชันหลัก: ดึงข้อมูลกลุ่มทั้งหมด (ที่สร้างเอง + ที่กดติดตาม) ---
  const fetchGroups = async () => {
    // 1. ตรวจสอบข้อมูลผู้ใช้ปัจจุบัน
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // 2. ดึงข้อมูลกลุ่มที่เราเป็น "เจ้าของ" (Created Groups)
    const { data: ownedGroups } = await supabase
      .from("groups")
      .select("id,name,avatar_url,owner_id")
      .eq("owner_id", user.id);

    // 3. ดึงข้อมูลกลุ่มที่เราเป็น "สมาชิก" (Followed Groups)
    // ใช้ Join Table: group_members -> groups
    const { data: followedGroups } = await supabase
      .from("group_members")
      .select("groups(id,name,avatar_url,owner_id)")
      .eq("user_id", user.id);

    // Type ชั่วคราวสำหรับการแปลงข้อมูลจาก Join Table
    type FollowedGroupRow = {
      groups?: GroupMinimal[] | null;
    };

    // 4. แปลงโครงสร้างข้อมูล (Flatten Data) ให้เป็น Array ชั้นเดียว
    const followedGroupsData: GroupMinimal[] = (followedGroups ?? [])
      .flatMap((f: FollowedGroupRow) => f.groups ?? [])
      .map(g => ({
        id: g.id,
        name: g.name,
        avatar_url: g.avatar_url ?? null,
        owner_id: g.owner_id,
      }));

    // 5. รวมกลุ่มทั้งสองประเภทเข้าด้วยกัน และกรองกลุ่มที่ซ้ำกันออก (Deduplicate)
    // (กลุ่มที่เป็นเจ้าของก็อาจเป็นสมาชิกด้วย แต่จะถูกนับเป็น Owned Group)
    const combinedGroups: GroupMinimal[] = [
      ...(ownedGroups ?? []),
      ...followedGroupsData,
    ].filter(
      (value, index, self) => 
        // เก็บเฉพาะ Index แรกที่พบ Group ID นั้นๆ
        index === self.findIndex(g => g.id === value.id)
    );

    // อัปเดตข้อมูลลง State
    setGroups(combinedGroups);
  };

  // --- Effect: โหลดข้อมูลทันทีเมื่อ Component ถูกเรียกใช้ ---
  useEffect(() => {
    const loadGroups = async () => {
      await fetchGroups();
    };

    loadGroups();
  }, []); // [] หมายถึงโหลดครั้งเดียวเมื่อ Mount

  return (
    <FollowedGroupsContext.Provider value={{ groups, refreshGroups: fetchGroups }}>
      {children}
    </FollowedGroupsContext.Provider>
  );
};

// --- Hook สำหรับให้ Component อื่นเรียกใช้ข้อมูลได้ง่ายๆ ---
export const useFollowedGroups = () => useContext(FollowedGroupsContext);