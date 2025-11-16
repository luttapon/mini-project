"use client";
import React, { useState } from "react";
import { Mail, User, Lock, LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";


// --- InputField Component (เหมือนเดิม) ---
interface InputFieldProps {
  icon: LucideIcon;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  id: string;
}
const InputField = ({ icon: Icon, type, value, onChange, placeholder, required = true, id }: InputFieldProps) => (
  <div className="relative mb-4">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      id={id}
      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out placeholder-gray-500 shadow-sm"
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

  // --- !! ลบ File States และ File Handlers ทั้งหมด !! ---
  // (ลบ profileImage, profilePreview, backgroundImage, backgroundPreview)
  // (ลบ handleProfileImageChange, handleBackgroundImageChange)
  // (ลบ uploadFile helper)

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
            username: username 
          } 
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Registration failed: Missing User ID.");

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


  return (
    <div
      className="flex items-center justify-center min-h-screen p-4 sm:p-6 bg-cover bg-center"
      style={{
        backgroundImage: `url("/homepage.png")`, // ใช้ Default Background ของหน้า
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl shadow-2xl border border-gray-200">
        <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-3">ลงทะเบียน</h1>
        <p className="mt-2 text-sm text-gray-500 text-center mb-6">
          โปรดกรอกรายละเอียดเพื่อดำเนินการต่อ
        </p>

        {message && (
          <div
            className={`p-3 mb-4 rounded-lg text-sm font-medium ${
              message.startsWith("สำเร็จ") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* --- !! ลบ JSX ของการอัปโหลดไฟล์ออก !! --- */}
        <form onSubmit={handleRegister} className="space-y-6">

          {/* Inputs */}
          <InputField id="email-input" icon={Mail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="อีเมล (Email)" />
          <InputField id="username-input" icon={User} type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ชื่อผู้ใช้ (Username)" />
          <InputField id="password-input" icon={Lock} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="รหัสผ่าน (Password)" />

          <button
            type="submit"
            disabled={!isFormComplete || loading}
            className={`w-full py-3 rounded-lg text-white font-semibold shadow-lg transition duration-300 ease-in-out ${
              !isFormComplete || loading
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transform hover:scale-[1.01] cursor-pointer"
            }`}
          >
            {loading ? "กำลังลงทะเบียน..." : "ลงทะเบียน"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <hr className="flex-grow border-t border-gray-300" aria-hidden="true" />
          <span className="mx-4 text-gray-500">หรือ</span>
          <hr className="flex-grow border-t border-gray-300" aria-hidden="true" />
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          มีบัญชีอยู่แล้ว?
          <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 ml-1" onClick={handleGoLogin}>
            เข้าสู่ระบบ
          </a>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;