"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface CalendarEvent {
  id: string;
  group_id: string;
  user_id: string | null;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
}

interface AddEventModalProps {
  groupId: string;
  userId: string | null;
  onClose: () => void;
  eventToEdit?: CalendarEvent | null; // ถ้ามี คือต้องแก้ไขกิจกรรม
}

const AddEventModal: React.FC<AddEventModalProps> = ({
  groupId,
  userId,
  onClose,
  eventToEdit = null,
}) => {
  const [title, setTitle] = useState(eventToEdit?.title || "");
  const [description, setDescription] = useState(eventToEdit?.description || "");
  const [startTime, setStartTime] = useState(
    eventToEdit?.start_time ? new Date(eventToEdit.start_time).toISOString().slice(0,16) : ""
  );
  const [endTime, setEndTime] = useState(
    eventToEdit?.end_time ? new Date(eventToEdit.end_time).toISOString().slice(0,16) : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!title || !startTime || !endTime) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    if (!userId) {
      setError("ไม่พบข้อมูลผู้ใช้งาน");
      return;
    }

    setLoading(true);

    try {
      if (eventToEdit) {
        // UPDATE กิจกรรม
        const { error: updateError } = await supabase
          .from("calendar_events")
          .update({
            title,
            description: description || null,
            start_time: new Date(startTime).toISOString(),
            end_time: new Date(endTime).toISOString(),
          })
          .eq("id", eventToEdit.id);
        if (updateError) throw updateError;
      } else {
        // INSERT กิจกรรมใหม่
        const { error: insertError } = await supabase
          .from("calendar_events")
          .insert([{
            group_id: groupId,
            user_id: userId,
            title,
            description: description || null,
            start_time: new Date(startTime).toISOString(),
            end_time: new Date(endTime).toISOString(),
          }]);
        if (insertError) throw insertError;
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "เกิดข้อผิดพลาดที่ไม่คาดคิด");
    } finally {
      setLoading(false);
    }
  };

  // อัปเดต form ถ้า eventToEdit เปลี่ยน
  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description || "");
      setStartTime(new Date(eventToEdit.start_time).toISOString().slice(0,16));
      setEndTime(new Date(eventToEdit.end_time).toISOString().slice(0,16));
    } else {
      setTitle("");
      setDescription("");
      setStartTime("");
      setEndTime("");
    }
  }, [eventToEdit]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-sky-500 to-blue-600 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-white">
            {eventToEdit ? "แก้ไขกิจกรรม" : "เพิ่มวันสำคัญ"}
          </h2>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1 transition-colors">✕</button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700">ชื่อกิจกรรม <span className="text-red-500">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20" required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">รายละเอียด</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 resize-none" rows={3} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700">วันเริ่มต้น <span className="text-red-500">*</span></label>
                <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">วันสิ้นสุด <span className="text-red-500">*</span></label>
                <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20" required />
              </div>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-700 rounded-md">{error}</div>}
            {success && <div className="p-3 bg-green-50 text-green-700 rounded-md">บันทึกสำเร็จ!</div>}

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600">ยกเลิก</button>
              <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-sky-600 text-white hover:bg-sky-700">
                {loading ? "กำลังบันทึก..." : eventToEdit ? "บันทึกการแก้ไข" : "บันทึกกิจกรรม"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEventModal;
