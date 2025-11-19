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

// --- คอมโพเนนต์ย่อยสำหรับช่องป้อนข้อมูล (Input Field) ---
const InputField = ({
  icon,
  type,
  value,
  onChange,
  placeholder,
  required = true,
}: InputFieldProps) => (
  <div className="relative mb-4">
    {/* แสดง Icon ที่ถูกส่งเข้ามาเป็น Prop */}
    <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400">
      {icon}
    </div>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out placeholder-gray-500 shadow-sm"
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
    // คอนเทนเนอร์หลัก: จัดให้อยู่กึ่งกลางของหน้าจอ
    <div
      className="flex items-center justify-center min-h-screen p-4 sm:p-6 bg-cover bg-center"
      style={{
        backgroundImage: `url(${backgroundImageSource})`,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* กล่องสีขาว: Card สำหรับแบบฟอร์ม */}
      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-xl shadow-2xl border border-gray-200">
        {/* หัวข้อ: รีเซ็ตรหัสผ่าน */}
        <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-4">
          รีเซ็ตรหัสผ่าน
        </h1>

        {/* คำอธิบาย */}
        <p className="text-center text-gray-500 mb-6 text-sm">
          กรุณากรอกอีเมลที่คุณใช้ลงทะเบียนเพื่อรับOTPสำหรับตั้งรหัสผ่านใหม่
        </p>

        {/* แสดงข้อความสถานะ/แจ้งเตือน */}
        {message && (
          <div
            className={`p-3 mb-4 rounded-lg text-sm font-medium ${
              isError
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message}
          </div>
        )}
        {/* แสดงคำเตือนหากยังไม่ได้ตั้งค่า Supabase */}
        {!supabase && !message && (
          <div className="p-3 mb-4 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-800">
            <strong>คำเตือน:</strong> ฟอร์มนี้ยังไม่ได้เชื่อมต่อกับ Supabase
            กรุณาตั้งค่า <code>supabaseUrl</code> และ{" "}
            <code>supabaseAnonKey</code> ในโค้ด
          </div>
        )}

        {/* แบบฟอร์มรีเซ็ต */}
        <form onSubmit={handleResetPassword}>
          {/* ช่องป้อนอีเมล */}
          <InputField
            icon={MailIcon} // ส่ง Inline SVG เข้าไปแทน
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="อีเมล (Email)"
          />

          {/* ปุ่มส่งคำขอรีเซ็ต */}
          <button
            type="submit"
            // ปุ่มจะใช้งานได้เมื่อมีอีเมลถูกป้อน
            disabled={!email || isLoading || !supabase}
            className={`w-full py-3 rounded-lg text-white font-semibold shadow-lg transition duration-300 ease-in-out mt-2 ${
              !email || isLoading || !supabase
                ? "bg-indigo-300 cursor-not-allowed" // สไตล์เมื่อปุ่มถูกปิดใช้งาน
                : "bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transform hover:scale-[1.01] cursor-pointer" // สไตล์เมื่อปุ่มพร้อมใช้งาน
            }`}
          >
            {isLoading ? "กำลังส่ง..." : "ส่งรหัส OTP"}
          </button>
        </form>

        {/* ส่วนท้ายกล่อง: กลับไปหน้าเข้าสู่ระบบ */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <a
            href="#"
            className="font-medium text-indigo-600 hover:text-indigo-500"
            onClick={handleGoRegister}
          >
            ← กลับไปหน้าเข้าสู่ระบบ
          </a>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetForm;
