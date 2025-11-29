"use client";

import React, { useState, useEffect } from "react";
// นำเข้า Icon สำหรับการซ่อน/แสดงรหัสผ่าน
import { Eye, EyeOff } from "lucide-react";
// ใช้ Supabase client จริงที่นำเข้าจาก lib
import { supabase } from "@/lib/supabase/client"; 

// --- PasswordInput Component - ช่องกรอกรหัสผ่านพร้อมปุ่มสลับการมองเห็น ---
interface PasswordInputProps {
  label?: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  id,
  value,
  onChange,
  autoComplete = "off",
}) => {
  // State จัดการการมองเห็นรหัสผ่าน
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  // กำหนด type ของ Input ตามสถานะการมองเห็น (text หรือ password)
  const inputType = isPasswordVisible ? "text" : "password";
  // เลือก Icon ตามสถานะการมองเห็น
  const VisibilityIcon = isPasswordVisible ? EyeOff : Eye;

  return (
    <div>
      {/* Label สำหรับช่องกรอกข้อมูล */}
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {/* ช่อง input หลัก */}
        <input
          type={inputType}
          id={id}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder="••••••••"
          className="w-full pl-3 pr-10 sm:pr-12 py-2.5 sm:py-3 border-2 border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out placeholder-gray-400 text-sm sm:text-base shadow-sm hover:border-gray-400"
        />
        {/* ปุ่มสลับการมองเห็นรหัสผ่าน */}
        <button
          type="button"
          onClick={() => setIsPasswordVisible(!isPasswordVisible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 transition duration-150 focus:outline-none"
          aria-label={isPasswordVisible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        >
          <VisibilityIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
    </div>
  );
};

// --- ChangePasswordPage Component (หน้าหลัก) ---
export default function ChangePasswordPage() {
  // State สำหรับเก็บรหัสผ่านใหม่และการยืนยัน
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State สำหรับ UI และสถานะการทำงาน
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // State ตรวจสอบสิทธิ์: ถ้ามี session (มาจากการรีเซ็ต) จะเป็น true
  const [isAuthorized, setIsAuthorized] = useState(false);

  // --- Effect: ตรวจสอบสิทธิ์เมื่อโหลดหน้าเว็บ ---
  useEffect(() => {
    const checkSession = async () => {
      // ดึง Session จาก Supabase (สำหรับลิงก์รีเซ็ตรหัสผ่าน)
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        // กรณี Supabase Error
        setMessage(`เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์: ${error.message}`);
        setIsError(true);
      } else if (!session) {
        // กรณีไม่มี Session (ไม่ได้รับอนุญาตให้เข้าถึง)
        setMessage("คุณไม่ได้รับอนุญาตให้เข้าหน้านี้ กรุณาเริ่มต้นใหม่");
        setIsError(true);
        // สามารถเพิ่มโค้ด Redirect ไปหน้า Login/Reset ได้จริงตรงนี้
        setTimeout(() => console.log("Redirecting to password reset page..."), 3000); 
      } else {
        // กรณีมี Session (อนุญาตให้ตั้งรหัสผ่านใหม่ได้)
        setIsAuthorized(true);
        setMessage("คุณยืนยันตัวตนสำเร็จแล้ว กรุณาตั้งรหัสผ่านใหม่");
        setIsError(false);
      }
    };
    // เรียกใช้ฟังก์ชันตรวจสอบ Session ทันที
    checkSession();
  }, []); // ทำงานเพียงครั้งเดียวเมื่อ Component ถูก Mount

  // --- Logic: การทำงานเมื่อกดบันทึกรหัสผ่านใหม่ (handleSubmit) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    // 1. ตรวจสอบข้อมูลไม่ว่าง
    if (!newPassword || !confirmPassword) {
      setMessage("กรุณากรอกรหัสผ่านใหม่ และยืนยันรหัสผ่าน");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    // 2. ตรวจสอบความยาวรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
    if (newPassword.length < 6) {
      setMessage("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    // 3. ตรวจสอบรหัสผ่านตรงกัน
    if (newPassword !== confirmPassword) {
      setMessage("รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    try {
      // 4. เรียกใช้ Supabase: อัปเดตรหัสผ่านของผู้ใช้ปัจจุบัน
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError; // ส่ง Error ไปยัง catch block

      // 5. อัปเดตสำเร็จ
      setMessage("✅ อัปเดตรหัสผ่านสำเร็จ! กำลังนำคุณกลับไปหน้าหลัก...");
      setIsError(false);
      setIsLoading(false);
      // ล้างค่าในฟอร์ม
      setNewPassword("");
      setConfirmPassword("");

      // จำลองการ Redirect
      setTimeout(() => console.log("Redirecting to home page..."), 2500); 
    } catch (err: unknown) {
      // 6. จัดการ Error
      console.error("Update password error:", err);
      let errorMessage = "เกิดข้อผิดพลาดที่ไม่คาดคิด";
      if (err instanceof Error) errorMessage = err.message;
      setMessage(`เกิดข้อผิดพลาด: ${errorMessage}`);
      setIsError(true);
      setIsLoading(false);
    }
  };

  return (
    // --- Container หลัก: พื้นหลัง Gradient และจัดกึ่งกลาง ---
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-yellow-200 to-green-600 relative overflow-hidden">
      {/* Overlay สีดำจางๆ ช่วยให้อ่านง่ายขึ้น */}
      <div className="absolute inset-0 bg-black opacity-50"></div>
      
      {/* --- Card: กล่องแบบฟอร์มหลัก --- */}
      <div className="w-full max-w-md relative z-10 px-2 sm:px-0">
        <div className="bg-white/50 backdrop-blur-lg p-6 sm:p-8 md:p-10 shadow-2xl rounded-2xl border-2 border-white/30 transform transition duration-500 hover:shadow-indigo-600/30">
          
          {/* หัวข้อและคำอธิบาย */}
          <div className="text-center mb-6 sm:mb-8 space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              ตั้งรหัสผ่านใหม่
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-gray-600 font-medium px-2">
              กรุณากรอกรหัสผ่านใหม่ของคุณ
            </p>
          </div>

          {/* ส่วนแสดงข้อความแจ้งเตือน (Success / Error) */}
          {message && (
            <div
              className={`p-3 mb-4 rounded-lg text-xs sm:text-sm font-semibold ${
                isError
                  ? "bg-red-100 text-red-700 border border-red-300" // Style เมื่อเกิด Error
                  : "bg-green-100 text-green-700 border border-green-300" // Style เมื่อ Success
              }`}
            >
              {message}
            </div>
          )}

          {/* ฟอร์มตั้งรหัสผ่านใหม่ (แสดงเมื่อ isAuthorized เป็น true เท่านั้น) */}
          {isAuthorized && (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* ช่องกรอกรหัสผ่านใหม่ */}
              <div>
                <label htmlFor="newPassword" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
                  รหัสผ่านใหม่
                </label>
                <PasswordInput
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <p className="mt-1 text-xs text-gray-500">รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร</p>
              </div>

              {/* ช่องยืนยันรหัสผ่านใหม่ */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
                  ยืนยันรหัสผ่านใหม่
                </label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              {/* ปุ่มบันทึกรหัสผ่านใหม่ */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 sm:py-3.5 rounded-xl font-bold shadow-lg transition-all duration-300 ease-in-out text-base sm:text-lg mt-6 ${
                  isLoading
                    ? "bg-indigo-300 text-white cursor-not-allowed opacity-50" // Style เมื่อ Disabled
                    : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-indigo-600/40 hover:shadow-indigo-600/60 hover:from-indigo-700 hover:to-indigo-800 transform hover:scale-[1.02] cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" // Style เมื่อ Active
                }`}
              >
                {isLoading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* --- ส่วนพื้นหลัง Animation (Wave Background) --- */}
      <div className="wave-container">
        <div className="wave-blob wave-1"></div>
        <div className="wave-blob wave-2"></div>
        <div className="wave-blob wave-3"></div>
        <div className="wave-blob wave-small-1"></div>
        <div className="wave-blob wave-small-2"></div>
        <div className="wave-blob wave-small-3"></div>
        <div className="wave-blob wave-small-4"></div>
      </div>
    </div>
  );
}