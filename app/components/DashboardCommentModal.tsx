"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Send, X } from "lucide-react";
import Image from "next/image";

// NOTE: Interface เหล่านี้ถูกนำมาจาก PostCard.tsx และ GroupDetailPage.tsx
interface CommentUser {
    id: string;
    username: string | null;
    avatar_url: string | null;
}

interface CommentWithUser {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    created_at: string;
    user: CommentUser;
}

interface DashboardCommentModalProps {
    postId: string;
    userId: string; // ID ของ User ที่คอมเมนต์ (User ที่ล็อกอินอยู่)
    onClose: () => void;
    updateCount: (postId: string) => void; // Callback อัปเดต comment count ใน Dashboard
}

// Helper function: Get public URL for user avatar (Assumes 'avatars' bucket)
const getAvatarPublicUrl = (path: string | null | undefined) => {
    if (!path) return "https://placehold.co/32"; 
    if (path.startsWith("http://") || path.startsWith("https://")) return path; 
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl || "https://placehold.co/32";
};


export default function DashboardCommentModal({ postId, userId, onClose, updateCount }: DashboardCommentModalProps) {
    const [comments, setComments] = useState<CommentWithUser[]>([]);
    const [commentText, setCommentText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- 1. Fetch Comments Data on mount ---
    useEffect(() => {
        const fetchComments = async () => {
            const { data } = await supabase
                .from("comments")
                // Join user data เพื่อแสดงรูปและชื่อ
                .select("*, user:user_id(id, username, avatar_url)")
                .eq("post_id", postId)
                .order("created_at", { ascending: true }); // เรียงคอมเมนต์เก่าสุดไปใหม่สุด

            if (data) {
                // กรองข้อมูลที่จำเป็นและตั้งค่า
                const safeComments: CommentWithUser[] = data.map(c => ({
                    ...c,
                    user: c.user || { id: c.user_id, username: null, avatar_url: null },
                })) as CommentWithUser[];

                setComments(safeComments);
            }
            setIsLoading(false);
        };
        fetchComments();
    }, [postId]);


    // --- 2. Handle Comment Submission ---
    const handleCommentSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            // Insert the new comment and select the full user data back
            const { data: insertedData, error: insertError } = await supabase
                .from("comments")
                .insert([{ post_id: postId, user_id: userId, content: commentText.trim() }])
                .select("*, user:user_id(id, username, avatar_url)")
                .single();

            if (insertError) throw insertError;

            // Update local state (Optimistic)
            setComments((prev) => [...prev, insertedData as CommentWithUser]);
            setCommentText("");
            
            // Update parent state (increment comment count)
            updateCount(postId); 

        } catch (err) {
            console.error("Error submitting comment:", err);
            alert("ไม่สามารถเพิ่มความคิดเห็นได้");
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center shrink-0">
                <h3 className="text-lg font-bold">ความคิดเห็นทั้งหมด ({comments.length})</h3>
                <button onClick={onClose} type="button" aria-label="ปิดหน้าต่าง" className="text-gray-500 hover:text-gray-900 font-bold text-2xl leading-none">
                    <X className="w-6 h-6 cursor-pointer" />
                </button>
            </div>
            
            {/* Comment List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoading ? (
                    <div className="p-4 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-sky-500" /></div>
                ) : comments.length === 0 ? (
                    <p className="text-center text-gray-500 py-10">ยังไม่มีใครแสดงความคิดเห็น</p>
                ) : (
                    comments.map((c) => (
                        <div key={c.id} className="flex items-start gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 shrink-0">
                                <Image 
                                    src={getAvatarPublicUrl(c.user?.avatar_url)} 
                                    alt={c.user?.username || "User"} 
                                    width={32} height={32} 
                                    className="object-cover" 
                                    unoptimized 
                                />
                            </div>
                            <div className="flex-1 bg-gray-100 px-3 py-2 rounded-xl text-sm break-words">
                                <span className="font-semibold">{c.user?.username || "Unnamed User"}</span>
                                <p className="text-gray-800 mt-0.5">{c.content}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleString()}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleCommentSubmit} className="p-4 border-t bg-gray-50 flex gap-2 shrink-0">
                <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="เพิ่มความคิดเห็น..."
                    className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:ring-sky-500 focus:border-sky-500 outline-none"
                    disabled={isSubmitting}
                />
                <button
                    type="submit"
                    disabled={!commentText.trim() || isSubmitting}
                    className="bg-sky-600 text-white px-5 py-2 rounded-full font-semibold disabled:opacity-50 transition-all flex items-center gap-1 cursor-pointer active:scale-95 hover:bg-sky-700 "
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    <span>ส่ง</span>
                </button>
            </form>
        </div>
    );
};