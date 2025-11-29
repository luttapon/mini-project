"use client";

import type { PostWithUser, CommentWithUser } from "@/types/supabase";
import PostCard from "./PostCard"; // นำเข้า Component PostCard สำหรับแสดงโพสต์แต่ละรายการ

// --- กำหนดโครงสร้างข้อมูล Props สำหรับ Component ---
export interface PostFeedProps {
  // รายการโพสต์ทั้งหมด (รวมข้อมูล Likes, Comments, และ User)
  posts?: (PostWithUser & {
    media_urls: string[];
    likes_count?: number;
    comments_count?: number;
    liked_by_user?: boolean;
    comments?: CommentWithUser[];
  })[];
  groupName: string;
  groupAvatar?: string | null;
  userId?: string | null; // ID ของผู้ใช้งานปัจจุบัน (สำหรับตรวจสอบสิทธิ์และการ Like)
  onPostDeleted?: (postId: string) => void; // Callback เมื่อลบโพสต์
  onPostUpdated?: (updatedPost: PostWithUser) => void; // Callback เมื่ออัปเดตโพสต์
  groupOwnerId: string; // ID เจ้าของกลุ่ม (ใช้ตรวจสอบสิทธิ์ลบโพสต์ในกลุ่ม)
}

export default function PostFeed({
  posts = [], // กำหนดค่าเริ่มต้นเป็น Array ว่าง
  groupName,
  groupAvatar,
  userId,
  onPostDeleted,
  onPostUpdated,
  groupOwnerId,
}: PostFeedProps) {
  
  // --- กรณีไม่มีโพสต์ให้แสดงข้อความว่างเปล่า ---
  if (!posts.length)
    return (
      // ปรับปรุงดีไซน์ข้อความว่างเปล่า (Empty State)
      <div className="p-12 text-center bg-white rounded-xl shadow-md border border-gray-200">
        <p className="text-xl font-semibold text-gray-500 mb-2">
          🎉 ยินดีต้อนรับเข้าสู่กลุ่ม!
        </p>
        <p className="text-gray-600">
          ติดตามกลุ่ม เพื่อเข้าดูโพสและกิจกรรมต่างๆ ที่น่าสนใจ
        </p>
      </div>
    );

  // --- แปลงข้อมูลโพสต์ให้ปลอดภัย (Sanitize Data) ---
  // การรับประกันว่า fields ที่เป็น Optional จะไม่เป็น null ก่อนส่งไป PostCard
  const safePosts = posts.map((post) => {
    // เตรียมรายการคอมเมนต์ (ถ้าเป็น null ให้ใช้ array ว่าง)
    const commentsToShow = post.comments || [];
    
    return {
        // ข้อมูลโพสต์เดิม
        ...post,
        // รับประกันว่าเป็น Array ว่างถ้าไม่มี Media
        media_urls: post.media_urls || [], 
        // รับประกันว่าเป็น Array ว่างถ้าไม่มี Comments
        comments: commentsToShow,
    };
  });

  return (
    // --- แสดงรายการโพสต์ทั้งหมด (Render Loop) ---
    // Container สำหรับ Feed, กำหนดช่องว่างระหว่าง PostCard
    <div className="flex flex-col space-y-4">
      {safePosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          groupName={groupName}
          groupAvatar={groupAvatar}
          userId={userId}
          onPostDeleted={onPostDeleted}
          onPostUpdated={onPostUpdated}
          groupOwnerId={groupOwnerId}
          // Component PostCard จะจัดการการแสดงผลโพสต์แต่ละรายการ
        />
      ))}
    </div>
  );
}