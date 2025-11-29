"use client";

import Image from "next/image";
import type { PostWithUser, CommentWithUser } from "@/types/supabase";
import { supabase } from "@/lib/supabase/client";
import { useState, useRef, useEffect, ChangeEvent } from "react";
import { Heart, MessageSquare, UsersRound } from "lucide-react";

// --- Component ย่อย: Modal แสดงรูปภาพ/วิดีโอขนาดใหญ่ ---
const MediaModal = ({
  mediaUrl,
  onClose,
}: {
  mediaUrl: string;
  onClose: () => void;
}) => {
  if (!mediaUrl) return null;

  // ตรวจสอบว่าเป็นวิดีโอหรือไม่ (สมมติว่าเป็น .mp4)
  const isVideo = mediaUrl.endsWith(".mp4");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()} // ป้องกันการปิด Modal เมื่อคลิกที่เนื้อหา
      >
        {isVideo ? (
          // แสดงวิดีโอ
          <video
            src={mediaUrl}
            controls
            className="max-w-full max-h-screen"
            autoPlay
          />
        ) : (
          // แสดงรูปภาพ
          <div className="relative w-full h-full max-h-screen">
            <Image
              src={mediaUrl}
              alt="Full size media"
              className="max-w-full max-h-[80vh] md:max-h-[90vh] object-contain"
              fill
            />
          </div>
        )}
      </div>
      {/* ปุ่มปิดมุมขวาบน */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 text-white text-3xl font-bold p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition z-50"
        aria-label="ปิด"
      >
        &times;
      </button>
    </div>
  );
};

// --- กำหนด Props ของ Component ---
interface PostCardProps {
  // ข้อมูลโพสต์ (รวม media_urls, likes_count, comments_count)
  post: PostWithUser & {
    media_urls: string[];
    likes_count?: number;
    comments_count?: number;
    liked_by_user?: boolean;
    comments?: CommentWithUser[];
  };
  groupName: string;
  groupAvatar?: string | null;
  userId?: string | null; // ID ผู้ใช้งานปัจจุบัน
  onPostDeleted?: (postId: string) => void;
  onPostUpdated?: (updatedPost: PostWithUser) => void;
  groupOwnerId: string; // ID เจ้าของกลุ่ม (ใช้ตรวจสอบสิทธิ์การแสดงผลชื่อ/รูปในคอมเมนต์)
}

const COMMENTS_LIMIT = 3; // จำนวนคอมเมนต์ที่แสดงเริ่มต้น
const MEDIA_LIMIT = 5; // จำนวนรูปภาพที่แสดงเริ่มต้น

export default function PostCard({
  post,
  groupName,
  groupAvatar,
  userId,
  onPostDeleted,
  onPostUpdated,
  groupOwnerId,
}: PostCardProps) {
  // --- State: การแสดงผลและการโต้ตอบพื้นฐาน ---
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null); // URL ของสื่อที่ถูกคลิกเพื่อเปิด Modal

  // ใช้ Nullish Coalescing Operator (??) สำหรับ Likes Count
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0); 

  const [likedByUser, setLikedByUser] = useState(post.liked_by_user || false); // สถานะ Like โดยผู้ใช้ปัจจุบัน
  const [comments, setComments] = useState<CommentWithUser[]>(
    post.comments || [] // รายการคอมเมนต์ที่แสดง
  );
  const [newComment, setNewComment] = useState(""); // ข้อความคอมเมนต์ใหม่ที่กำลังพิมพ์
  const [showAllComments, setShowAllComments] = useState(false); // แสดงคอมเมนต์ทั้งหมดหรือไม่
  const [showAllMedia, setShowAllMedia] = useState(false); // แสดงสื่อทั้งหมดหรือไม่

  // --- State: เมนูและการแก้ไข ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null); // Ref สำหรับปิดเมนูเมื่อคลิกนอกพื้นที่
  const [isEditing, setIsEditing] = useState(false); // โหมดแก้ไข
  const [editedContent, setEditedContent] = useState(post.content || ""); // เนื้อหาที่ถูกแก้ไข
  const [isSaving, setIsSaving] = useState(false); // สถานะกำลังบันทึกการแก้ไข

  // --- State: จัดการไฟล์มีเดียในโหมดแก้ไข ---
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // ไฟล์ใหม่ที่เลือก
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // Preview ไฟล์ใหม่
  const [existingMediaPaths, setExistingMediaPaths] = useState<string[]>([]); // Path ไฟล์เดิมที่ยังเหลืออยู่
  const [existingMediaToDelete, setExistingMediaToDelete] = useState<string[]>( // Path ไฟล์เดิมที่ต้องการลบ
    []
  );

  // --- Effect: ปิดเมนูเมื่อคลิกพื้นที่ภายนอก ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  // --- Helper: จัดการ URL ของรูปภาพ/Avatar ---
  const getAvatarPublicUrl = (path: string | null | undefined) => {
    if (!path) return "https://via.placeholder.com/24";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl || "https://via.placeholder.com/24";
  };

  const getPublicMediaUrl = (urlOrPath: string) => {
    if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://"))
      return urlOrPath;
    const { data } = supabase.storage
      .from("post_media")
      .getPublicUrl(urlOrPath);
    return data.publicUrl || "https://via.placeholder.com/128";
  };

  // 🟢 ตรรกะการสลับโปรไฟล์สำหรับ POST HEADER: 
  // ถ้าโพสต์มาจากเจ้าของกลุ่ม ให้แสดงชื่อและรูปกลุ่มแทน
  const isPostByOwner = post.user_id === groupOwnerId;
  const postUserAvatarUrl = getAvatarPublicUrl(post.user?.avatar_url);
  const postUsername = post.user?.username || "ผู้ใช้ไม่ทราบชื่อ";

  const headerAvatarUrl = isPostByOwner ? groupAvatar : postUserAvatarUrl;
  const headerUsername = isPostByOwner ? groupName : postUsername;

  // เตรียมข้อมูล Media สำหรับแสดงผล
  const mediaUrls = post.media_urls.map(getPublicMediaUrl);
  // เลือก Media ที่จะแสดงตามสถานะ showAllMedia
  const mediaToShow = showAllMedia
    ? mediaUrls
    : mediaUrls.slice(0, MEDIA_LIMIT);
  const remainingMediaCount = mediaUrls.length - MEDIA_LIMIT;

  // --- Handlers: จัดการ Modal รูปภาพ ---
  const handleMediaClick = (url: string) => setSelectedMediaUrl(url);
  const handleCloseModal = () => setSelectedMediaUrl(null);
  const handleToggleMedia = () => setShowAllMedia((prev) => !prev);

  // --- Logic: การกดไลก์ (Like) ---
  const handleLikeToggle = async () => {
    if (!userId) return; // ต้องล็อกอินก่อน

    // Optimistic UI Update (อัปเดต UI ก่อนเรียก API)
    setLikedByUser((prev) => !prev);
    setLikesCount((prev) => (likedByUser ? prev - 1 : prev + 1));

    try {
      if (likedByUser) {
        // Un-Like
        await supabase
          .from("likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", userId);
      } else {
        // Like
        await supabase
          .from("likes")
          .insert([{ post_id: post.id, user_id: userId }]);
      }
    } catch (err) {
      console.error("Error toggling like:", (err as Error).message);
      // Rollback UI (ถ้าเกิด Error)
      setLikedByUser((prev) => !prev);
      setLikesCount((prev) => (likedByUser ? prev + 1 : prev - 1));
    }
  };

  // --- Logic: การเพิ่มคอมเมนต์ ---
  const handleAddComment = async () => {
    if (!userId || !newComment.trim()) return;
    try {
      // 1. บันทึกคอมเมนต์ (ดึง id กลับมา)
      const { data: insertedData, error: insertError } = await supabase
        .from("comments")
        .insert([
          { post_id: post.id, user_id: userId, content: newComment.trim() },
        ])
        .select("id")
        .single();

      if (insertError || !insertedData)
        throw insertError || new Error("Insert empty");

      // 2. ดึงข้อมูลคอมเมนต์พร้อมข้อมูลผู้ใช้ (Join)
      const { data: commentWithUser, error: fetchError } = await supabase
        .from("comments")
        .select("*, user:user_id(id, username, avatar_url)")
        .eq("id", insertedData.id)
        .single<CommentWithUser>(); // กำหนด Type ให้ชัดเจน

      if (fetchError || !commentWithUser) throw fetchError;

      // 3. อัปเดต State และเคลียร์ช่อง
      setComments((prev) => [...prev, commentWithUser]);
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", (err as Error).message);
      alert("เพิ่มคอมเมนต์ไม่สำเร็จ");
    }
  };
  const handleToggleComments = () => setShowAllComments((prev) => !prev); // สลับแสดงคอมเมนต์ทั้งหมด

  // --- Logic: เริ่มการแก้ไขโพสต์ (Edit Mode) ---
  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(post.content || "");
    setIsMenuOpen(false); // ปิดเมนู

    // แปลง Full URL กลับเป็น Path เพื่อใช้จัดการไฟล์ (Path: post_media/posts/ชื่อไฟล์)
    const currentPaths = post.media_urls
      .map((urlOrPath) => {
        // ถ้าเป็น Full URL (จาก getPublicUrl)
        if (
          urlOrPath.startsWith("http://") ||
          urlOrPath.startsWith("https://")
        ) {
          try {
            const url = new URL(urlOrPath);
            const pathSegment = `/post_media/`;
            // ดึงเฉพาะส่วน Path หลังชื่อ Bucket
            const path = url.pathname.split(pathSegment)[1]; 
            return path;
          } catch (e) {
            return urlOrPath;
          }
        }
        // ถ้าเป็น Path อยู่แล้ว
        return urlOrPath;
      })
      .filter(Boolean) as string[]; // กรองค่าว่าง

    setExistingMediaPaths(currentPaths);
    setSelectedFiles([]);
    setImagePreviews([]);
    setExistingMediaToDelete([]);
  };

  // --- Logic: ยกเลิกการแก้ไข ---
  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedFiles([]);
    imagePreviews.forEach(URL.revokeObjectURL);
    setImagePreviews([]);
    setExistingMediaPaths([]);
    setExistingMediaToDelete([]);
  };

  // --- Logic: จัดการไฟล์ในโหมดแก้ไข ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);

      const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveNewFile = (indexToRemove: number) => {
    // ยกเลิก Object URL ของ Preview
    URL.revokeObjectURL(imagePreviews[indexToRemove]);
    // กรองไฟล์ใหม่ที่เพิ่งเลือกออก
    setSelectedFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
    setImagePreviews((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleRemoveExistingMedia = (pathToRemove: string) => {
    // ลบ Path ออกจากรายการที่แสดง (ExistingMediaPaths)
    setExistingMediaPaths((prev) =>
      prev.filter((path) => path !== pathToRemove)
    );
    // เพิ่ม Path เข้าไปในรายการที่ต้องลบออกจาก Storage เมื่อบันทึก
    setExistingMediaToDelete((prev) => [...prev, pathToRemove]);
  };

  // --- Logic: บันทึกการแก้ไข (Save Edit) ---
  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      let finalMediaUrls: string[] = [...existingMediaPaths]; // Path ที่เหลืออยู่

      // 1. ลบไฟล์เก่าออกจาก Storage (ที่ถูกทำเครื่องหมายให้ลบ)
      if (existingMediaToDelete.length > 0) {
        await supabase.storage.from("post_media").remove(existingMediaToDelete);
      }

      // 2. อัปโหลดไฟล์ใหม่
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(async (file) => {
          const fileExt = file.name.split(".").pop();
          const uniqueName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `posts/${uniqueName}`;

          const { error } = await supabase.storage
            .from("post_media")
            .upload(filePath, file); // อัปโหลด
          if (error) throw error;
          return filePath; // คืนค่า Path ที่ใช้บันทึก
        });

        const newUploadedPaths = await Promise.all(uploadPromises);
        finalMediaUrls = [...finalMediaUrls, ...newUploadedPaths]; // รวม Path ใหม่
      }

      // 3. อัปเดตข้อมูลใน Database
      const { data, error } = await supabase
        .from("posts")
        .update({
          content: editedContent.trim(),
          media_urls: finalMediaUrls,
        })
        .eq("id", post.id)
        // ดึงข้อมูลใหม่พร้อม Join Likes/Comments เพื่ออัปเดต UI หน้าหลัก
        .select(
          "*, user:user_id(id, username, avatar_url, created_at), likes(user_id), comments(*, user:user_id(id, username, avatar_url))"
        )
        .single();

      if (error) throw error;

      // 4. อัปเดต State ผ่าน Callback (แปลงข้อมูลที่ดึงมาให้เป็น PostWithUser Type)
      if (onPostUpdated && data) {
        const updatedPostWithCounts: PostWithUser = {
          ...data,
          likes_count: data.likes?.length || 0,
          liked_by_user: data.likes
            ? data.likes.some(
                (like: { user_id: string }) => like.user_id === userId
              )
            : false,
          comments: (data.comments as CommentWithUser[]) || [],
        };
        onPostUpdated(updatedPostWithCounts);
      }
      setIsEditing(false); // ออกจากโหมดแก้ไข
    } catch (err) {
      console.error("Error updating post:", (err as Error).message);
      alert("ไม่สามารถแก้ไขโพสต์ได้: " + (err as Error).message);
    } finally {
      setIsSaving(false);
      // เคลียร์ค่าตัวแปรชั่วคราวทั้งหมด
      setSelectedFiles([]);
      imagePreviews.forEach(URL.revokeObjectURL);
      setImagePreviews([]);
      setExistingMediaPaths([]);
      setExistingMediaToDelete([]);
    }
  };

  // --- Logic: ลบโพสต์ (Delete) ---
  const handleDelete = async () => {
    setIsMenuOpen(false);
    // ใช้ window.confirm (ตามโค้ดเดิม)
    if (!window.confirm("คุณต้องการลบโพสต์นี้จริงหรือไม่?")) return; 

    try {
      // 1. หา Path ของไฟล์เพื่อลบจาก Storage
      const pathsToDelete: string[] = [];
      const bucketName = "post_media";

      for (const urlOrPath of post.media_urls) {
        // แยก Path จาก Full Public URL
        if (
          urlOrPath.startsWith("http://") ||
          urlOrPath.startsWith("https://")
        ) {
          try {
            const url = new URL(urlOrPath);
            const path = url.pathname.split(`/${bucketName}/`)[1];
            if (path) pathsToDelete.push(path);
          } catch (e) {
            console.warn("Invalid URL:", urlOrPath);
          }
        } else {
          // ถ้าเป็น Path อยู่แล้ว
          pathsToDelete.push(urlOrPath);
        }
      }

      // 2. ลบไฟล์ (ถ้ามี)
      if (pathsToDelete.length > 0) {
        await supabase.storage.from(bucketName).remove(pathsToDelete);
      }

      // 3. ลบข้อมูลจาก Database (RLS Policy ควรอนุญาตเฉพาะเจ้าของ)
      const { error: dbError } = await supabase
        .from("posts")
        .delete()
        .eq("id", post.id);

      if (dbError) throw dbError;

      // 4. แจ้ง Parent ว่าลบสำเร็จ
      if (onPostDeleted) {
        onPostDeleted(post.id);
      }
    } catch (err) {
      console.error("Error deleting post:", (err as Error).message);
      alert("ไม่สามารถลบโพสต์ได้: " + (err as Error).message);
    }
  };

  // --- JSX (Return Statement) ---
  return (
    <div className="relative bg-white p-4 rounded-2xl shadow mb-2 border border-gray-200">
      {/* 1. Modal แสดงรูปภาพ */}
      {/* MediaModal จะแสดงผลเมื่อ selectedMediaUrl มีค่าเท่านั้น */}
      <MediaModal
        mediaUrl={selectedMediaUrl as string}
        onClose={handleCloseModal}
      />

      {/* 2. เมนูตัวเลือก (Edit/Delete) - แสดงเฉพาะเจ้าของโพสต์ */}
      {userId === post.user_id && !isEditing && (
        <div ref={menuRef} className="absolute top-4 right-4 z-10">
          <button
            type="button"
            aria-label="ตัวเลือกเพิ่มเติม"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            {/* Icon จุดสามจุด */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-600"
            >
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>

          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[140px]">
              <button
                type="button"
                onClick={handleEdit}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
              >
                ✏️ แก้ไขโพสต์
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg"
              >
                🗑️ ลบโพสต์
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. ส่วนหัว: ข้อมูลผู้โพสต์ (User Post Header) */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          {/* ใช้ headerAvatarUrl และแสดง UsersRound Icon ถ้าไม่มีรูป */}
          {headerAvatarUrl && headerAvatarUrl !== "https://via.placeholder.com/24" ? (
            <Image
              src={headerAvatarUrl}
              alt={headerUsername || "Avatar"}
              width={40}
              height={40}
              className="object-cover"
              unoptimized
            />
          ) : (
            <UsersRound className="w-6 h-6 text-gray-500" />
          )}
        </div>
        <div className="flex flex-col">
          {/* แสดงชื่อผู้ใช้/ชื่อกลุ่ม */}
          <span className="font-semibold">{headerUsername}</span>
          {/* แสดงวันที่และเวลา */}
          <span className="text-xs text-gray-500">
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
          </span>
        </div>
      </div>

      {/* 4. ส่วนเนื้อหาโพสต์ (Content) */}
      {!isEditing ? (
        // --- โหมดแสดงผล (View Mode) ---
        <>
          {post.content && (
            <p className="mb-2 whitespace-pre-wrap break-words">
              {post.content}
            </p>
          )}

          {/* Grid แสดงรูปภาพ/วิดีโอ */}
          {mediaUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {mediaToShow.map((url, i) => {
                // Logic สำหรับแสดงปุ่ม "+N"
                const isLastLimitedItem =
                  !showAllMedia &&
                  i === MEDIA_LIMIT - 1 &&
                  remainingMediaCount > 0;
                const isSingleMedia = mediaUrls.length === 1 && !showAllMedia;

                const mediaContainerClass = isSingleMedia
                  ? "relative w-full h-auto min-h-48 rounded-xl overflow-hidden cursor-pointer" // รูปเดียวเต็มจอ
                  : "relative w-32 h-32 rounded-xl overflow-hidden cursor-pointer"; // หลายรูปขนาดเล็ก

                return (
                  <div
                    key={url}
                    className={mediaContainerClass}
                    onClick={() => handleMediaClick(url)}
                  >
                    {url.endsWith(".mp4") ? (
                      // แสดงวิดีโอ
                      <video
                        src={url}
                        controls={false}
                        className={`w-full h-full object-cover pointer-events-none ${
                          isSingleMedia ? "aspect-video" : ""
                        }`}
                      />
                    ) : (
                      // แสดงรูปภาพ
                      <Image
                        src={url}
                        fill
                        sizes={isSingleMedia ? "100vw" : "128px"}
                        className="object-cover"
                        unoptimized
                        alt={""}
                      />
                    )}

                    {/* Overlay แสดงจำนวนรูปที่เหลือ (+N) */}
                    {isLastLimitedItem && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // ป้องกันการเปิด Modal
                          handleToggleMedia(); // สลับไปแสดงทั้งหมด
                        }}
                        className="absolute inset-0 bg-black bg-opacity-50 text-white font-bold text-lg flex items-center justify-center hover:bg-opacity-70 transition"
                      >
                        +{remainingMediaCount}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ปุ่มซ่อนรูปภาพ (แสดงเมื่อ ShowAllMedia เป็น true) */}
          {showAllMedia && mediaUrls.length > MEDIA_LIMIT && (
            <button
              type="button"
              onClick={handleToggleMedia}
              className="text-sm text-sky-600 hover:text-sky-700 font-semibold mt-1 block"
            >
              ซ่อนรูปภาพ
            </button>
          )}
        </>
      ) : (
        // --- โหมดแก้ไข (Edit Mode) ---
        <div className="mb-2">
          {/* ช่องแก้ไขข้อความ */}
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm resize-y"
            rows={4}
            disabled={isSaving}
            autoFocus
          />

          {/* รายการรูปภาพเดิม (พร้อมปุ่มลบ) */}
          <div className="flex flex-wrap gap-2 my-2">
            {existingMediaPaths.map((path, i) => (
              <div
                key={`existing-${path}-${i}`}
                className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-300"
              >
                {path.endsWith(".mp4") ? (
                  <video
                    src={getPublicMediaUrl(path)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={getPublicMediaUrl(path)}
                    alt={`Existing media ${i}`}
                    fill
                    sizes="96px"
                    className="object-cover"
                    unoptimized
                  />
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveExistingMedia(path)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs z-10 hover:bg-red-700"
                  aria-label="ลบรูปภาพเก่า"
                  disabled={isSaving}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* ปุ่มเพิ่มรูปภาพใหม่ */}
          <div className="mt-4">
            <label
              htmlFor={`media-upload-edit-${post.id}`}
              className="cursor-pointer text-sm font-medium text-sky-600 hover:text-sky-700"
            >
              เพิ่มรูปภาพ/วิดีโอ...
            </label>
            <input
              id={`media-upload-edit-${post.id}`}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isSaving}
            />
          </div>

          {/* พรีวิวรูปภาพใหม่ที่เลือก */}
          {imagePreviews.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {imagePreviews.map((previewUrl, i) => (
                <div
                  key={`new-preview-${i}`}
                  className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-300"
                >
                  <Image
                    src={previewUrl}
                    alt={`New media preview ${i}`}
                    fill
                    sizes="96px"
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveNewFile(i)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs z-10 hover:bg-red-700"
                    aria-label="ลบรูปภาพที่เลือกใหม่"
                    disabled={isSaving}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ปุ่มบันทึก/ยกเลิก */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-100"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSaving}
              className="bg-green-600 text-white px-3 py-1 rounded-lg disabled:opacity-50"
            >
              {isSaving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      )}

      {/* 5. ส่วน Footer (Likes & Comments) - ซ่อนเมื่อกำลังแก้ไข */}
      {!isEditing && (
        <>
          {/* แถบ Like/Comment Count */}
          <div className="flex gap-4 text-gray-500 text-sm pt-3 mt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleLikeToggle}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                likedByUser ? "text-red-500" : "hover:text-red-400"
              }`}
            >
              <Heart className="w-4 h-4 fill-current" /> {likesCount} ถูกใจ
            </button>
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              {comments.length} ความคิดเห็น
            </span>
          </div>

          {/* แสดงรายการคอมเมนต์ */}
          {comments.length > 0 && (
            <div className="mt-2 space-y-1">
              {comments
                // จำกัดจำนวนคอมเมนต์ที่แสดง
                .slice(0, showAllComments ? comments.length : COMMENTS_LIMIT)
                .map((c) => {
                  // Logic: ถ้าเจ้าของกลุ่มมาเม้นต์ ให้ใช้รูปและชื่อกลุ่ม
                  const isOwnerCommenting = c.user?.id === groupOwnerId;
                  const avatarToShow = isOwnerCommenting
                    ? groupAvatar
                    : getAvatarPublicUrl(c.user?.avatar_url);

                  const nameToShow = isOwnerCommenting
                    ? groupName
                    : c.user?.username || "ผู้ใช้";

                  const fallbackAvatar = "https://via.placeholder.com/24";

                  return (
                    <div key={c.id} className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden">
                        <Image
                          src={avatarToShow || fallbackAvatar}
                          alt={nameToShow || "Avatar"}
                          width={24}
                          height={24}
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="bg-gray-100 px-2 py-1 rounded-lg text-sm break-words">
                        <span className="font-semibold">{nameToShow}</span>:{" "}
                        {c.content}
                      </div>
                    </div>
                  );
                })}

              {/* ปุ่มดูเพิ่มเติม/ซ่อน */}
              {comments.length > COMMENTS_LIMIT && (
                <button
                  type="button"
                  onClick={handleToggleComments}
                  className="text-xs text-sky-600 hover:text-sky-700 font-semibold mt-1 block"
                >
                  {showAllComments
                    ? "ซ่อนความคิดเห็น"
                    : `ดูเพิ่มเติม ${
                        comments.length - COMMENTS_LIMIT
                      } ความคิดเห็น...`}
                </button>
              )}
            </div>
          )}

          {/* ช่องพิมพ์คอมเมนต์ */}
          {userId && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newComment}
                // กด Enter เพื่อส่งคอมเมนต์
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault(); // ป้องกันการ Submit form หลัก
                    handleAddComment();
                  }
                }}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="เพิ่มความคิดเห็น..."
                className="flex-1 border rounded-lg px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="px-3 py-1 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition disabled:opacity-50 hover:scale-105 cursor-pointer"
              >
                ส่ง
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}