"use client";

import Image from "next/image";
import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Edit3,
  LogOut,
  User as UserIcon,
  Heart,
  MessageSquare,
} from "lucide-react";
import ProfileCommentModal from "@/app/components/ProfileCommentModal";

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  cover_url: string | null;
}

interface PostWithJoins {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  group_id: string;
  media_urls: string[] | null;
  likes: { user_id: string }[] | null;
  comments: { id: string }[] | null;
}

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
}

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [usernameEdit, setUsernameEdit] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarPublicUrl, setAvatarPublicUrl] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverPublicUrl, setCoverPublicUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activePostIdForComments, setActivePostIdForComments] = useState<
    string | null
  >(null);
  const [groupsMap, setGroupsMap] = useState<
    Record<string, { id: string; name: string }>
  >({});
  // State สำหรับ modal แสดงรูปภาพขยาย
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState("");

  // --- ฟังก์ชันสำหรับเปิด modal แสดงรูปภาพขยาย ---
  const handleImageClick = (imageUrl: string) => {
    setModalImageUrl(imageUrl);
    setShowImageModal(true);
  };

  // --- Helper to get public URL ---
  const getPublicMediaUrl = (urlOrPath: string) => {
    if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://"))
      return urlOrPath;
    const { data } = supabase.storage
      .from("post_media")
      .getPublicUrl(urlOrPath);
    return data.publicUrl || "https://placehold.co/128x128?text=No+Image";
  };

  // --- Fetch profile ---
  const fetchProfile = async (authUser: SupabaseUser) => {
    const { data, error } = await supabase
      .from("user")
      .select("id, username, avatar_url, cover_url")
      .eq("id", authUser.id)
      .single<Profile>();

    if (error || !data) {
      setMessage({ text: "ไม่สามารถโหลดโปรไฟล์ได้", type: "error" });
      return;
    }

    setProfile(data);
    setUsernameEdit(data.username || "");
    if (data.avatar_url)
      setAvatarPublicUrl(
        supabase.storage.from("avatars").getPublicUrl(data.avatar_url).data
          .publicUrl
      );
    if (data.cover_url)
      setCoverPublicUrl(
        supabase.storage.from("avatars").getPublicUrl(data.cover_url).data
          .publicUrl
      );
  };

  // --- Fetch posts ---
  const fetchPosts = async (userId: string) => {
    const { data, error } = await supabase
      .from("posts")
      .select(
        "id, content, created_at, user_id, group_id, media_urls, likes(user_id), comments(id)"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const rawPosts = data as PostWithJoins[];

      // fetch group names
      const groupIds = Array.from(new Set(rawPosts.map((p) => p.group_id)));
      const { data: groupData } = await supabase
        .from("groups")
        .select("id, name")
        .in("id", groupIds);
      const map: Record<string, { id: string; name: string }> = {};
      groupData?.forEach((g) => (map[g.id] = { id: g.id, name: g.name }));
      setGroupsMap(map);

      const formattedPosts: Post[] = rawPosts.map((post) => ({
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        user_id: post.user_id,
        group_id: post.group_id,
        media_urls: post.media_urls,
        likesCount: post.likes?.length || 0,
        commentsCount: post.comments?.length || 0,
        likedByUser:
          post.likes?.some((like) => like.user_id === userId) || false,
      }));
      setPosts(formattedPosts);
    }
  };

  const handleProfileLikeToggle = async (postId: string, isLiked: boolean) => {
    if (!user) return;
    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p.id === postId
          ? {
              ...p,
              likedByUser: !isLiked,
              likesCount: isLiked ? p.likesCount - 1 : p.likesCount + 1,
            }
          : p
      )
    );

    try {
      if (isLiked)
        await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
      else
        await supabase
          .from("likes")
          .insert([{ post_id: postId, user_id: user.id }]);
    } catch {
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? {
                ...p,
                likedByUser: isLiked,
                likesCount: isLiked ? p.likesCount + 1 : p.likesCount - 1,
              }
            : p
        )
      );
    }
  };

  const updateCommentCount = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
      )
    );
  };

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchProfile(user);
        await fetchPosts(user.id);
      } else router.push("/login");
      setLoading(false);
    };
    checkUser();
  }, [router]);

  const handleAvatarFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setAvatarFile(e.target.files[0]);
      setAvatarPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleCoverFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setCoverFile(e.target.files[0]);
      setCoverPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setCoverFile(null);
    setCoverPreview(null);
    if (profile) setUsernameEdit(profile.username || "");
    setMessage(null);
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleUpdateProfile = async (e: FormEvent) => {
  e.preventDefault();
  if (!user || !profile) return;
  setSaving(true);

  let newAvatarPath = profile.avatar_url;
  let newCoverPath = profile.cover_url;

  try {
    // --- Avatar ---
    if (avatarFile) {
      // ลบไฟล์เก่าถ้ามี
      if (profile.avatar_url) {
        await supabase.storage.from("avatars").remove([profile.avatar_url]);
      }
      // อัปโหลดไฟล์ใหม่
      const ext = avatarFile.name.split(".").pop();
      const path = `${user.id}/profile/avatar-${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile);
      if (error) throw error;
      newAvatarPath = data.path;

      // อัปเดต public url ใหม่ทันที
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(newAvatarPath);
      setAvatarPublicUrl(urlData.publicUrl);
      setAvatarPreview(null);
    }

    // --- Cover ---
    if (coverFile) {
      if (profile.cover_url) {
        await supabase.storage.from("avatars").remove([profile.cover_url]);
      }
      const ext = coverFile.name.split(".").pop();
      const path = `${user.id}/cover/cover-${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(path, coverFile);
      if (error) throw error;
      newCoverPath = data.path;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(newCoverPath);
      setCoverPublicUrl(urlData.publicUrl);
      setCoverPreview(null);
    }

    // --- อัปเดตโปรไฟล์ใน DB ---
    const { error } = await supabase
      .from("user")
      .update({
        username: usernameEdit,
        avatar_url: newAvatarPath,
        cover_url: newCoverPath,
      })
      .eq("id", user.id);

    if (error) throw error;

    // รีเฟรชข้อมูล
    await fetchProfile(user);
    await fetchPosts(user.id);

    setIsEditing(false);
    setMessage({ text: "บันทึกโปรไฟล์สำเร็จ", type: "success" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
    setMessage({ text: msg, type: "error" });
  } finally {
    setSaving(false);
  }
};


  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-sky-600" />
        <p className="text-sm text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
      </div>
    );

  if (!profile || !user)
    return <div className="text-center mt-20 text-gray-500">ไม่พบผู้ใช้</div>;

  const displayAvatarUrl = avatarPreview || avatarPublicUrl;

  const displayCoverUrl = coverPreview || coverPublicUrl || "/cover.jpg"; // fallback image สำหรับปก

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Modal สำหรับแสดงรูปภาพขยาย */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <Image
              src={modalImageUrl}
              alt="Preview"
              width={1200}
              height={800}
              className="object-contain max-w-full max-h-full"
              unoptimized
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto">
          {/* รูปหน้าปก - คลิกเพื่อดูรูปขยาย */}
          <div 
            className={`relative h-48 md:h-72 w-full bg-gray-200 overflow-hidden group ${
              displayCoverUrl !== "/cover.jpg" ? "cursor-pointer" : ""
            }`}
            onClick={() => displayCoverUrl !== "/cover.jpg" && handleImageClick(displayCoverUrl)}
          >
            <Image
              src={displayCoverUrl}
              alt="Cover"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-50" />
            {/* แสดงข้อความเมื่อ hover (เฉพาะเมื่อมีรูปจริง) */}
            {displayCoverUrl !== "/cover.jpg" && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-black/50 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  คลิกเพื่อดูรูป
                </span>
              </div>
            )}
          </div>

          <div className="px-6 pb-6">
            <div className="relative flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-20 gap-6">
              {/* รูปโปรไฟล์ - คลิกเพื่อดูรูปขยาย */}
              <div className="relative z-10">
                <div 
                  className={`w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden p-1 ${
                    displayAvatarUrl ? "cursor-pointer group" : ""
                  }`}
                  onClick={() => displayAvatarUrl && handleImageClick(displayAvatarUrl)}
                >
                  {displayAvatarUrl ? (
                    <Image
                      src={displayAvatarUrl}
                      alt="Avatar"
                      fill
                      className="object-cover rounded-full group-hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                      <UserIcon className="w-16 h-16 md:w-20 md:h-20 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 text-center md:text-left mt-2 md:mt-0 md:mb-4 space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                  {profile.username || "Unnamed User"}
                </h1>
                <p className="text-gray-500 font-medium text-sm md:text-base flex items-center justify-center md:justify-start gap-1.5">
                  <UserIcon className="w-4 h-4" /> {user.email}
                </p>
              </div>

              <div className="flex gap-3 mb-2 md:mb-4">
                {!isEditing && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white rounded-full font-medium hover:bg-sky-700 active:scale-95 transition-all shadow-md shadow-sky-100 cursor-pointer hover:scale-105"
                    >
                      <Edit3 className="w-4 h-4" /> แก้ไขโปรไฟล์
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-95 hover:scale-105 transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> ออกจากระบบ
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 bg-white rounded-2xl shadow-md border border-gray-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h3 className="text-xl font-bold mb-6 text-gray-900">แก้ไขโปรไฟล์</h3>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Preview avatar"
                    width={100}
                    height={100}
                    className="rounded-full border-2 border-gray-300 shadow-sm object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center text-gray-400">
                    รูปโปรไฟล์
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  แก้ไขรูปโปรไฟล์
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0 file:text-sm file:font-semibold
                       file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200"
                />
              </div>
            </div>

            {/* Cover */}
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                {coverPreview ? (
                  <Image
                    src={coverPreview}
                    alt="Preview cover"
                    width={200}
                    height={80}
                    className="rounded-lg border-2 border-gray-300 shadow-sm object-cover"
                  />
                ) : (
                  <div className="w-48 h-20 rounded-lg bg-gray-100 border-2 border-gray-300 flex items-center justify-center text-gray-400">
                    รูปหน้าปก
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  แก้ไขรูปหน้าปก
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0 file:text-sm file:font-semibold
                       file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อผู้ใช้
              </label>
              <input
                type="text"
                value={usernameEdit}
                onChange={(e) => setUsernameEdit(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-sky-600 text-white px-5 py-3 rounded-lg hover:bg-sky-700 disabled:bg-sky-300 font-medium shadow-md transition cursor-pointer active:scale-95"
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 bg-gray-200 text-gray-700 px-5 py-3 rounded-lg hover:bg-gray-300 font-medium transition cursor-pointer active:scale-95"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Posts */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">โพสต์ของคุณ</h2>
          <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
            ทั้งหมด {posts.length} โพสต์
          </span>
        </div>

        <div className="grid gap-4">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-center">
              <h3 className="text-gray-900 font-semibold">ยังไม่มีโพสต์</h3>
              <p className="text-gray-500 text-sm mt-1">
                เรื่องราวของคุณจะปรากฏที่นี่เมื่อคุณเริ่มโพสต์
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-sky-100 transition-all duration-200"
              >
                <div className="flex gap-4">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
                    {displayAvatarUrl ? (
                      <Image
                        src={displayAvatarUrl}
                        alt="User"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          {profile.username}
                        </p>
                        {groupsMap[post.group_id] && (
                          <p className="text-xs text-gray-400">
                            กลุ่ม: {groupsMap[post.group_id].name}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 font-medium">
                          {new Date(post.created_at).toLocaleDateString(
                            "th-TH",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-base">
                      {post.content}
                    </p>

                    {post.media_urls && post.media_urls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {post.media_urls.map((mediaUrl, index) => {
                          const publicUrl = getPublicMediaUrl(mediaUrl);
                          const isVideo =
                            publicUrl.endsWith(".mp4") ||
                            publicUrl.endsWith(".webm") ||
                            publicUrl.endsWith(".ogg");
                          return (
                            <div
                              key={index}
                              className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
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
                                  alt={`Post media ${index + 1}`}
                                  fill
                                  sizes="128px"
                                  className="object-cover"
                                  unoptimized
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex justify-start gap-4 text-gray-500 text-sm pt-3 border-t border-gray-100">
                      <button
                        onClick={() =>
                          handleProfileLikeToggle(post.id, post.likedByUser)
                        }
                        className={`flex items-center gap-1.5 ${
                          post.likedByUser
                            ? "text-red-500"
                            : "hover:text-gray-900"
                        }`}
                      >
                        <Heart className="w-4 h-4" /> {post.likesCount}
                      </button>
                      <button
                        onClick={() => setActivePostIdForComments(post.id)}
                        className="flex items-center gap-1.5 hover:text-gray-900"
                      >
                        <MessageSquare className="w-4 h-4" />{" "}
                        {post.commentsCount}
                      </button>
                    </div>

                    {activePostIdForComments === post.id && (
                      <ProfileCommentModal
                        postId={post.id}
                        userId={user.id}
                        onClose={() => setActivePostIdForComments(null)}
                        updateCount={updateCommentCount}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
