"use client";

import Image from "next/image";
import type { PostWithUser, CommentWithUser } from "@/types/supabase";
import { supabase } from "@/lib/supabase/client";
import { useState, useRef, useEffect, ChangeEvent } from "react"; 

// ****************************************
// Component Modal สำหรับแสดงรูปภาพ/วิดีโอขนาดใหญ่ (MediaModal)
// ****************************************
const MediaModal = ({
  mediaUrl,
  onClose,
}: {
  mediaUrl: string;
  onClose: () => void;
}) => {
  if (!mediaUrl) return null;

  const isVideo = mediaUrl.endsWith(".mp4");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()} // ป้องกันการปิด Modal เมื่อคลิกที่รูป
      >
        {isVideo ? (
          <video
            src={mediaUrl}
            controls
            className="max-w-full max-h-screen"
            autoPlay
          />
        ) : (
          <div className="relative w-full h-full max-h-screen">
            <img
              src={mediaUrl}
              alt="Full size media"
              className="max-w-full max-h-[80vh] md:max-h-[90vh] object-contain"
            />
          </div>
        )}
      </div>
      {/* ปุ่ม Close ถูกย้ายไปมุมบนขวาของหน้าจอ */}
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
// ****************************************


interface PostCardProps {
  post: PostWithUser & { media_urls: string[] };
  groupName: string;
  groupAvatar?: string | null;
  userId?: string | null;
  onPostDeleted?: (postId: string) => void;
  onPostUpdated?: (updatedPost: PostWithUser) => void;
  groupOwnerId: string; // Prop ที่จำเป็นสำหรับ Logic การคอมเมนต์
}

const COMMENTS_LIMIT = 3; 

export default function PostCard({
  post,
  groupName,
  groupAvatar,
  userId,
  onPostDeleted,
  onPostUpdated,
  groupOwnerId,
}: PostCardProps) {
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [likedByUser, setLikedByUser] = useState(post.liked_by_user || false);
  const [comments, setComments] = useState<CommentWithUser[]>(post.comments || []);
  const [newComment, setNewComment] = useState("");

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false); 

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); 
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); 
  const [existingMediaPaths, setExistingMediaPaths] = useState<string[]>([]); 
  const [existingMediaToDelete, setExistingMediaToDelete] = useState<string[]>([]); 
  
  // State สำหรับควบคุมการแสดงผล Media
  const [showAllMedia, setShowAllMedia] = useState(false); 


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

  const avatarUrl =
    groupAvatar?.startsWith("http") ? groupAvatar : "https://via.placeholder.com/40";

  // ฟังก์ชันสำหรับรูปโปรไฟล์ (Avatar)
  const getAvatarPublicUrl = (path: string | null | undefined) => {
    if (!path) return "https://via.placeholder.com/24"; 
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path; 
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl || "https://via.placeholder.com/24";
  };
  
  // ฟังก์ชันนี้จะแปลง path เป็น public URL (สำหรับรูปในโพสต์)
  const getPublicMediaUrl = (urlOrPath: string) => {
    if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
      return urlOrPath;
    }
    const { data } = supabase.storage.from("post_media").getPublicUrl(urlOrPath);
    return data.publicUrl || "https://via.placeholder.com/128";
  };

  const mediaUrls = post.media_urls.map(getPublicMediaUrl);
  
  // Logic สำหรับจำกัดการแสดงผล Media
  // *** ปรับค่า MEDIA_LIMIT เป็น 5 ***
  const MEDIA_LIMIT = 5; 
  // ******************************
  const mediaToShow = showAllMedia ? mediaUrls : mediaUrls.slice(0, MEDIA_LIMIT);
  const remainingMediaCount = mediaUrls.length - MEDIA_LIMIT;

  // --- ฟังก์ชันสำหรับเปิด/ปิด Modal ---
  const handleMediaClick = (url: string) => {
    setSelectedMediaUrl(url);
  };

  const handleCloseModal = () => {
    setSelectedMediaUrl(null);
  };
  // ------------------------------------

  const handleLikeToggle = async () => {
    if (!userId) return; 
    try {
      if (likedByUser) {
        await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", userId);
        setLikedByUser(false);
        setLikesCount((prev) => prev - 1);
      } else {
        await supabase.from("likes").insert([{ post_id: post.id, user_id: userId }]);
        setLikedByUser(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Error toggling like:", (err as Error).message);
    }
  };

  const handleAddComment = async () => {
    if (!userId || !newComment.trim()) return;
    try {
      const { data: insertedData, error: insertError } = await supabase
        .from("comments")
        .insert([{ post_id: post.id, user_id: userId, content: newComment.trim() }])
        .select("id") 
        .single();

      if (insertError || !insertedData) throw insertError || new Error("Insert empty");

      const { data: commentWithUser, error: fetchError } = await supabase
        .from("comments")
        .select("*, user:user_id(id, username, avatar_url)")
        .eq("id", insertedData.id)
        .single<CommentWithUser>(); 

      if (fetchError || !commentWithUser) throw fetchError || new Error("Comment not found");
      if (!commentWithUser.user) throw new Error("User data not joined");

      setComments((prev) => [...prev, commentWithUser]);
      setNewComment(""); 
    } catch (err) {
      console.error("Error adding comment:", (err as Error).message);
      alert("เพิ่มคอมเมนต์ไม่สำเร็จ");
    }
  };


  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(post.content || "");
    setIsMenuOpen(false);

    const currentPaths = post.media_urls.map(urlOrPath => {
        if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
            try {
                const url = new URL(urlOrPath);
                const pathSegment = `/post_media/`; 
                const path = url.pathname.split(pathSegment)[1];
                return path;
            } catch (e) {
                console.warn("Invalid URL for parsing path:", urlOrPath);
                return urlOrPath; 
            }
        }
        return urlOrPath;
    }).filter(Boolean) as string[]; 

    setExistingMediaPaths(currentPaths);
    setSelectedFiles([]);
    setImagePreviews([]);
    setExistingMediaToDelete([]);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedFiles([]);
    imagePreviews.forEach(URL.revokeObjectURL);
    setImagePreviews([]);
    setExistingMediaPaths([]);
    setExistingMediaToDelete([]);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);

      const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveNewFile = (indexToRemove: number) => {
    URL.revokeObjectURL(imagePreviews[indexToRemove]); // คืน Memory
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    setImagePreviews((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleRemoveExistingMedia = (pathToRemove: string) => {
    setExistingMediaPaths((prev) => prev.filter((path) => path !== pathToRemove));
    setExistingMediaToDelete((prev) => [...prev, pathToRemove]); 
  };


  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      let finalMediaUrls: string[] = [...existingMediaPaths]; 

      // 1. ลบรูปภาพเก่า
      if (existingMediaToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from("post_media")
          .remove(existingMediaToDelete);
        
        if (deleteError) {
          console.error("Error deleting old media:", deleteError.message);
        }
      }

      // 2. อัปโหลดรูปภาพใหม่
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const uniqueName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `posts/${uniqueName}`; // ใส่ใน "posts"

          const { data, error } = await supabase.storage
            .from("post_media")
            .upload(filePath, file); 
          
          if (error) {
            throw error;
          }
          return filePath; 
        });

        const newUploadedPaths = await Promise.all(uploadPromises);
        finalMediaUrls = [...finalMediaUrls, ...newUploadedPaths]; 
      }

      // 3. อัปเดต Database
      const { data, error } = await supabase
        .from("posts")
        .update({ 
          content: editedContent.trim(),
          media_urls: finalMediaUrls, 
        })
        .eq("id", post.id)
        // ดึงข้อมูล likes และ comments กลับมาด้วยเพื่อป้องกัน Stale State
        .select("*, user:user_id(id, username, avatar_url, created_at), likes(user_id), comments(*, user:user_id(id, username, avatar_url))")
        .single();

      if (error) throw error;
      
      if (onPostUpdated && data) {
        // สร้างข้อมูลโพสต์ใหม่ที่สมบูรณ์ (รวม likes/comments ที่เพิ่งดึงมา)
        const updatedPostWithCounts: PostWithUser = {
          ...data,
          likes_count: data.likes?.length || 0,
          liked_by_user: data.likes ? data.likes.some((like: { user_id: string }) => like.user_id === userId) : false,
          comments: (data.comments as CommentWithUser[]) || []
        };
        onPostUpdated(updatedPostWithCounts);
      }
      setIsEditing(false);
      
    } catch (err) {
      console.error("Error updating post:", (err as Error).message);
      alert("ไม่สามารถแก้ไขโพสต์ได้: " + (err as Error).message);
    } finally {
      setIsSaving(false);
      setSelectedFiles([]);
      imagePreviews.forEach(URL.revokeObjectURL);
      setImagePreviews([]);
      setExistingMediaPaths([]);
      setExistingMediaToDelete([]);
    }
  };

  // --- 4. DELETE ---
  const handleDelete = async () => {
    setIsMenuOpen(false);
    if (!window.confirm("คุณต้องการลบโพสต์นี้จริงหรือไม่?")) return;

    try {
      // 1. หา Path
      const pathsToDelete: string[] = [];
      const bucketName = "post_media"; 

      for (const urlOrPath of post.media_urls) {
        if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
          try {
            const url = new URL(urlOrPath);
            const path = url.pathname.split(`/${bucketName}/`)[1];
            if (path) {
              pathsToDelete.push(path);
            }
          } catch (e) {
            console.warn("Invalid URL, cannot parse path:", urlOrPath);
          }
        } else {
          pathsToDelete.push(urlOrPath);
        }
      }
      
      // 2. ลบไฟล์ Storage
      if (pathsToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from(bucketName)
          .remove(pathsToDelete);
        
        if (storageError) {
          // ถ้าลบไม่สำเร็จ (เพราะ RLS) ให้แค่ Log ไว้ แต่ *ไม่ต้องหยุด* (non-strict delete)
          console.error("Error deleting storage files (likely RLS policy):", storageError.message);
        }
      }
      
      // 3. ลบโพสต์ DB (จะทำงานเสมอ)
      const { error: dbError } = await supabase.from("posts").delete().eq("id", post.id);

      if (dbError) throw dbError; 

      // 4. อัปเดต UI
      if (onPostDeleted) {
        onPostDeleted(post.id);
      }

    } catch (err) {
      console.error("Error deleting post:", (err as Error).message);
      alert("ไม่สามารถลบโพสต์ได้: " + (err as Error).message);
    }
  };

  // --- 5. TOGGLE COMMENTS ---
  const handleToggleComments = () => {
    setShowAllComments((prev) => !prev);
  };
  
  // ฟังก์ชันสำหรับ Toggle Media
  const handleToggleMedia = () => {
      setShowAllMedia((prev) => !prev);
  };
  // **********************************


  return (
    <div className="relative bg-white p-4 rounded-2xl shadow mb-2 border border-gray-200">
      
      {/* 1. แสดง Modal */}
      <MediaModal mediaUrl={selectedMediaUrl as string} onClose={handleCloseModal} />
      {/* ----------------- */}
      
      {userId === post.user_id && !isEditing && ( // ซ่อนเมนูตอนกำลังแก้ไข
        <div ref={menuRef} className="absolute top-4 right-4 z-10">
          <button
            type="button"
            aria-label="ตัวเลือกเพิ่มเติม"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
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

      {/* Group info */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full overflow-hidden">
          <Image src={avatarUrl} alt="Group Avatar" width={40} height={40} className="object-cover" unoptimized />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold">{groupName}</span>
          <span className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</span>
        </div>
      </div>

      {/* --- JSX ส่วน Content และ Media --- */}
      {!isEditing ? (
        // * โหมดแสดงผล (ปกติ) *
        <>
          {post.content && <p className="mb-2 whitespace-pre-wrap break-words">{post.content}</p>}
          {mediaUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {mediaToShow.map((url, i) => {
                
                const isLastLimitedItem = !showAllMedia && i === MEDIA_LIMIT - 1 && remainingMediaCount > 0;
                
                // Logic สำหรับกำหนด Class CSS เพื่อขยายรูปภาพเดียว
                const isSingleMedia = mediaUrls.length === 1 && !showAllMedia; // เช็กว่ามีรูปเดียวและไม่ได้อยู่ในโหมดแสดงทั้งหมด
                const mediaContainerClass = isSingleMedia 
                    ? "relative w-full h-auto min-h-48 rounded-xl overflow-hidden cursor-pointer" // รูปเดียว: กว้างเต็ม
                    : "relative w-32 h-32 rounded-xl overflow-hidden cursor-pointer";             // หลายรูป: ขนาดเล็ก

                return (
                  <div 
                    key={url} 
                    className={mediaContainerClass} // ใช้ Class ที่กำหนดใหม่
                    onClick={() => handleMediaClick(url)}
                  >
                    {url.endsWith(".mp4") ? (
                      <video 
                        src={url} 
                        controls={false} 
                        className={`w-full h-full object-cover pointer-events-none ${isSingleMedia ? 'aspect-video' : ''}`} // สำหรับวิดีโอรูปเดียว
                      />
                    ) : (
                      <Image 
                        src={url} 
                        alt="Media" 
                        fill 
                        sizes={isSingleMedia ? "100vw" : "128px"} // ปรับ sizes ให้เหมาะสมกับรูปเดียว
                        className="object-cover" 
                        unoptimized 
                      />
                    )}
                    
                    {/* ปุ่ม/Overlay ดูเพิ่มเติม */}
                    {isLastLimitedItem && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // หยุดไม่ให้ Modal เปิด
                          handleToggleMedia();
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
          
          {/* ปุ่ม ซ่อนรูปภาพ เมื่อแสดงทั้งหมดแล้ว */}
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
        // * โหมดแก้ไข *
        <div className="mb-2">
          {/* Textarea สำหรับแก้ไข Content */}
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm resize-y"
            rows={4}
            disabled={isSaving}
            autoFocus
          />

          {/* แสดงรูปภาพเก่าที่ยังคงอยู่ (ในโหมดแก้ไข) พร้อมปุ่มลบ */}
          <div className="flex flex-wrap gap-2 my-2">
            {existingMediaPaths.map((path, i) => (
              <div key={`existing-${path}-${i}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-300">
                {path.endsWith(".mp4") ? (
                  <video src={getPublicMediaUrl(path)} className="w-full h-full object-cover" />
                ) : (
                  <Image src={getPublicMediaUrl(path)} alt={`Existing media ${i}`} fill sizes="96px" className="object-cover" unoptimized />
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

          {/* Input สำหรับเลือกรูปภาพใหม่ */}
          <div className="mt-4">
            <label htmlFor={`media-upload-edit-${post.id}`} className="cursor-pointer text-sm font-medium text-sky-600 hover:text-sky-700">
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
          
          {/* แสดง Preview รูปภาพใหม่ที่เลือกมา พร้อมปุ่มลบ */}
          {imagePreviews.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {imagePreviews.map((previewUrl, i) => (
                <div key={`new-preview-${i}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-300">
                  <Image src={previewUrl} alt={`New media preview ${i}`} fill sizes="96px" className="object-cover" unoptimized />
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

          {/* ปุ่มควบคุมการบันทึก/ยกเลิก */}
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
      {/* ------------------------------------- */}


      {/* ซ่อนส่วน Likes/Comments/Add Comment เมื่อกำลังแก้ไข */}
      {!isEditing && (
        <>
          {/* Likes & Comments Count */}
          <div className="flex items-center gap-4 mt-2 border-t border-gray-200 pt-2">
            <button
              type="button"
              onClick={handleLikeToggle}
              className={`px-3 py-1 rounded-lg ${likedByUser ? "bg-red-500 text-white" : "bg-gray-200 text-gray-800"}`}
            >
              {likedByUser ? "❤️ ไลค์แล้ว" : "🤍 ไลค์"} ({likesCount})
            </button>
            <span className="text-gray-500">💬 {comments.length} ความคิดเห็น</span>
          </div>

          {/* Comments */}
          {comments.length > 0 && (
            <div className="mt-2 space-y-1">
              {comments.slice(0, showAllComments ? comments.length : COMMENTS_LIMIT).map((c) => {
                
                // Logic: เช็กว่าคนคอมเมนต์ คือ เจ้าของกลุ่มหรือไม่
                const isOwnerCommenting = c.user?.id === groupOwnerId;
                
                // 4. ถ้าใช่ ให้ใช้รูปกลุ่มและชื่อกลุ่ม
                const avatarToShow = isOwnerCommenting 
                  ? groupAvatar // รูปกลุ่ม (เป็น URL อยู่แล้ว)
                  : getAvatarPublicUrl(c.user?.avatar_url); // รูปโปรไฟล์คนคอมเมนต์

                const nameToShow = isOwnerCommenting
                  ? groupName // ชื่อกลุ่ม
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
                      <span className="font-semibold">{nameToShow}</span>: {c.content}
                    </div>
                  </div>
                );
              })}
              {/* ปุ่ม ดูเพิ่มเติม/ซ่อน */}
              {comments.length > COMMENTS_LIMIT && (
                <button
                  type="button"
                  onClick={handleToggleComments}
                  className="text-xs text-sky-600 hover:text-sky-700 font-semibold mt-1 block"
                >
                  {showAllComments
                    ? "ซ่อนความคิดเห็น"
                    : `ดูเพิ่มเติม ${comments.length - COMMENTS_LIMIT} ความคิดเห็น...`}
                </button>
              )}
            </div>
          )}

          {/* Add Comment */}
          {userId && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newComment}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment();
                }}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="เพิ่มความคิดเห็น..."
                className="flex-1 border rounded-lg px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="px-3 py-1 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition disabled:opacity-50"
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