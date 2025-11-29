"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useFollowedGroups } from "@/lib/context/FollowedGroupsContext";
import { usePathname } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { UsersRound } from "lucide-react";

// --- กำหนดโครงสร้างข้อมูล (Types) ---
interface Group {
  id: string;
  name: string;
  avatar_url: string | null;
  owner_id: string;
}

interface UserGroupReadStatus {
  group_id: string;
  last_read_at: string; // Timestamp ของการอ่านล่าสุด
}

// --- Component หลัก: แถบนำทางรอง (แสดงกลุ่มที่ติดตาม) ---
export const NavbarSub = () => {
  // --- Context & Hooks ---
  const { groups } = useFollowedGroups(); // ดึงรายชื่อกลุ่มที่ติดตาม
  const pathname = usePathname(); // ดึง URL ปัจจุบัน

  // --- State Management ---
  // เก็บจำนวนโพสต์ที่ยังไม่อ่าน: { groupId: count }
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({}); 
  const [userId, setUserId] = useState<string | null>(null); // เก็บ ID ผู้ใช้
  const [isGroupsVisible, setIsGroupsVisible] = useState(true); // สถานะเปิด/ปิดแถบแสดงกลุ่ม

  // --- Effect: ดึง User ID เมื่อโหลด ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []); // ทำงานเมื่อ Mount ครั้งเดียว

  // --- Logic: ทำเครื่องหมายว่าอ่านกลุ่มนี้แล้ว (เมื่อคลิกเข้ากลุ่ม) ---
  const markGroupAsRead = async (groupId: string) => {
    if (!userId) return;

    // 1. อัปเดตเวลาอ่านล่าสุดลงฐานข้อมูล (Upsert)
    await supabase.from("user_group_read_status").upsert(
      [
        {
          user_id: userId,
          group_id: groupId,
          last_read_at: new Date().toISOString(),
        },
      ],
      { onConflict: "user_id,group_id" } // Conflict by unique pair (user_id, group_id)
    );

    // 2. รีเซ็ตตัวเลขแจ้งเตือนใน State เป็น 0 ทันทีเพื่ออัปเดต UI
    setUnreadCounts((prev) => ({
      ...prev,
      [groupId]: 0,
    }));
  };

  // --- Effect: คำนวณจำนวนโพสต์ที่ยังไม่อ่าน & ตั้งค่า Realtime Listener ---
  useEffect(() => {
    if (groups.length === 0 || !userId) return;

    const fetchUnreadCounts = async () => {
      // 1. ดึงข้อมูลว่า User อ่านแต่ละกลุ่มไปถึงเวลาไหนแล้ว
      const { data: readStatusData } = (await supabase
        .from("user_group_read_status")
        .select("group_id, last_read_at")
        .in(
          "group_id",
          groups.map((g) => g.id)
        )
        .eq("user_id", userId)) as { data: UserGroupReadStatus[] | null };

      const counts: Record<string, number> = {};

      // 2. วนลูปแต่ละกลุ่มเพื่อรับจำนวนโพสต์ใหม่
      for (const group of groups) {
        const status = readStatusData?.find((s) => s.group_id === group.id);
        const lastReadTime = status?.last_read_at;

        let query = supabase
          .from("posts")
          .select("id", { count: "exact", head: true }) // นับจำนวนอย่างเดียว
          .eq("group_id", group.id)
          .neq("user_id", userId); // ไม่นับโพสต์ที่สร้างโดยผู้ใช้ปัจจุบัน (Self-post)

        // ถ้ายิ่งเคยอ่าน ให้หาโพสต์ที่ใหม่กว่าเวลาที่อ่านล่าสุด
        if (lastReadTime) query = query.gt("created_at", lastReadTime);

        const { count, error } = await query;

        if (error) {
          console.error(`Error fetching post count for ${group.id}:`, error);
          counts[group.id] = 0;
        } else {
          // เงื่อนไขพิเศษ: ถ้าเปิดหน้ากลุ่มนั้นอยู่ หรือเป็นเจ้าของกลุ่ม ไม่ต้องแสดง Badge
          if (pathname === `/groups/${group.id}` || group.owner_id === userId) {
            counts[group.id] = 0;
          } else {
            counts[group.id] = count ?? 0;
          }
        }
      }

      setUnreadCounts(counts);
    };

    fetchUnreadCounts();

    // --- Realtime Listener: ฟัง event โพสต์ใหม่ ---
    const channel: RealtimeChannel = supabase
      .channel("group_unread_counter")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          // ฟังเฉพาะกลุ่มที่ติดตามเท่านั้น
          filter: `group_id=in.(${groups.map((g) => g.id).join(",")})`, 
        },
        (payload) => {
          // Cast payload.new เพื่อให้มี user_id
          const newPost = payload.new as { group_id: string; user_id: string }; 
          const groupId = newPost.group_id;
          const group = groups.find((g) => g.id === groupId);

          // 1. ถ้าโพสต์ถูกสร้างโดยผู้ใช้ปัจจุบัน ให้ข้าม (ไม่บวกแจ้งเตือน)
          if (newPost.user_id === userId) return; 

          // 2. เงื่อนไขที่มีอยู่: ถ้าเปิดหน้านั้นอยู่ หรือเป็นเจ้าของกลุ่ม ไม่ต้องบวกเพิ่ม
          if (
            !group ||
            pathname === `/groups/${groupId}` ||
            group.owner_id === userId
          )
            return;

          // 3. บวกจำนวนแจ้งเตือนเพิ่ม +1
          setUnreadCounts((prev) => ({
            ...prev,
            [groupId]: (prev[groupId] || 0) + 1,
          }));
        }
      )
      .subscribe();

    return () => {
      // Cleanup: ลบ Channel เมื่อ Component ถูกทำลาย
      supabase.removeChannel(channel);
    };
  }, [groups, pathname, userId]); // Dependency: กลุ่ม, Path, และ User ID

  return (
  // --- Container หลัก: แถบนำทางรอง (Fixed Position ใต้ Navbar หลัก) ---
  <nav className="
      fixed top-20 left-0 w-full z-40
      bg-white/80 backdrop-blur-md
      shadow-[0_4px_10px_rgba(0,0,0,0.06)]
      border-b border-slate-200
    "
  >

    {/* ---------------- TOP BAR (ปุ่มนำทางหลัก) ---------------- */}
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 h-16 gap-2">

      {/* Left buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/groups"
          className="
            border border-slate-300 hover:border-sky-500
            px-3 py-1.5 rounded-xl transition-all
            text-xs sm:text-sm text-slate-600 hover:text-sky-600
            hover:shadow-sm active:scale-95
          "
        >
          กลุ่มทั้งหมด
        </Link>

        <Link
          href="/myGroups"
          className="
            border border-slate-300 hover:border-sky-500
            px-3 py-1.5 rounded-xl transition-all
            text-xs sm:text-sm text-slate-600 hover:text-sky-600
            hover:shadow-sm active:scale-95
          "
        >
          กลุ่มของฉัน
        </Link>
      </div>

      {/* Toggle */}
      <div className="flex justify-center">
        <button
          onClick={() => setIsGroupsVisible(!isGroupsVisible)}
          className="
            text-xs sm:text-sm text-slate-600
            hover:text-sky-600 transition-all
            px-3 py-1 rounded-lg
            hover:bg-sky-50 active:scale-95
          "
        >
          {isGroupsVisible ? "ซ่อนกลุ่ม ▲" : "แสดงกลุ่ม ▼"}
        </button>
      </div>

      {/* Create button */}
      <div className="shrink-0">
        <Link
          href="/create"
          className="
            bg-gradient-to-r from-sky-500 to-sky-600
            px-4 py-2 rounded-full text-white
            text-xs sm:text-sm font-medium shadow-sm
            hover:shadow-md hover:scale-105
            active:scale-95 transition-all
          "
        >
          สร้างกลุ่ม
        </Link>
      </div>

    </div>

    {/* --------------- GROUP BAR (แถบแสดงกลุ่มที่ติดตาม) ---------------- */}
    <div
      className={`
        overflow-hidden transition-all duration-500 ease-in-out 
        border-t border-slate-200 bg-white/60 backdrop-blur-sm
        ${isGroupsVisible ? "max-h-24 opacity-100" : "max-h-0 opacity-0"}
      `}
    >
      <div className="flex gap-3 px-6 py-3 overflow-x-auto scrollbar-hide scroll-smooth">

        {groups.length === 0 ? (
          // กรณีไม่มีกลุ่มที่ติดตาม
          <div className="text-xs sm:text-sm text-slate-500 w-full text-center py-2">
            ยังไม่มีกลุ่มที่คุณติดตาม
          </div>
        ) : (
          // วนลูปแสดงกลุ่มที่ติดตาม
          groups.map((group) => {
            const count = unreadCounts[group.id] || 0;
            return (
              <div key={group.id} className="relative shrink-0">
                <Link
                  href={`/groups/${group.id}`}
                  // เมื่อคลิก ให้ทำเครื่องหมายว่าอ่านแล้ว
                  onClick={() => markGroupAsRead(group.id)}
                  className="block"
                >
                  {/* Avatar Bubble */}
                  <div className="
                      w-11 h-11 rounded-2xl overflow-hidden 
                      bg-gradient-to-br from-slate-100 to-slate-200
                      shadow-md border border-white
                      hover:scale-110 transition-transform duration-200
                      flex items-center justify-center
                    "
                  >
                    {group.avatar_url ? (
                      // แสดงรูป Avatar กลุ่ม
                      <Image
                        src={
                          supabase.storage
                            .from("groups")
                            .getPublicUrl(group.avatar_url).data.publicUrl
                        }
                        alt={group.name}
                        width={44}
                        height={44}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      // Placeholder Icon
                      <UsersRound className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                </Link>

                {/* Badge แสดงจำนวนที่ยังไม่อ่าน */}
                {count > 0 && (
                  <span className="
                      absolute top-0 right-0 translate-x-1/2
                      bg-red-600 text-white text-[10px] font-bold
                      w-5 h-5 flex items-center justify-center rounded-full
                      shadow-md
                    "
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  </nav>
);
};