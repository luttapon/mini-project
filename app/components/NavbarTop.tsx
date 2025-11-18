"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { User as UserIcon } from "lucide-react";

// -------------------------------
// Types
// -------------------------------
interface Group {
  id: string;
  name: string;
}

// -------------------------------
// Component
// -------------------------------
export const NavbarTop = () => {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [groupResults, setGroupResults] = useState<Group[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // -------------------------------
  // Load avatar
  // -------------------------------
  useEffect(() => {
    const fetchAvatar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const { data: profile } = await supabase
        .from("user")
        .select("avatar_url")
        .eq("id", userId)
        .single();

      if (profile?.avatar_url) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(profile.avatar_url);
        setAvatar(data.publicUrl);
      }
    };

    fetchAvatar();
  }, []);

  // -------------------------------
  // Handle click outside search
  // -------------------------------
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setGroupResults([]);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // -------------------------------
  // Search groups
  // -------------------------------
  useEffect(() => {
    const fetchGroups = async () => {
      if (!searchTerm.trim()) {
        setGroupResults([]);
        return;
      }

      const { data } = await supabase
        .from("groups")
        .select("id, name")
        .ilike("name", `%${searchTerm}%`)
        .limit(5);

      setGroupResults((data as Group[]) || []);
    };

    fetchGroups();
  }, [searchTerm]);

  // -------------------------------
  // Render
  // -------------------------------
  return (
    <nav className="flex justify-between items-center bg-gray-900 px-4 sm:px-8 py-2 gap-4 fixed top-0 left-0 w-full z-50 h-20 shadow-lg">
      {/* LEFT: Logo */}
      <div className="flex-1 flex items-center">
        <Link
          href="/dashboard"
          className="text-2xl font-bold text-blue-500 hover:text-white sm:flex hidden"
        >
          Our Zone
        </Link>
        <Link
          href="/dashboard"
          className="sm:hidden flex items-center text-blue-400"
          aria-label="Home"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              d="M3 9.75L12 3l9 6.75V21H3V9.75z"
            />
          </svg>
        </Link>
      </div>

      {/* CENTER: SEARCH */}
      <div ref={searchRef} className="flex-1 flex justify-center relative">
        <input
          type="text"
          placeholder="ค้นหากลุ่ม..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 rounded-full bg-white w-full max-w-md shadow-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 outline-none"
        />
        {groupResults.length > 0 && (
          <ul className="absolute top-full left-0 mt-2 w-full bg-white border rounded-xl shadow-xl z-50">
            {groupResults.map((g) => (
              <li key={g.id} className="hover:bg-gray-100 rounded-lg">
                <Link
                  href={`/groups/${g.id}`}
                  className="block px-4 py-2"
                  onClick={() => {
                    setGroupResults([]);
                    setSearchTerm("");
                  }}
                >
                  {g.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* RIGHT: Avatar */}
      <div className="flex-1 flex justify-end items-center gap-5">
        <Link href="/profile">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-yellow-400 bg-gray-100 flex items-center justify-center">
            {avatar ? (
              <Image
                src={avatar}
                alt="avatar"
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            ) : (
              <UserIcon className="w-6 h-6 text-gray-400" />
            )}
          </div>
        </Link>
      </div>
    </nav>
  );
};
