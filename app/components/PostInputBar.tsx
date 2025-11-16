"use client";

import { useState, ChangeEvent } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import type { PostWithUser } from "@/types/supabase";

interface PostInputBarProps {
  groupId: string;
  userId: string;
  onPosted?: (newPost: PostWithUser) => void;
}

export default function PostInputBar({ groupId, userId, onPosted }: PostInputBarProps) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeMedia = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // --- !! นี่คือฟังก์ชันที่แก้ไข !! ---
  const uploadMedia = async (): Promise<string[]> => {
    const urls: string[] = []; // โค้ดเดิมของคุณใช้ URL เต็ม, ผมจะใช้ตามเดิม
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const uniqueName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `posts/${uniqueName}`; // Path ใน Storage

      // 1. กำหนด File Options เพื่อเพิ่ม metadata
      const fileOptions = {
        cacheControl: '3600',
        upsert: false,
        metadata: {
          user_id: userId // <-- นี่คือส่วนสำคัญที่เพิ่มเข้ามา
        }
      };

      // 2. อัปโหลดไฟล์พร้อมกับ fileOptions
      const { error } = await supabase.storage
        .from("post_media")
        .upload(filePath, file, fileOptions); // <-- ส่ง fileOptions เป็น argument ที่ 3

      if (!error) {
        // 3. ดึง Public URL (ตามโค้ดเดิมของคุณ)
        const { data } = supabase.storage.from("post_media").getPublicUrl(filePath);
        if (data.publicUrl) urls.push(data.publicUrl);
      } else {
        console.error("Error uploading file:", error.message);
      }
    }
    return urls;
  };
  // ---------------------------------

  const handleSubmit = async () => {
    if (!text.trim() && files.length === 0) return;
    setLoading(true);

    const mediaUrls = await uploadMedia();

    const { data, error } = await supabase
      .from("posts")
      .insert({
        group_id: groupId,
        user_id: userId,
        content: text.trim(), // <-- แก้ไข: ใช้ text.trim() ป้องกัน error 'NOT NULL'
        media_urls: mediaUrls,
      })
      .select("*, user:user_id(id, username, avatar_url, created_at)")
      .single();

    setLoading(false);
    if (error) {
      console.error("Error inserting post:", error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
      return;
    }

    setText("");
    setFiles([]);
    previews.forEach(URL.revokeObjectURL);
    setPreviews([]);

    if (onPosted && data) {
      const newPost: PostWithUser = {
        ...data,
        media_urls: data.media_urls || [],
        likes_count: 0,
        liked_by_user: false,
        comments: [],
        user: data.user || {
          id: userId,
          username: "Unknown",
          avatar_url: null,
          created_at: null,
        }
      };
      onPosted(newPost);
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow mb-4 border border-gray-200 flex flex-col gap-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="เขียนอะไรสักอย่าง ..."
        className="w-full border rounded-xl p-3 outline-none resize-none"
        rows={3}
      />
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((url, i) => (
            <div key={i} className="relative w-32 h-32 rounded-xl overflow-hidden">
              <button
                type="button" // เพิ่ม type
                onClick={() => removeMedia(i)}
                className="absolute top-1 right-1 bg-gray-800 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-gray-900 z-10"
                title="ลบสื่อ"
              >
                ×
              </button>
              {files[i].type.startsWith("video") ? (
                <video src={url} controls className="w-full h-full object-cover" />
              ) : (
                <Image src={url} alt="Preview" fill className="object-cover" unoptimized />
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-between items-center">
        <label className="cursor-pointer text-blue-600 font-medium">
          เพิ่มรูป / วิดีโอ
          <input
            type="file"
            className="hidden"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
          />
        </label>
        <button
          type="button" // เพิ่ม type
          onClick={handleSubmit}
          disabled={loading || (!text.trim() && files.length === 0)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl disabled:opacity-50"
        >
          {loading ? "กำลังโพสต์..." : "โพสต์"}
        </button>
      </div>
    </div>
  );
}