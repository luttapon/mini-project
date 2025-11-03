"use client";
import React, { useState } from "react";
import { Mail, User, Lock, LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabase/client'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle , faFacebookF} from "@fortawesome/free-brands-svg-icons";

// --- Interface สำหรับ Props ของ InputField ---
interface InputFieldProps {
  icon: LucideIcon; // กำหนดให้ icon ต้องเป็นประเภท LucideIcon
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // กำหนดประเภทของฟังก์ชัน onChange
  placeholder: string;
  required?: boolean;
  id: string;
}

// --- คอมโพเนนต์ย่อยสำหรับช่องป้อนข้อมูล (Input Field) ---

// และเพิ่ม InputFieldProps เป็นประเภทของ props
const InputField = ({
  icon: Icon,
  type,
  value,
  onChange,
  placeholder,
  required = true,
}: InputFieldProps) => (
  <div className="relative mb-4">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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

// คอมโพเนนต์หลักของหน้าลงทะเบียน
const App = () => {
  // --- สถานะ (State) สำหรับเก็บค่าในฟอร์ม ---
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // --- สถานะสำหรับข้อความแสดงผลลัพธ์หรือข้อผิดพลาด ---
  const [message, setMessage] = useState("");
  // (isFormComplete ถูกตรวจสอบโดย 'disabled' ของปุ่มแล้ว)

  // --- ฟังก์ชันจัดการการลงทะเบียน (เมื่อกดปุ่ม) ---
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // ป้องกันการรีโหลดหน้าเว็บของฟอร์ม
    setMessage(""); // ล้างข้อความเก่า
    setLoading(true); // เริ่ม loading
    // (isFormComplete ถูกตรวจสอบโดย 'disabled' ของปุ่มแล้ว)
    const { data, error } = await supabase.auth.signUp({
      // ส่งอีเมลและรหัสผ่านไปยัง Supabase
      email: email,
      password: password,
      options: {
        // (สำคัญมาก!) ส่ง 'username' ที่ผู้ใช้กรอก
        // ไปให้ SQL Trigger (handle_new_user)
        // โดยมันจะไปเก็บใน auth.users.raw_user_meta_data
        data: {
          username: username
        }
      }
    });
    setLoading(false);
    if (error) {
      // ถ้าเกิดข้อผิดพลาด (เช่น อีเมลนี้ถูกใช้แล้ว)
      setMessage(` ${error.message}`);
    } else {
      // ถ้าสำเร็จ
      setMessage("สำเร็จ! กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยัน");

      // รีเซ็ตฟอร์ม
      setEmail("");
      setUsername("");
      setPassword("");
    }
  };

   const handleGoogleSignIn = (): void => {
        console.log('Google Sign-In Clicked - Initiating OAuth flow...');
    };

    const handleFacebookSignIn = (): void => {
        console.log('Facebook Sign-In Clicked - Initiating OAuth flow...');
    };
    

  // ตรวจสอบว่าฟอร์มครบถ้วนหรือไม่
  const isFormComplete = email && username && password;

  // ฟังก์ชันเปลี่ยนเส้นทางไปยังหน้าLogin
  const router = useRouter();

  const handleGoLogin = () => {
    router.push("/login");
  };
  // กำหนดแหล่งที่มาของภาพพื้นหลัง
  const imagePathFromPublic = "/homepage.png"; // ใช้ภาพจากโฟลเดอร์ public
  const backgroundImageSource = imagePathFromPublic;



  return (
    // คอนเทนเนอร์หลัก:

    <div
      className="flex items-center justify-center min-h-screen p-4 sm:p-6 bg-cover bg-center"
      style={{
        backgroundImage: `url(${backgroundImageSource})`,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* กล่องสีขาว: Card สำหรับแบบฟอร์ม */}
      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-xl shadow-2xl border border-gray-200">
        {/* หัวข้อ: ลงทะเบียน */}
        <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-3">
          ลงทะเบียน
        </h1>
        <p className="mt-2 text-sm text-gray-500 text-center mb-6">
          โปรดกรอกรายละเอียดเพื่อดำเนินการต่อ
        </p>

        {/* แสดงข้อความสถานะ/แจ้งเตือน */}
        {message && (
          <div
            className={`p-3 mb-4 rounded-lg text-sm font-medium ${message.startsWith("สำเร็จ")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
              }`}
          >
            {message}
          </div>
        )}
        <form onSubmit={handleRegister}>
          {/* แบบฟอร์มลงทะเบียน */}
          <label
            htmlFor="email-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            อีเมล
          </label>
          {/* ช่องป้อนอีเมล */}
          <InputField
            id="email-input"
            icon={Mail}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="อีเมล (Email)"
          />

          {/* ช่องป้อนชื่อผู้ใช้ (Username) */}
          <label
            htmlFor="username-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            ชื่อผู้ใช้
          </label>
          <InputField
            id="username-input"
            icon={User}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ชื่อผู้ใช้ (Username)"
          />

          {/* ช่องป้อนรหัสผ่าน (Password) */}

          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            รหัสผ่าน
          </label>
          <InputField
            id="password-input"
            icon={Lock}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="รหัสผ่าน (Password)"
          />

          {/* ปุ่มลงทะเบียน */}
          <button
            type="submit"
            // ปุ่มจะใช้งานได้เมื่อทั้งฟอร์มมีข้อมูลครบ
            disabled={!isFormComplete || loading}
            className={`w-full py-3 rounded-lg text-white font-semibold shadow-lg transition duration-300 ease-in-out ${!isFormComplete || loading
              ? "bg-indigo-300 cursor-not-allowed" // สไตล์เมื่อปุ่มถูกปิดใช้งาน
              : "bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transform hover:scale-[1.01] cursor-pointer" // สไตล์เมื่อปุ่มพร้อมใช้งาน
              }`}
          >
            {loading ? "กำลังลงทะเบียน..." : "ลงทะเบียน"}
          </button>
        </form>
        {/* ตัวแบ่งแนวนอน */}
        <div className="flex items-center my-6">
          <hr className="flex-grow border-t border-gray-300" aria-hidden="true" />
          <span className="mx-4 text-gray-500">หรือ</span>
          <hr className="flex-grow border-t border-gray-300" aria-hidden="true" />
        </div>

        {/* ปุ่มสำหรับ Social Sign-In  */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150 ease-in-out transform hover:scale-[1.005] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FontAwesomeIcon icon={faGoogle} className="w-5 h-5 mr-3 text-red-500" />
            เข้าสู่ระบบด้วย Google
          </button>

          <button
            onClick={handleFacebookSignIn}
            className="w-full flex items-center justify-center py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-150 ease-in-out transform hover:scale-[1.005] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FontAwesomeIcon icon={faFacebookF} className="w-5 h-5 mr-3" />
            เข้าสู่ระบบด้วย Facebook
          </button>
        </div>

        {/* ไปหน้าเข้าสู่ระบบ */}
        <div className="mt-6 text-center text-sm text-gray-500">
          มีบัญชีอยู่แล้ว?
          <a
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
            onClick={handleGoLogin}
          >
            เข้าสู่ระบบ
          </a>
        </div>
      </div>
    </div>
  );
};

export default App;
