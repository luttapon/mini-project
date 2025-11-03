// app/change-password/page.tsx
'use client'; // ต้องเป็น Client Component เพราะเราใช้ state และ event handlers

import { supabase } from '@/lib/supabase/client';
import React, { useState, useEffect  } from 'react';

// --- (1) สร้าง Component ย่อยสำหรับ Input Password ---
// เพื่อให้สามารถนำกลับมาใช้ซ้ำได้ (Current, New, Confirm)
interface PasswordInputProps {
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({ label, id, value, onChange, autoComplete = "off" }) => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 ">
        {label}
      </label>
      <div className="relative">
        <input
          type={isVisible ? 'text' : 'password'}
          id={id}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" // pr-10 เพื่อเว้นที่ให้ไอคอน
        />
        <button
          type="button"
          onClick={toggleVisibility}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
          aria-label={isVisible ? "Hide password" : "Show password"}
        >
          {isVisible ? (
            // ไอคอน "ซ่อน" (EyeOff)
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243l-4.243-4.243" />
            </svg>
          ) : (
            // ไอคอน "แสดง" (Eye)
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.01 9.963 7.182.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.01-9.963-7.182z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};


// --- (2) หน้าหลักสำหรับ Change Password ---
export default function ChangePasswordPage() {
  // State สำหรับเก็บค่า Input
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State สำหรับข้อความ Error และ Success
  const [message, setMessage] = useState(''); 
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isAuthorized, setIsAuthorized] = useState(false);

  // 5. useEffect เพื่อตรวจสอบว่าผู้ใช้ผ่านหน้า OTP มาจริง
  useEffect(() => {
    if (!supabase) {
        setMessage('เกิดข้อผิดพลาด: ไม่ได้ตั้งค่า Supabase URL และ Anon Key ในโค้ด');
        setIsError(true);
        return;
    }
    
    const checkSession = async () => {
        // เมื่อผู้ใช้ verifyOtp สำเร็จ เขาจะอยู่ในสถานะ "Login" (มี session)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            setMessage(`เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์: ${error.message}`);
            setIsError(true);
        } else if (!session) {
            // ถ้าไม่มี session (ผู้ใช้ไม่ได้ผ่านหน้า OTP มา)
            setMessage('คุณไม่ได้รับอนุญาตให้เข้าหน้านี้ กรุณาเริ่มต้นใหม่');
            setIsError(true);
            // ส่งกลับไปหน้าแรก (password-reset-form)
            setTimeout(() => {
                window.location.href = `http://localhost:3000/password-reset`; // (หรือ path หน้าแรกของคุณ)
            }, 3000);
        } else {
            // มี session = ได้รับอนุญาต
            setIsAuthorized(true);
            setMessage('คุณยืนยันตัวตนสำเร็จแล้ว กรุณาตั้งรหัสผ่านใหม่');
            setIsError(false); // ตั้งเป็น false (สีเขียว)
        }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setIsError(false);

    // --- การตรวจสอบ (ลบส่วน currentPassword) ---
    if (!newPassword || !confirmPassword) {
      setMessage('กรุณากรอกรหัสผ่านใหม่ และยืนยันรหัสผ่าน');
      setIsError(true);
      setIsLoading(false);
      return;
    }
    if (newPassword.length < 8) {
      setMessage('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
      setIsError(true);
      setIsLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน');
      setIsError(true);
      setIsLoading(false);
      return;
    }
    // --- จบการตรวจสอบ ---

    if (!supabase) {
      setMessage('เกิดข้อผิดพลาด: การตั้งค่า Supabase ไม่ถูกต้อง');
      setIsError(true);
      setIsLoading(false);
      return;
    }

    // --- 7. เรียก Supabase API ---
    try {
        // อัปเดตรหัสผ่านของผู้ใช้ที่ login อยู่ (ซึ่งคือผู้ใช้ที่เพิ่งผ่าน OTP มา)
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (updateError) {
            throw updateError;
        }

        setMessage('✅ อัปเดตรหัสผ่านสำเร็จ! กำลังนำคุณกลับไปหน้าหลัก...');
        setIsError(false);
        setIsLoading(false);
        
        // เคลียร์ค่า
        setNewPassword('');
        setConfirmPassword('');

        // ส่งกลับไปหน้า Home (/)
        setTimeout(() => {
          window.location.href = '/'; // (หรือหน้า Login ที่คุณต้องการ)
        }, 2500);

    } catch (err: unknown) {
      console.error('Update password error:', err);
      let errorMessage = 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setMessage(`เกิดข้อผิดพลาด: ${errorMessage}`);
      setIsError(true);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        
        <h1 className="text-2xl font-bold text-center ">ตั้งรหัสผ่านใหม่</h1>

        {/* แสดงข้อความ Error/Success/Info */}
        {message && (
          <div className={`p-3 rounded-lg text-sm font-medium break-words ${
            isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}

        {/* คำเตือนหากยังไม่ได้ตั้งค่า Supabase */}
        {(!supabase && !message) && (
            <div className="p-1 mb-4 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-800">
                <strong>คำเตือน:</strong> กรุณาตั้งค่า <code>YOUR_SUPABASE_URL</code> และ <code>YOUR_SUPABASE_ANON_KEY</code> ในโค้ด
            </div>
        )}

        {/* เราจะแสดงฟอร์มเฉพาะเมื่อ
          1. ได้รับอนุญาต (ผ่าน OTP มาแล้ว)
          2. Supabase พร้อมใช้งาน
        */}
        {isAuthorized && supabase && (
            <form onSubmit={handleSubmit}>
                
                    <PasswordInput 
                        label="รหัสผ่านใหม่"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                    />
                    {/* คำแนะนำความปลอดภัยรหัสผ่าน */}
                    <div className="-mt-5 -ml-11.5 text-sm text-gray-500">
                    รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร
                    </div>
                
              <PasswordInput 
                label="ยืนยันรหัสผ่านใหม่"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />

              {/* ปุ่ม Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-lg text-white font-semibold shadow-lg transition duration-300 ease-in-out mt-2 ${
                    (isLoading)
                      ? 'bg-indigo-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transform hover:scale-[1.01]'
                }`}
              >
                {isLoading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
              </button>
            </form>
        )}
        
      </div>
    </div>
  );
}