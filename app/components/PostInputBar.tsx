"use client";

import { useState, ChangeEvent } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import type { PostWithUser } from "@/types/supabase"; // นำเข้า Type สำหรับ Post

// --- กำหนด Props สำหรับ Component ---
interface PostInputBarProps {
  groupId: string;
  userId: string; // ID ผู้ใช้ที่ล็อกอินอยู่
  onPosted?: (newPost: PostWithUser) => void; // Callback เมื่อโพสต์สำเร็จ
  
  // Props สำหรับจัดการสิทธิ์
  isGroupOwner: boolean; // เป็นเจ้าของกลุ่มหรือไม่
  allowMembersToPost: boolean; // กลุ่มอนุญาตให้สมาชิกโพสต์หรือไม่
  isFollowing: boolean; // ผู้ใช้กำลังติดตาม/เป็นสมาชิกกลุ่มหรือไม่
}

export default function PostInputBar({ groupId, userId, onPosted, isGroupOwner, allowMembersToPost, isFollowing }: PostInputBarProps) {
  // --- ส่วนจัดการ State ---
  const [text, setText] = useState(""); // ข้อความโพสต์
  const [files, setFiles] = useState<File[]>([]); // ไฟล์รูป/วิดีโอที่เลือก
  const [previews, setPreviews] = useState<string[]>([]); // URL สำหรับแสดงตัวอย่าง
  const [loading, setLoading] = useState(false); // สถานะกำลังโหลด

  // Logic การตรวจสอบสิทธิ์การโพสต์
  // canUserPost = (เป็นเจ้าของ) OR (เป็นผู้ติดตาม/สมาชิก AND กลุ่มอนุญาตให้สมาชิกโพสต์)
  const canUserPost = isGroupOwner || (isFollowing && allowMembersToPost);
  
  // --- NEW LOGIC: การตัดสินใจแสดงผล Component (Render Control) ---
  
  // 1. ถ้าผู้ใช้ไม่ได้เข้าสู่ระบบ (ไม่มี userId) ไม่ว่ากรณีใดๆ ต้องไม่แสดงกล่องโพสต์
  if (!userId) {
    return null; 
  }
  
  // 2. ถ้าผู้ใช้เข้าสู่ระบบแล้ว แต่ไม่มีสิทธิ์โพสต์ (ไม่ใช่เจ้าของ AND ไม่ใช่ผู้ติดตาม) 
  // ตาม Logic ของกลุ่มปิด/กึ่งปิด จะไม่แสดงกล่องโพสต์
  if (!isGroupOwner && !isFollowing) {
    // ถ้าผู้ใช้ไม่ใช่เจ้าของ และไม่ได้ติดตาม/เป็นสมาชิก
    return null;
  }
  
  // --- Logic: เมื่อมีการเลือกรูป/วิดีโอ ---
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    // โค้ดนี้จะทำงานเมื่อผู้ใช้คลิกเลือกไฟล์ผ่าน Input ที่ถูกซ่อนไว้
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
    
    // สร้าง Blob URL เพื่อแสดงตัวอย่างทันที
    const newPreviews = selectedFiles.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  // --- Logic: ลบสื่อที่เลือกไว้ออก ---
  const removeMedia = (index: number) => {
    // คืน Memory ให้ Browser ก่อนลบ
    URL.revokeObjectURL(previews[index]); 
    // อัปเดต State โดยกรอง Index ที่ถูกลบออก
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Logic: อัปโหลดไฟล์ไปยัง Supabase Storage ---
  const uploadMedia = async (): Promise<string[]> => {
    const urls: string[] = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const uniqueName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `posts/${uniqueName}`; // Path ที่ใช้เก็บใน Bucket

      // กำหนด Metadata สำหรับไฟล์ (สำคัญสำหรับ RLS Policy ถ้ามีการตรวจสอบ user_id)
      const fileOptions = {
        cacheControl: '3600',
        upsert: false,
        metadata: {
          user_id: userId // แนบ user ID เข้าไปใน metadata
        }
      };

      // อัปโหลดไปยัง Bucket "post_media"
      const { error } = await supabase.storage
        .from("post_media")
        .upload(filePath, file, fileOptions);

      if (!error) {
        // ดึง Public URL ของไฟล์ที่อัปโหลดเสร็จแล้ว
        const { data } = supabase.storage.from("post_media").getPublicUrl(filePath);
        if (data.publicUrl) urls.push(data.publicUrl);
      } else {
        console.error("Error uploading file:", error.message);
      }
    }
    return urls; // คืนค่า Array ของ URL ที่อัปโหลดสำเร็จ
  };

  // --- Logic: บันทึกโพสต์ (Submit) ---
  const handleSubmit = async () => {
    // ป้องกันการส่งโพสต์ว่างเปล่า หรือผู้ใช้ไม่มีสิทธิ์
    if (!canUserPost || (!text.trim() && files.length === 0)) return;
    
    setLoading(true);

    // 1. อัปโหลดรูปภาพ/วิดีโอทั้งหมดก่อน
    const mediaUrls = await uploadMedia();

    // 2. บันทึกข้อมูลโพสต์ลงฐานข้อมูล
    const { data, error } = await supabase
      .from("posts")
      .insert({
        group_id: groupId,
        user_id: userId,
        content: text.trim(),
        media_urls: mediaUrls,
      })
      // Join เอาข้อมูลผู้โพสต์มาด้วยเพื่อใช้แสดงผลในหน้าหลักทันที (Optimistic Update)
      .select("*, user:user_id(id, username, avatar_url, created_at)") 
      .single(); // ดึงข้อมูลกลับมาแค่แถวเดียว

    setLoading(false);

    if (error) {
      console.error("Error inserting post:", error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
      return;
    }

    // 3. เคลียร์ค่าในฟอร์มหลังจากโพสต์สำเร็จ
    setText("");
    setFiles([]);
    previews.forEach(URL.revokeObjectURL); // ล้าง Blob URLs
    setPreviews([]);

    // 4. แจ้ง Component แม่ (Parent) ว่ามีโพสต์ใหม่
    if (onPosted && data) {
      // จัดรูปแบบข้อมูลให้ตรงกับ PostWithUser Type
      const newPost: PostWithUser = {
        ...data,
        media_urls: data.media_urls || [],
        likes_count: 0,
        liked_by_user: false,
        comments: [], // เนื่องจากเพิ่งโพสต์ จึงไม่มีคอมเมนต์
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
  // --- Container หลัก ---
  <div className="bg-white p-5 rounded-3xl shadow-md mb-5 border border-gray-200 flex flex-col gap-4 transition-all hover:shadow-lg">
    
    {/* ⚠️ แจ้งเตือนสิทธิ์ (แสดงเมื่อผู้ใช้ไม่สามารถโพสต์ได้ แต่ยังเห็นกล่อง) */}
    {!canUserPost && (
      <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
        <span className="text-xl">⚠️</span>
        กลุ่มนี้ถูกตั้งค่าให้มีเฉพาะเจ้าของเท่านั้นที่สามารถโพสต์ได้
      </div>
    )}

    {/* ช่องเขียนโพสต์ */}
    <textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder="💭 เขียนอะไรสักอย่าง..."
      className="w-full border border-gray-300 rounded-2xl p-4 outline-none resize-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all"
      rows={4}
      disabled={!canUserPost || loading}
    />

    {/* ตัวอย่างสื่อ (Previews) */}
    {previews.length > 0 && (
      <div className="flex flex-wrap gap-3 mt-2">
        {previews.map((url, i) => (
          <div key={i} className="relative w-32 h-32 rounded-xl overflow-hidden shadow-sm border border-gray-200">
            {/* ปุ่มลบ */}
            <button
              type="button"
              onClick={() => removeMedia(i)}
              className="absolute top-1 right-1 bg-gray-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-gray-900 z-10"
              title="ลบสื่อ"
            >
              ×
            </button>

            {/* วิดีโอหรือรูป (ตรวจสอบ Mime Type) */}
            {files[i].type.startsWith("video") ? (
              <video src={url} controls className="w-full h-full object-cover rounded-xl" />
            ) : (
              // ใช้ Next/Image สำหรับรูปภาพ
              <Image src={url} alt="Preview" fill className="object-cover rounded-xl" unoptimized />
            )}
          </div>
        ))}
      </div>
    )}

    {/* ปุ่มเครื่องมือด้านล่าง */}
    <div className="flex justify-between items-center mt-3">
      
      {/* ปุ่มเพิ่มรูป/วิดีโอ (ใช้ Label ครอบ Input Type="file") */}
      <label
        className={`cursor-pointer flex items-center gap-1 text-blue-600 font-semibold transition-all active:scale-95 ${
          canUserPost ? 'hover:text-blue-700 hover:underline' : 'opacity-50 cursor-not-allowed'
        }`}
      >
        📸 เพิ่มรูป / 🎬 วิดีโอ
        <input
          type="file"
          className="hidden"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          disabled={!canUserPost || loading}
        />
      </label>

      {/* ปุ่มโพสต์ */}
      <button
        type="button"
        onClick={handleSubmit}
        // ปุ่ม Disabled ถ้า: กำลังโหลด, ข้อความว่างเปล่า/ไม่มีไฟล์, หรือไม่มีสิทธิ์โพสต์
        disabled={loading || (!text.trim() && files.length === 0) || !canUserPost}
        className="bg-blue-600 text-white px-5 py-2 rounded-2xl disabled:opacity-50 hover:bg-blue-700 transition hover:scale-105 flex items-center gap-2 font-medium"
      >
        {loading ? "⏳ กำลังโพสต์..." : "🚀 โพสต์"}
      </button>
    </div>
  </div>
);
}