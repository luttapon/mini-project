"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useFollowedGroups } from "@/lib/context/FollowedGroupsContext";
import { usePathname } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";

// -------------------------------
// Types
// -------------------------------
interface Group {
  id: string;
  name: string;
  avatar_url: string | null;
  owner_id: string;
}
interface UserGroupReadStatus {
  group_id: string;
  last_read_at: string; // timestampz
}

// -------------------------------
// Component
// -------------------------------
export const NavbarSub = () => {
  const { groups } = useFollowedGroups();
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const pathname = usePathname();

  // ดึง userId ของ session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  const markGroupAsRead = async (groupId: string) => {
    if (!userId) return;

    await supabase.from("user_group_read_status").upsert(
      [
        {
          user_id: userId,
          group_id: groupId,
          last_read_at: new Date().toISOString(),
        },
      ],
      { onConflict: "user_id,group_id" }
    );

    setUnreadCounts((prev) => ({
      ...prev,
      [groupId]: 0,
    }));
  };

  useEffect(() => {
    if (groups.length === 0 || !userId) return;

    const fetchUnreadCounts = async () => {
      const { data: readStatusData } = (await supabase
        .from("user_group_read_status")
        .select("group_id, last_read_at")
        .in(
          "group_id",
          groups.map((g) => g.id)
        )
        .eq("user_id", userId)) as { data: UserGroupReadStatus[] | null };

      const counts: Record<string, number> = {};

      for (const group of groups) {
        const status = readStatusData?.find((s) => s.group_id === group.id);
        const lastReadTime = status?.last_read_at;

        let query = supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("group_id", group.id);

        if (lastReadTime) query = query.gt("created_at", lastReadTime);

        const { count, error } = await query;

        if (error) {
          console.error(`Error fetching post count for ${group.id}:`, error);
          counts[group.id] = 0;
        } else {
          // ถ้า path ปัจจุบันคือหน้ากลุ่มนั้น หรือเป็นเจ้าของกลุ่ม ให้เป็น 0
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

    // -------------------------------
    // Realtime listener
    const channel: RealtimeChannel = supabase
      .channel("group_unread_counter")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          filter: `group_id=in.(${groups.map((g) => g.id).join(",")})`,
        },
        (payload) => {
          const groupId = (payload.new as { group_id: string }).group_id;
          const group = groups.find((g) => g.id === groupId);

          // ถ้าเราอยู่หน้ากลุ่มนั้น หรือเป็นเจ้าของกลุ่ม ไม่เพิ่ม badge
          if (
            !group ||
            pathname === `/groups/${groupId}` ||
            group.owner_id === userId
          )
            return;

          setUnreadCounts((prev) => ({
            ...prev,
            [groupId]: (prev[groupId] || 0) + 1,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groups, pathname, userId]);

  return (
    <nav className="flex items-center justify-between px-6 py-3 h-16 fixed top-20 left-0 w-full shadow-md z-40 bg-white">
      {/* ซ้าย: Links */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/groups"
          className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-sky-600 transition-colors whitespace-nowrap"
        >
          กลุ่มทั้งหมด
        </Link>
        <Link
          href="/myGroups"
          className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-sky-600 transition-colors whitespace-nowrap"
        >
          กลุ่มของฉัน
        </Link>
      </div>

      {/* กลาง: Avatar scroll */}
      <div className="flex-1 flex gap-2 px-4 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth">
        {groups.map((group) => {
          const count = unreadCounts[group.id] || 0;
          return (
            <div key={group.id} className="relative shrink-0">
              <Link
                href={`/groups/${group.id}`}
                className="relative"
                title={group.name}
                onClick={() => markGroupAsRead(group.id)}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 shadow-md hover:scale-105 transition-transform ">
                  <Image
                    src={
                      group.avatar_url
                        ? supabase.storage
                            .from("groups")
                            .getPublicUrl(group.avatar_url).data.publicUrl
                        : "/default-group.png"
                    }
                    alt={group.name}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                </div>
              </Link>

              {/* BADGE DISPLAY */}
              {count > 0 && (
                <span className="absolute top-0 right-0 translate-x-1/2 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full z-10 pointer-events-none">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ขวา: Create button */}
      <div className="shrink-0">
        <Link
          href="/create"
          className="flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-sky-700 hover:scale-105 shadow-md"
        >
          สร้างกลุ่ม
        </Link>
      </div>
    </nav>
  );
};
