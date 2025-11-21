// app/change-password/page.tsx
"use client"; // ต้องเป็น Client Component เพราะเราใช้ state และ event handlers

import { supabase } from "@/lib/supabase/client";
import React, { useState, useEffect } from "react";

// --- (1) สร้าง Component ย่อยสำหรับ Input Password ---
// เพื่อให้สามารถนำกลับมาใช้ซ้ำได้ (Current, New, Confirm)
interface PasswordInputProps {
  label: string;
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
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        type="password" 
        id={id}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className="w-full pl-3 pr-3 py-2.5 sm:py-3 border-2 border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out placeholder-gray-400 text-sm sm:text-base shadow-sm hover:border-gray-400"
        placeholder="••••••••"
      />
    </div>
  );
};

// --- (2) หน้าหลักสำหรับ Change Password ---
export default function ChangePasswordPage() {
  // State สำหรับเก็บค่า Input
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State สำหรับข้อความ Error และ Success
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isAuthorized, setIsAuthorized] = useState(false);

  // 5. useEffect เพื่อตรวจสอบว่าผู้ใช้ผ่านหน้า OTP มาจริง
  useEffect(() => {
    if (!supabase) {
      setMessage(
        "เกิดข้อผิดพลาด: ไม่ได้ตั้งค่า Supabase URL และ Anon Key ในโค้ด"
      );
      setIsError(true);
      return;
    }

    const checkSession = async () => {
      // เมื่อผู้ใช้ verifyOtp สำเร็จ เขาจะอยู่ในสถานะ "Login" (มี session)
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        setMessage(`เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์: ${error.message}`);
        setIsError(true);
      } else if (!session) {
        // ถ้าไม่มี session (ผู้ใช้ไม่ได้ผ่านหน้า OTP มา)
        setMessage("คุณไม่ได้รับอนุญาตให้เข้าหน้านี้ กรุณาเริ่มต้นใหม่");
        setIsError(true);
        // ส่งกลับไปหน้าแรก (password-reset-form)
        setTimeout(() => {
          window.location.href = `http://localhost:3000/password-reset`; // (หรือ path หน้าแรกของคุณ)
        }, 3000);
      } else {
        // มี session = ได้รับอนุญาต
        setIsAuthorized(true);
        setMessage("คุณยืนยันตัวตนสำเร็จแล้ว กรุณาตั้งรหัสผ่านใหม่");
        setIsError(false); // ตั้งเป็น false (สีเขียว)
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setIsError(false); // --- การตรวจสอบ (ลบส่วน currentPassword) ---

    if (!newPassword || !confirmPassword) {
      setMessage("กรุณากรอกรหัสผ่านใหม่ และยืนยันรหัสผ่าน");
      setIsError(true);
      setIsLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      setMessage("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      setIsError(true);
      setIsLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน");
      setIsError(true);
      setIsLoading(false);
      return;
    }
    // --- จบการตรวจสอบ ---

    if (!supabase) {
      setMessage("เกิดข้อผิดพลาด: การตั้งค่า Supabase ไม่ถูกต้อง");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    // --- 7. เรียก Supabase API ---
    try {
      // อัปเดตรหัสผ่านของผู้ใช้ที่ login อยู่ (ซึ่งคือผู้ใช้ที่เพิ่งผ่าน OTP มา)
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setMessage("✅ อัปเดตรหัสผ่านสำเร็จ! กำลังนำคุณกลับไปหน้าหลัก...");
      setIsError(false);
      setIsLoading(false);

      // เคลียร์ค่า
      setNewPassword("");
      setConfirmPassword("");

      // ส่งกลับไปหน้า Home (/)
      setTimeout(() => {
        window.location.href = "/"; // (หรือหน้า Login ที่คุณต้องการ)
      }, 2500);
    } catch (err: unknown) {
      console.error("Update password error:", err);
      let errorMessage = "เกิดข้อผิดพลาดที่ไม่คาดคิด";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setMessage(`เกิดข้อผิดพลาด: ${errorMessage}`);
      setIsError(true);
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 bg-cover bg-center"
      style={{
        backgroundImage: "url('/wallpaper2.png')",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Overlay เพื่อให้ข้อความอ่านง่ายขึ้น */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      {/* การ์ดหลัก */}
      <div className="w-full max-w-md relative z-10 px-2 sm:px-0">
        <div className="bg-white/50 backdrop-blur-lg p-6 sm:p-8 md:p-10 shadow-2xl rounded-2xl border-2 border-white/30 transform transition duration-500 hover:shadow-indigo-600/30">
          <div className="text-center mb-6 sm:mb-8 space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              ตั้งรหัสผ่านใหม่
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-gray-600 font-medium px-2">
              กรุณากรอกรหัสผ่านใหม่ของคุณ
            </p>
          </div>
          {/* กล่องข้อความแจ้งเตือน */}
          {message && (
            <div
              className={`p-3 mb-4 rounded-lg text-xs sm:text-sm font-semibold ${
                isError
                  ? "bg-red-100 text-red-700 border border-red-300"
                  : "bg-green-100 text-green-700 border border-green-300"
              }`}
            >
              {message}
            </div>
          )}
          {/* คำเตือนหากยังไม่ได้ตั้งค่า Supabase */}
          {!supabase && !message && (
            <div className="p-3 mb-4 rounded-lg text-xs sm:text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
              <strong>คำเตือน:</strong> กรุณาตั้งค่า{" "}
              <code>YOUR_SUPABASE_URL</code> และ{" "}
              <code>YOUR_SUPABASE_ANON_KEY</code> ในโค้ด
            </div>
          )}
          {/* ฟอร์มตั้งรหัสผ่านใหม่ */}
          {isAuthorized && supabase && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
                  รหัสผ่านใหม่
                </label>
                <PasswordInput
                  label=""
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                {/* คำแนะนำความปลอดภัยรหัสผ่าน */}
                <p className="mt-1 text-xs text-gray-500">
                  รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร
                </p>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
                  ยืนยันรหัสผ่านใหม่
                </label>
                <PasswordInput
                  label=""
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {/* ปุ่ม Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 sm:py-3.5 rounded-xl font-bold shadow-lg transition-all duration-300 ease-in-out text-base sm:text-lg mt-6 ${
                  isLoading
                    ? "bg-indigo-300 text-white cursor-not-allowed opacity-50"
                    : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-indigo-600/40 hover:shadow-indigo-600/60 hover:from-indigo-700 hover:to-indigo-800 transform hover:scale-[1.02] cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                }`}
              >
                {isLoading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}