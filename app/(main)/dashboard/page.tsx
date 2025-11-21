"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Heart, MessageSquare } from "lucide-react"; // ลบ LogOut ออก
import DashboardCommentModal from "@/app/components/DashboardCommentModal"; 


// ------------------ Types ------------------

interface FollowedGroup {
  group_id: string;
}

interface OwnedGroup {
  id: string;
}

// Helper function to get group avatar URL from path
const getGroupAvatarUrl = (avatarPath: string | null | undefined) => {
    const defaultUrl = "https://placehold.co/40x40?text=G";
    if (!avatarPath) return defaultUrl;
    if (avatarPath.startsWith("http")) return avatarPath;
    
    const { data } = supabase.storage.from("groups").getPublicUrl(avatarPath);
    return data.publicUrl || defaultUrl;
};

// Interface สำหรับข้อมูลดิบที่ดึงมาจาก Supabase (รวม joins)
interface PostFromSupabase {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  group_id: string;
  media_urls: string[] | null;
  likes: { user_id: string }[] | null;
  comments: { id: string }[] | null;
  groups: { name: string, avatar_url: string | null } | null; 
}

// Interface สำหรับ State ใน Client (ข้อมูลที่คำนวณแล้ว)
interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  group_id: string;
  media_urls: string[] | null;
  likesCount: number;
  commentsCount: number;
  likedByUser: boolean;
  group_name: string;
  group_avatar_url: string; // URL รูปกลุ่ม
}

// ------------------ Component ------------------

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePostIdForComments, setActivePostIdForComments] =
    useState<string | null>(null);

  // --- Helper function to get public URL for post media ---
  const getPublicMediaUrl = (urlOrPath: string) => {
    if (!urlOrPath) return "https://placehold.co/128x128?text=No+Image";
    if (urlOrPath.startsWith("http")) return urlOrPath;

    const { data } = supabase.storage
      .from("post_media")
      .getPublicUrl(urlOrPath);

    return data.publicUrl || "https://placehold.co/128x128?text=No+Image";
  };


  // ------------------ Fetch User (Authentication) ------------------
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user as SupabaseUser);
    };

    getUser();
  }, [router]);


  // ------------------ Fetch Posts (Data Retrieval) ------------------
  useEffect(() => {
    if (!user) return;

    const fetchPosts = async () => {
      try {
        // 1. ดึง ID กลุ่มที่ User ติดตามและเป็นเจ้าของ
        const { data: followedGroups } = await supabase.from("group_members").select("group_id").eq("user_id", user.id) as { data: FollowedGroup[] | null };
        const { data: ownedGroups } = await supabase.from("groups").select("id").eq("owner_id", user.id) as { data: OwnedGroup[] | null };
        const allGroupIds = [ ...new Set([ ...(followedGroups?.map((g) => g.group_id) || []), ...(ownedGroups?.map((g) => g.id) || []), ]), ];

        if (allGroupIds.length === 0) { setPosts([]); setLoading(false); return; }

        // 3. ดึง Posts ทั้งหมดจากกลุ่มที่เกี่ยวข้อง
        const { data: postsData } = await supabase
          .from("posts")
          .select(
            `id, content, created_at, user_id, group_id, media_urls,
             likes(user_id), comments(id), groups(name, avatar_url)` 
          )
          .in("group_id", allGroupIds) 
          .order("created_at", { ascending: false }) as { data: PostFromSupabase[] | null };

        // 4. Map และคำนวณ State (Like/Comment Count)
        const formattedPosts: Post[] =
          postsData?.map((post) => ({
            id: post.id,
            content: post.content,
            created_at: post.created_at,
            user_id: post.user_id,
            group_id: post.group_id,
            media_urls: post.media_urls,
            likesCount: post.likes?.length || 0,
            commentsCount: post.comments?.length || 0,
            likedByUser:
              post.likes?.some((like) => like.user_id === user.id) || false,
            group_name: post.groups?.name || "กลุ่มไม่ทราบชื่อ",
            group_avatar_url: getGroupAvatarUrl(post.groups?.avatar_url), // Added
          })) || [];

        setPosts(formattedPosts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user]);

  // ------------------ Handlers ------------------

  // 1. Like Toggle (Optimistic Update)
  const handleLikeToggle = async (postId: string, likedByUser: boolean) => {
    if (!user) return;

    // Optimistic Update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likedByUser: !likedByUser,
              likesCount: likedByUser ? p.likesCount - 1 : p.likesCount + 1,
            }
          : p
      )
    );

    try {
      if (likedByUser) {
        await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
      } else {
        await supabase.from("likes").insert([
          { post_id: postId, user_id: user.id },
        ]);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      // Revert the optimistic update (คืนค่า UI ถ้า DB Fail)
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likedByUser: likedByUser,
                likesCount: likedByUser ? p.likesCount + 1 : p.likesCount - 1,
              }
            : p
        )
      );
    }
  };

  // 2. Update Comment Count (for Modal Callback)
  const updateCommentCount = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, commentsCount: p.commentsCount + 1 }
          : p
      )
    );
  };

  // 3. Logout (Handler Removed)


  // ------------------ Render ------------------

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-sky-600" />
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-20 space-y-6">
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl p-8 shadow-lg mb-8">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            📰 Dashboard
          </h1>
          <p className="text-sky-100 mt-2 text-sm">
            ติดตามโพสต์และกิจกรรมจากกลุ่มที่คุณสนใจ
          </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <h2 className="text-gray-900 font-semibold">ยังไม่มีโพสต์</h2>
          <p className="text-gray-500 mt-1">
            โพสต์จากกลุ่มที่คุณติดตามจะแสดงที่นี่
          </p>

        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                {/* แสดง Avatar และ Name ของกลุ่ม */}
                <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-100 shrink-0">
                        <Image src={post.group_avatar_url} alt="Group Avatar" fill className="object-cover" unoptimized />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">
                            โพสต์ในกลุ่ม: {post.group_name}
                        </p>
                        <p className="text-xs text-gray-400">
                            {new Date(post.created_at).toLocaleDateString("th-TH", {
                              year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
                            })}
                        </p>
                    </div>
                </div>
              </div>

              {/* Content */}
              <p className="mt-2 text-gray-700 whitespace-pre-wrap">
                {post.content}
              </p>

              {/* Media Display */}
              {post.media_urls?.length ? (
                <div className="flex flex-wrap gap-2 mt-3">
                  {post.media_urls.map((url, idx) => {
                    const publicUrl = getPublicMediaUrl(url);
                    const isVideo =
                      publicUrl.endsWith(".mp4") ||
                      publicUrl.endsWith(".webm");

                    return (
                      <div
                        key={idx}
                        className="relative w-32 h-32 rounded-lg overflow-hidden border bg-gray-100"
                      >
                        {isVideo ? (
                          <video
                            src={publicUrl}
                            controls
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Image
                            src={publicUrl}
                            alt={`Post media ${idx}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Actions */}
              <div className="flex gap-4 text-gray-500 text-sm pt-3 mt-4 border-t border-gray-100">
                {/* Like Button */}
                <button
                  onClick={() =>
                    handleLikeToggle(post.id, post.likedByUser)
                  }
                  className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                    post.likedByUser ? "text-red-500" : "hover:text-red-400"
                  }`}
                >
                  <Heart className="w-4 h-4 fill-current" />{" "}
                  {post.likesCount} Likes
                </button>

                {/* Comment Button (Modal Trigger) */}
                <button
                  onClick={() => setActivePostIdForComments(post.id)}
                  className="flex items-center gap-1.5 hover:text-sky-600 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />{" "}
                  {post.commentsCount} Comments
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment Modal */}
      {activePostIdForComments && user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <DashboardCommentModal
            postId={activePostIdForComments}
            userId={user.id}
            onClose={() => setActivePostIdForComments(null)}
            updateCount={updateCommentCount}
          />
        </div>
      )}
    </div>
  );
}
