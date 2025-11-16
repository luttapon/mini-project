"use client";

import type { PostWithUser, CommentWithUser } from "@/types/supabase";
import PostCard from "./PostCard";

export interface PostFeedProps {
  posts?: (PostWithUser & {
    media_urls: string[];
    likes_count?: number;
    comments_count?: number;
    liked_by_user?: boolean;
    comments?: CommentWithUser[];
  })[];
  groupName: string;
  groupAvatar?: string | null;
  userId?: string | null;
  onPostDeleted?: (postId: string) => void;
  onPostUpdated?: (updatedPost: PostWithUser) => void;
  groupOwnerId: string;
}

export default function PostFeed({
  posts = [],
  groupName,
  groupAvatar,
  userId,
  onPostDeleted,
  onPostUpdated,
  groupOwnerId,
}: PostFeedProps) {
  if (!posts.length)
    return <p className="p-4 text-gray-500">ยังไม่มีโพสต์ในกลุ่มนี้</p>;

  // 🛑 ลบฟังก์ชัน mapComment ที่ซับซ้อนออก
  

  // map posts: ส่ง comments ทั้งหมดไปให้ PostCard จัดการ
  const safePosts = posts.map((post) => {
    
    // Comments ที่ดึงมา (รวม Replies)
    const commentsToShow = post.comments || [];
    
    // เนื่องจากเราลบ replies ออกจาก type/query ไปแล้ว 
    // commentsToShow ควรมีเฉพาะคอมเมนต์ระดับบนสุดและ Replies ที่ถูกดึงมาทั้งหมด
    
    return {
        ...post,
        media_urls: post.media_urls || [],
        comments: commentsToShow,
    };
});

  return (
    <div className="flex flex-col gap-4">
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
        />
      ))}
    </div>
  );
}