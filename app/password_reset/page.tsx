"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
// นำเข้า Client สำหรับการสื่อสารกับ Supabase
import { supabase } from "@/lib/supabase/client";

// --- ส่วนกำหนดโครงสร้างข้อมูลของ InputField ---
interface InputFieldProps {
  // รับ ReactNode สำหรับ Icon (เช่น SVG)
  icon: React.ReactNode;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
}

// --- Component ย่อย: ช่องกรอกข้อมูล (Input Field) ---
const InputField = ({
  icon,
  type,
  value,
  onChange,
  placeholder,
  required = true,
}: InputFieldProps) => (
  <div className="relative mb-4">
    {/* ไอคอนด้านซ้าย (แสดงผลเป็น ReactNode) */}
    <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-500">
      {icon}
    </div>
    {/* ช่อง input หลัก */}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border-2 border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out placeholder-gray-400 text-sm sm:text-base shadow-sm hover:border-gray-400"
    />
  </div>
);

// --- Component หลัก: ฟอร์มรีเซ็ตรหัสผ่าน ---
const PasswordResetForm = () => {
  // --- ส่วนจัดการ State ---
  const [email, setEmail] = useState(""); // เก็บค่าอีเมล
  const [message, setMessage] = useState(""); // ข้อความแจ้งเตือน (Success/Error)
  const [isError, setIsError] = useState(false); // สถานะ Error (true/false)
  const [isLoading, setIsLoading] = useState(false); // สถานะกำลังโหลด (Loading spinner)

  const router = useRouter(); // Hook สำหรับจัดการการนำทาง

  // --- Logic: การทำงานเมื่อกดส่งคำขอรีเซ็ต (handleResetPassword) ---
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // ป้องกันการ Submit แบบดั้งเดิม
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    // 1. ตรวจสอบความถูกต้องเบื้องต้น (อีเมลต้องไม่ว่าง)
    if (!email) {
      setMessage("กรุณากรอกอีเมลที่ใช้ลงทะเบียน");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    // 2. ตรวจสอบ Supabase Client
    if (!supabase) {
      setMessage("เกิดข้อผิดพลาด: กรุณาตั้งค่า Supabase URL และ Anon Key ในโค้ด");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    try {
      // 3. เรียกใช้ Supabase: ส่ง OTP (Sign In with OTP) ไปยังอีเมล
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          // สำคัญ: ห้ามสร้าง user ใหม่ ถ้าไม่พบอีเมลในระบบ
          shouldCreateUser: false, 
        },
      });

      if (error) {
        throw error; // ส่ง Error ไปยัง catch block
      } else {
        // 4. สำเร็จ: เปลี่ยนเส้นทางไปหน้า Verify พร้อมแนบอีเมลไปด้วยใน Query Parameter
        window.location.href = `/verify?email=${encodeURIComponent(email)}`;
        setMessage(`✅ ส่งรหัส OTP ไปยัง ${email} แล้ว กำลังนำคุณไปยังหน้ายืนยัน...`);
        setIsError(false);
      }
    } catch (err: unknown) {
      // 5. จัดการ Error
      console.error("Unexpected error:", err);
      let errorMessage = "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง";
      if (err instanceof Error) {
        // หากเป็น Error จาก Supabase (เช่น ไม่พบ user)
        errorMessage = err.message;
      }
      setMessage(errorMessage);
      setIsError(true);
    } finally {
      // 6. ตั้งสถานะ Loading เป็น false เสมอเมื่อจบกระบวนการ
      setIsLoading(false);
    }
  };

  // --- Logic: ปุ่มย้อนกลับไปหน้า Login ---
  const handleGoRegister = () => {
    router.push("/login"); // นำทางไปยังหน้า Login
  };

  // --- SVG Icon (รูปซองจดหมาย) สำหรับ Input Field ---
  const MailIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-mail"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );

  return (
    // --- Container หลัก: พื้นหลัง Gradient และจัดกึ่งกลาง ---
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 bg-linear-to-br from-pink-400 to-yellow-200 relative overflow-hidden">
      
      {/* Layer สีดำจางๆ ช่วยให้อ่านง่ายขึ้น */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      {/* --- Card: กล่องแบบฟอร์มหลัก --- */}
      <div className="w-full max-w-md relative z-10 px-2 sm:px-0">
        <div className="bg-white/60 backdrop-blur-lg p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl border-2 border-white/30 transform transition duration-500 hover:shadow-blue-600/30">
          
          {/* หัวข้อและคำอธิบาย */}
          <div className="text-center mb-6 sm:mb-8 space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              รีเซ็ตรหัสผ่าน
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-gray-600 font-medium px-2 leading-relaxed">
              กรุณากรอกอีเมลที่คุณใช้ลงทะเบียนเพื่อรับ OTP สำหรับตั้งรหัสผ่านใหม่
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

          {/* แจ้งเตือนสำหรับนักพัฒนาหาก Config Supabase ไม่ถูกต้อง */}
          {!supabase && !message && (
            <div className="p-3 mb-4 rounded-lg text-xs sm:text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
              <strong>คำเตือน:</strong> ฟอร์มนี้ยังไม่ได้เชื่อมต่อกับ Supabase
              กรุณาตั้งค่า <code className="font-mono">supabaseUrl</code> และ{" "}
              <code className="font-mono">supabaseAnonKey</code> ในโค้ด
            </div>
          )}

          {/* แบบฟอร์ม */}
          <form onSubmit={handleResetPassword} className="space-y-4">
            
            {/* ช่องกรอกอีเมล */}
            <div>
              <label htmlFor="email-input" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
                อีเมล
              </label>
              <InputField
                icon={MailIcon}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
              />
            </div>

            {/* ปุ่มกดส่ง OTP */}
            <button
              type="submit"
              // ปุ่มถูก Disabled ถ้าไม่มีอีเมล, กำลังโหลด หรือ Supabase ไม่พร้อม
              disabled={!email || isLoading || !supabase}
              className={`w-full py-3 sm:py-3.5 rounded-xl font-bold shadow-lg transition-all duration-300 ease-in-out text-base sm:text-lg mt-6 ${
                !email || isLoading || !supabase
                  ? "bg-blue-300 text-white cursor-not-allowed opacity-50" // Style เมื่อ Disabled
                  : "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-600/40 hover:shadow-blue-600/60 hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" // Style เมื่อ Active
              }`}
            >
              {isLoading ? "กำลังส่ง..." : "ส่งรหัส OTP"}
            </button>
          </form>

          {/* ลิงก์ย้อนกลับไปหน้า Login */}
          <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-700 font-medium">
            <a
              href="#"
              className="font-bold text-blue-600 hover:text-blue-800 transition duration-200 underline-offset-2 hover:underline inline-flex items-center gap-1"
              onClick={handleGoRegister}
            >
              <span>←</span>
              <span>กลับไปหน้าเข้าสู่ระบบ</span>
            </a>
          </div>

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
};

export default PasswordResetForm;