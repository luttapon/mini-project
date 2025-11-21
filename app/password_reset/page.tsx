"use client";
import React, { useState } from "react";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

// --- Interface สำหรับ Props ของ InputField (ใช้ร่วมกับไฟล์ลงทะเบียน) ---
interface InputFieldProps {
  icon: React.ReactNode; // ใช้ React.ReactNode สำหรับ Inline SVG Icons
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // กำหนดประเภทของฟังก์ชัน onChange
  placeholder: string;
  required?: boolean;
}

// --- คอมโพเนนต์ย่อยสำหรับช่องป้อนข้อมูล - ปรับสไตล์ให้เหมือนหน้า Login ---
const InputField = ({
  icon,
  type,
  value,
  onChange,
  placeholder,
  required = true,
}: InputFieldProps) => (
  <div className="relative mb-4">
    {/* แสดง Icon ที่ถูกส่งเข้ามาเป็น Prop - ปรับขนาดตามหน้าจอ */}
    <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-500">
      {icon}
    </div>
    {/* Input Field - ใช้ border-2 และปรับ padding ให้เหมาะกับมือถือ */}
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

// คอมโพเนนต์หลักของหน้า Password Reset
const PasswordResetForm = () => {
  // --- สถานะ (State) สำหรับเก็บค่าอีเมล ---
  const [email, setEmail] = useState("");

  // --- สถานะสำหรับข้อความแสดงผลลัพธ์หรือข้อผิดพลาด ---
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- ฟังก์ชันจัดการการส่งคำขอรีเซ็ตรหัสผ่าน ---
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    if (!email) {
      setMessage("กรุณากรอกอีเมลที่ใช้ลงทะเบียน");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    // 4. ตรวจสอบ Supabase client (จากโค้ดของคุณ)
    if (!supabase) {
      setMessage(
        "เกิดข้อผิดพลาด: กรุณาตั้งค่า Supabase URL และ Anon Key ในโค้ด"
      );
      setIsError(true);
      setIsLoading(false);
      return;
    }

    // --- ตรรกะการเรียก Supabase API (OTP) (คงเดิม) ---
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        throw error;
      } else {
        // 5. ใช้ window.location.href (จากโค้ดของคุณ)
        window.location.href = `/verify?email=${encodeURIComponent(
          email
        )}`;
        setMessage(
          `✅ ส่งรหัส OTP ไปยัง ${email} แล้ว กำลังพคุณไปยังหน้ายืนยัน...`
        );
        setIsError(false);
      }
    } catch (err: unknown) {
      console.error("Unexpected error:", err);
      let errorMessage = "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setMessage(errorMessage);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Inline SVG Icons (Mail Icon) ---
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

  // --- ฟังก์ชันจัดการการเปลี่ยนเส้นทางไปยังหน้าลงทะเบียน ---
  const router = useRouter();
  const handleGoRegister = () => {
    // ใช้ router.push('/register') เพื่อเปลี่ยนเส้นทางไปยังหน้า register
    router.push("/login");
  };

  // กำหนดแหล่งที่มาของภาพพื้นหลัง
  const imagePathFromPublic = "/bg.png"; // ใช้ภาพจากโฟลเดอร์ public
  const backgroundImageSource = imagePathFromPublic;

  return (
    // คอนเทนเนอร์หลัก: จัดให้อยู่กึ่งกลางของหน้าจอ - เพิ่ม padding สำหรับมือถือ
    <div
      className="flex items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 bg-cover bg-center"
      style={{
        backgroundImage: `url(${backgroundImageSource})`,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Overlay เพื่อให้ข้อความอ่านง่ายขึ้น เพิ่มความเข้มเพื่อความคมชัดของตัวอักษร */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      {/* กล่องสีขาว Card สำหรับแบบฟอร์ม */}
      <div className="w-full max-w-md relative z-10 px-2 sm:px-0">
        <div className="bg-white/60 backdrop-blur-lg p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl border-2 border-white/30 transform transition duration-500 hover:shadow-blue-600/30">
        {/* หัวข้อและคำบรรยาย */}
        <div className="text-center mb-6 sm:mb-8 space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            รีเซ็ตรหัสผ่าน
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-gray-600 font-medium px-2 leading-relaxed">
            กรุณากรอกอีเมลที่คุณใช้ลงทะเบียนเพื่อรับ OTP สำหรับตั้งรหัสผ่านใหม่
          </p>
        </div>

        {/* แสดงข้อความสถานะ/แจ้งเตือน */}
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
        {/* แสดงคำเตือนหากยังไม่ได้ตั้งค่า Supabase */}
        {!supabase && !message && (
          <div className="p-3 mb-4 rounded-lg text-xs sm:text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
            <strong>คำเตือน:</strong> ฟอร์มนี้ยังไม่ได้เชื่อมต่อกับ Supabase
            กรุณาตั้งค่า <code className="font-mono">supabaseUrl</code> และ{" "}
            <code className="font-mono">supabaseAnonKey</code> ในโค้ด
          </div>
        )}

        {/* แบบฟอร์มรีเซ็ต */}
        <form onSubmit={handleResetPassword} className="space-y-4">
          {/* ช่องป้อนอีเมล */}
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

          {/* ปุ่มส่งคำขอรีเซ็ต */}
          <button
            type="submit"
            disabled={!email || isLoading || !supabase}
            className={`w-full py-3 sm:py-3.5 rounded-xl font-bold shadow-lg transition-all duration-300 ease-in-out text-base sm:text-lg mt-6 ${
              !email || isLoading || !supabase
                ? "bg-blue-300 text-white cursor-not-allowed opacity-50"
                : "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-600/40 hover:shadow-blue-600/60 hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            }`}
          >
            {isLoading ? "กำลังส่ง..." : "ส่งรหัส OTP"}
          </button>
        </form>

        {/* ส่วนท้ายกล่อง กลับไปหน้าเข้าสู่ระบบ */}
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
    </div>
  );
};

export default PasswordResetForm;
