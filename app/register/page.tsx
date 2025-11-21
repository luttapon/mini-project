"use client";
import React, { useState } from "react";
import { Mail, User, Lock, LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

// --- InputField Component - ปรับสไตล์ให้เหมือนหน้า Login ---
interface InputFieldProps {
  icon: LucideIcon;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  id: string;
}
const InputField = ({
  icon: Icon,
  type,
  value,
  onChange,
  placeholder,
  required = true,
  id,
}: InputFieldProps) => (
  <div className="relative mb-4">
    {/* ไอคอนด้านซ้ายของ input - ปรับตำแหน่งให้เหมาะสม */}
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      id={id}
      className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border-2 border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out placeholder-gray-400 text-sm sm:text-base shadow-sm hover:border-gray-400"
    />
  </div>
);
// ------------------------------------

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const router = useRouter();

  const handleGoLogin = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    router.push("/login");
  };

  // --- ลงทะเบียน (ฉบับแก้ไข) ---
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      // 1. Sign Up (ส่งแค่ metadata ที่จำเป็นสำหรับ Trigger)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            // Trigger ของคุณจะใช้ username นี้เพื่อสร้างแถวใน public.user
            username: username,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user)
        throw new Error("Registration failed: Missing User ID.");

      // 2. ไม่มีการอัปโหลดไฟล์ในหน้านี้
      // 3. ไม่มีการ .update() ในหน้านี้ (เพราะ User ยังไม่ยืนยันอีเมล)

      setMessage("สำเร็จ! ตรวจสอบอีเมลของคุณเพื่อยืนยัน");
      setEmail("");
      setUsername("");
      setPassword("");
    } catch (err: unknown) {
      let errorMessage = "เกิดข้อผิดพลาดในการลงทะเบียน";
      if (err instanceof Error) errorMessage = err.message;
      setMessage(errorMessage);
      console.error("Registration Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. --- !! เพิ่ม: กำหนด isFormComplete !! ---
  // (ตรวจสอบว่ากรอกข้อมูลครบทุกช่องหรือยัง)
  const isFormComplete =
    email.trim() !== "" &&
    username.trim() !== "" &&
    password.trim() !== "";

  return (
    // คอนเทนเนอร์หลักที่มีพื้นหลังเป็นรูปภาพ - เพิ่ม padding สำหรับมือถือ
    <div
      className="flex items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 bg-cover bg-center"
      style={{
        backgroundImage: `url("/wallpaper3.png")`,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Overlay เพื่อให้ข้อความอ่านง่ายขึ้น เพิ่มความเข้มเพื่อความคมชัดของตัวอักษร */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      {/* การ์ดหลัก */}
      <div className="w-full max-w-md relative z-10 px-2 sm:px-0">

        <div className="bg-white/50 backdrop-blur-lg p-6 sm:p-8 md:p-10 shadow-2xl rounded-2xl border-2 border-white/30 transform transition duration-500 hover:shadow-indigo-600/30">
          
          {/* หัวข้อและคำบรรยาย */}
          <div className="text-center mb-6 sm:mb-8 space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              ลงทะเบียน
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-gray-600 font-medium px-2">
              โปรดกรอกรายละเอียดเพื่อดำเนินการต่อ
            </p>
          </div>

          {/* กล่องข้อความแจ้งเตือน */}
          {message && (
            <div
              className={`p-3 mb-4 rounded-lg text-xs sm:text-sm font-semibold ${
                message.startsWith("สำเร็จ")
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-red-100 text-red-700 border border-red-300"
              }`}
            >
              {message}
            </div>
          )}

          {/* ฟอร์มลงทะเบียน */}
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Input Fields */}
            <div>
              <label htmlFor="email-input" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
                อีเมล
              </label>
              <InputField
                id="email-input"
                icon={Mail}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
              />
            </div>
            
            <div>
              <label htmlFor="username-input" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
                ชื่อผู้ใช้
              </label>
              <InputField
                id="username-input"
                icon={User}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
              />
            </div>
            
            <div>
              <label htmlFor="password-input" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
                รหัสผ่าน
              </label>
              <InputField
                id="password-input"
                icon={Lock}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {/* ปุ่มลงทะเบียน */}
            <button
              type="submit"
              disabled={!isFormComplete || loading}
              className={`w-full py-3 sm:py-3.5 rounded-xl font-bold shadow-lg transition-all duration-300 ease-in-out text-base sm:text-lg mt-6 ${
                !isFormComplete || loading
                  ? "bg-indigo-300 text-white cursor-not-allowed opacity-50"
                  : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-indigo-600/40 hover:shadow-indigo-600/60 hover:from-indigo-700 hover:to-indigo-800 transform hover:scale-[1.02] cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              }`}
            >
              {loading ? "กำลังลงทะเบียน..." : "ลงทะเบียน"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-5 sm:my-6">
            <hr className="flex-grow border-t border-gray-300" aria-hidden="true" />
            <span className="mx-3 sm:mx-4 text-xs sm:text-sm text-gray-500 font-medium">หรือ</span>
            <hr className="flex-grow border-t border-gray-300" aria-hidden="true" />
          </div>

          {/* ข้อความและลิงก์เข้าสู่ระบบ */}
          <div className="text-center text-xs sm:text-sm text-gray-700 font-medium">
            มีบัญชีอยู่แล้ว?{" "}
            <a
              href="/login"
              className="font-bold text-indigo-600 hover:text-indigo-800 transition duration-200 underline-offset-2 hover:underline"
              onClick={handleGoLogin}
            >
              เข้าสู่ระบบ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;