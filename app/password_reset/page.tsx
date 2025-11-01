"use client";
import React, { useState } from 'react';

import { useRouter } from 'next/navigation';

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
const InputField = ({ icon, type, value, onChange, placeholder, required = true }: InputFieldProps) => (
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
const App = () => {
  // --- สถานะ (State) สำหรับเก็บค่าอีเมล ---
  const [email, setEmail] = useState('');

  // --- สถานะสำหรับข้อความแสดงผลลัพธ์หรือข้อผิดพลาด ---
  const [message, setMessage] = useState(''); 
  const [isError, setIsError] = useState(false);

  // --- ฟังก์ชันจัดการการส่งคำขอรีเซ็ตรหัสผ่าน ---
  const handleResetPassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // ป้องกันการรีโหลดหน้าเว็บของฟอร์ม

    // ตรวจสอบว่ามีอีเมลถูกป้อนหรือไม่
    if (!email) {
      setMessage('กรุณากรอกอีเมลที่ใช้ลงทะเบียน');
      setIsError(true);
      return;
    }

    // --- Logic การส่งคำขอรีเซ็ตรหัสผ่าน  ---
    // ส่งอีเมลนี้ไปยัง Backend เพื่อให้ระบบส่งลิงก์รีเซ็ตไปให้ผู้ใช้
    console.log(`Sending password reset link to: ${email}`);

    // จำลองผลลัพธ์ที่สำเร็จ
    setMessage(`✅ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยัง ${email} แล้ว กรุณาตรวจสอบอีเมลของคุณ`);
    setIsError(false);

    // รีเซ็ตค่าอีเมลหลังจากส่ง
    setEmail('');
  };
  
  // --- Inline SVG Icons (Mail Icon) ---
  const MailIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
  );

    // --- ฟังก์ชันจัดการการเปลี่ยนเส้นทางไปยังหน้าลงทะเบียน ---
    const router = useRouter();
  const handleGoRegister = () => {
        // ใช้ router.push('/register') เพื่อเปลี่ยนเส้นทางไปยังหน้า register
        router.push('/register');
    };

     // กำหนดแหล่งที่มาของภาพพื้นหลัง 
    const imagePathFromPublic = '/bg.png'; // ใช้ภาพจากโฟลเดอร์ public
    const backgroundImageSource = imagePathFromPublic;


  return (
    // คอนเทนเนอร์หลัก: จัดให้อยู่กึ่งกลางของหน้าจอ
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImageSource})`, fontFamily: 'Inter, sans-serif' }}>
      {/* กล่องสีขาว: Card สำหรับแบบฟอร์ม */}
      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-xl shadow-2xl border border-gray-200">

        {/* หัวข้อ: รีเซ็ตรหัสผ่าน */}
        <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-4">
          รีเซ็ตรหัสผ่าน
        </h1>
        
        {/* คำอธิบาย */}
        <p className="text-center text-gray-500 mb-6 text-sm">
            กรุณากรอกอีเมลที่คุณใช้ลงทะเบียนเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่
        </p>

        {/* แสดงข้อความสถานะ/แจ้งเตือน */}
        {message && (
          <div className={`p-3 mb-4 rounded-lg text-sm font-medium ${
            isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message}
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
            disabled={!email}
            className={`w-full py-3 rounded-lg text-white font-semibold shadow-lg transition duration-300 ease-in-out mt-2 ${
              !email
                ? 'bg-indigo-300 cursor-not-allowed' // สไตล์เมื่อปุ่มถูกปิดใช้งาน
                : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transform hover:scale-[1.01]' // สไตล์เมื่อปุ่มพร้อมใช้งาน
            }`}
          >
            ส่งลิงก์รีเซ็ต
          </button>
        </form>

        {/* ส่วนท้ายกล่อง: กลับไปหน้าเข้าสู่ระบบ */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500" onClick={handleGoRegister}>← กลับไปหน้าเข้าสู่ระบบ</a>
        </div>

      </div>
    </div>
  );
};

export default App;
