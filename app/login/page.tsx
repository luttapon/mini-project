"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
// ใช้ Supabase client จริง
import { supabase } from "@/lib/supabase/client"; 

// --- กำหนดโครงสร้างข้อมูลสำหรับข้อความแจ้งเตือน ---
interface MessageState {
  text: string;
  type: "success" | "error" | ""; // ประเภทข้อความ: สำเร็จ, ผิดพลาด, หรือว่าง
}

// --- Component หลัก: หน้าเข้าสู่ระบบ (App Component) ---
const App: React.FC = () => {
  // --- ส่วนจัดการ State ---
  // เก็บค่าอีเมล (ใช้ชื่อตัวแปร username ตามโค้ดเดิม)
  const [username, setUsername] = useState<string>(""); 
  // เก็บค่ารหัสผ่าน
  const [password, setPassword] = useState<string>(""); 
  // สถานะกำลังโหลด (สำหรับปุ่ม Submit)
  const [loading, setLoading] = useState<boolean>(false); 

  // เก็บข้อความแจ้งเตือน (Success/Error)
  const [message, setMessage] = useState<MessageState>({ text: "", type: "" });

  const router = useRouter(); // Hook สำหรับการนำทางใน Next.js

  // --- ฟังก์ชันช่วย: แสดงข้อความแจ้งเตือนและซ่อนอัตโนมัติ ---
  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    // ตั้งเวลา 5 วินาทีให้ข้อความหายไป
    setTimeout(() => {
      setMessage({ text: "", type: "" });
    }, 5000);
  };

  // --- Logic: การกดปุ่มเข้าสู่ระบบ (handleSubmit) ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    // เรียกใช้ Supabase Auth เพื่อตรวจสอบรหัสผ่าน
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username, // Supabase ใช้ Email ในฟังก์ชันนี้
      password: password,
    });

    setLoading(false);

    if (error) {
      // กรณีเกิดข้อผิดพลาด (Login ไม่ผ่าน)
      console.error("Login error:", error.message);
      showMessage("อีเมลหรือรหัสผ่านไม่ถูกต้อง", "error");
    } else if (data.user) {
      // กรณีสำเร็จ (Login ผ่าน)
      showMessage("เข้าสู่ระบบสำเร็จ! กำลังไปหน้าหลัก...", "success");

      // หน่วงเวลา 1 วินาที แล้วย้ายไปหน้า Profile
      setTimeout(() => {
        router.push("/profile");
        router.refresh(); // บังคับโหลดข้อมูลใหม่ให้เป็นปัจจุบัน
      }, 1000);
    }
  };

  // --- Logic: การนำทางไปยังหน้าอื่นๆ ---
  const handleGoBack = () => {
    router.push("/"); // กลับหน้าแรก
  };

  const handleGoRegister = () => {
    router.push("/register"); // ไปหน้าลงทะเบียน
  };

  const handleGopasswordreset = () => {
    router.push("/password_reset"); // ไปหน้าลืมรหัสผ่าน
  };

  // กำหนด Tailwind Classes สำหรับกล่องข้อความตามประเภท (เขียว/แดง)
  const messageClasses =
    message.type === "success"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";

  // ตัวแปรสำหรับรูปภาพพื้นหลัง (ใช้ตามโค้ดเดิม)
  // const imagePathFromPublic = "/wallpaper4.jpg"; // ไม่ได้ใช้ใน JSX
  // const backgroundImageSource = imagePathFromPublic; // ไม่ได้ใช้ใน JSX

  return (
    // --- Container หลัก: พื้นหลัง Gradient และจัดกึ่งกลาง ---
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-cyan-500 to-purple-500 relative overflow-hidden">
      
      {/* Layer สีดำจางๆ ช่วยให้อ่านง่ายขึ้น */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      <div className="w-full max-w-md relative z-10 px-2 sm:px-0">
        
        {/* ปุ่มย้อนกลับ */}
        <button
          type="button"
          onClick={handleGoBack}
          aria-label="ย้อนกลับไปหน้าหลัก"
          className="flex items-center justify-start mb-4 sm:mb-6 text-gray-600 hover:text-gray-900 transition-all duration-200 p-2 px-3 rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/80 focus:outline-none shadow-sm cursor-pointer border border-gray-200"
        >
          {/* SVG Icon สำหรับปุ่มย้อนกลับ */}
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 mr-1 sm:mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            ></path>
          </svg>
          <span className="text-sm sm:text-base font-semibold">ย้อนกลับ</span>
        </button>

        {/* --- Card: กล่องแบบฟอร์มหลัก --- */}
        <div className="bg-white/70 backdrop-blur-xl p-6 sm:p-8 md:p-10 shadow-2xl rounded-2xl border border-white/50 transform transition duration-500 hover:shadow-indigo-600/10">
          
          {/* แสดงข้อความแจ้งเตือน (ถ้ามี) */}
          {message.text && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm text-center font-medium ${messageClasses}`}
            >
              {message.text}
            </div>
          )}

          {/* หัวข้อและคำอธิบาย */}
          <div className="text-center mb-6 sm:mb-8 space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              เข้าสู่ระบบ
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-gray-600 font-medium px-2">
              โปรดกรอกรายละเอียดเพื่อดำเนินการต่อ
            </p>
          </div>

          {/* แบบฟอร์ม Login */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* ช่องกรอกอีเมล */}
            <div className="mb-4 sm:mb-5">
              <label
                htmlFor="username"
                className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2"
              >
                อีเมล
              </label>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="example@mail.com"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 bg-white/80 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out placeholder-gray-400 text-sm sm:text-base shadow-sm hover:border-gray-400"
                aria-label="ชื่อผู้ใช้ หรือ อีเมล"
              />
            </div>

            {/* ช่องกรอกรหัสผ่าน */}
            <div className="mb-5 sm:mb-6">
              <label
                htmlFor="password"
                className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2"
              >
                รหัสผ่าน
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 bg-white/80 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out placeholder-gray-400 text-sm sm:text-base shadow-sm hover:border-gray-400"
                aria-label="รหัสผ่าน"
              />
              {/* ลิงก์ลืมรหัสผ่าน */}
              <div className="flex justify-end mt-2 sm:mt-3">
                <a
                  href="#"
                  className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 transition duration-200 ease-in-out underline-offset-2 hover:underline py-1 px-2 rounded"
                  onClick={handleGopasswordreset}
                >
                  ลืมรหัสผ่าน?
                </a>
              </div>
            </div>

            {/* ปุ่มเข้าสู่ระบบ */}
            <button
              type="submit"
              disabled={loading || !username || !password} // ปุ่ม Disabled เมื่อกำลังโหลด หรือกรอกข้อมูลไม่ครบ
              className="w-full py-3 sm:py-3.5 bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/40 hover:shadow-blue-600/60 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-base sm:text-lg cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>

          {/* ลิงก์สมัครสมาชิก */}
          <p className="text-center text-xs sm:text-sm text-gray-700 mt-6 sm:mt-8 font-medium">
            ยังไม่มีบัญชี?{" "}
            <a
              href="#"
              className="font-bold text-blue-600 hover:text-blue-800 transition duration-200 underline-offset-2 hover:underline"
              onClick={handleGoRegister}
            >
              ลงทะเบียนที่นี่
            </a>
          </p>
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

export default App;