"use client";

import React, {
  useState,
  useRef,
  ChangeEvent,
  KeyboardEvent,
  useEffect,
} from "react";
// นำเข้า Client สำหรับการสื่อสารกับ Supabase
import { supabase } from "@/lib/supabase/client";

export default function VerifyOtpPage() {
  // --- ส่วนจัดการ State (ข้อมูลที่ใช้ในหน้าเว็บ) ---
  // State สำหรับเก็บค่า OTP 6 หลัก โดยเริ่มต้นเป็น Array ว่าง 6 ตัว
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  // State สำหรับเก็บอีเมลผู้ใช้ ซึ่งจะถูกดึงมาจาก URL
  const [email, setEmail] = useState<string>("");
  // State สำหรับเก็บข้อความแจ้งเตือน (Success/Error) ที่จะแสดงบนหน้าจอ
  const [message, setMessage] = useState<string>("");
  // State สถานะ Error: true ถ้ามีข้อผิดพลาด, false ถ้าเป็นข้อความปกติหรือ Success
  const [isError, setIsError] = useState<boolean>(false);
  // State สถานะกำลังโหลด: true เมื่อมีการเรียก API (เช่น กด Submit หรือ Resend)
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ใช้ Ref Array เพื่ออ้างอิงและควบคุมการโฟกัสไปยัง Input แต่ละช่อง (0 ถึง 5)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // --- Effect: ทำงานเมื่อโหลดหน้าเว็บครั้งแรก ---
  useEffect(() => {
    // สร้าง Object เพื่อดึงค่าจาก Query Parameter ใน URL
    const searchParams = new URLSearchParams(window.location.search);
    // ดึงค่า "email"
    const emailFromUrl = searchParams.get("email");
    
    if (emailFromUrl) {
      // หากพบอีเมล ให้อัปเดต State email
      setEmail(emailFromUrl);
    } else {
      // หากไม่พบอีเมล ให้แสดงข้อความ Error
      setMessage("ไม่พบอีเมลใน URL กรุณาลองใหม่");
      setIsError(true);
    }
  }, []); // [] หมายถึง Effect ทำงานเพียงครั้งเดียวเมื่อ Component ถูก Mount

  // --- Logic: จัดการการพิมพ์ในช่อง OTP (handleChange) ---
  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    
    // Guard Clause: ยอมรับเฉพาะตัวเลข 0-9 และความยาวไม่เกิน 1 ตัวอักษร
    if (value.length > 1 || (value && !/^[0-9]$/.test(value))) {
      return;
    }

    // อัปเดตค่าใน State: คัดลอก Array เดิมและแทนที่ค่าที่ตำแหน่งปัจจุบัน
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-Focus: ถ้าพิมพ์ค่าเสร็จและไม่ใช่ช่องสุดท้าย ให้ย้ายเคอร์เซอร์ไปช่องถัดไป
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // --- Logic: จัดการปุ่มกด (handleKeyDown) ---
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    // ตรวจสอบว่าเป็นการกดปุ่ม Backspace ในขณะที่ช่องปัจจุบันว่างเปล่าและไม่ใช่ช่องแรก
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // ย้ายเคอร์เซอร์กลับไปช่องก่อนหน้า
      inputRefs.current[index - 1]?.focus();
    }
  };

  // --- Logic: ส่งข้อมูลยืนยัน OTP (handleSubmit) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // ป้องกันการ Submit แบบดั้งเดิมของ Form
    setIsLoading(true); // ตั้งสถานะเป็นกำลังโหลด
    setMessage(""); // ล้างข้อความแจ้งเตือนเดิม
    setIsError(false);

    // รวม OTP 6 ช่องให้เป็น String เดียว
    const fullOtp = otp.join("");

    // ตรวจสอบความถูกต้องเบื้องต้น (ความยาวต้องเท่ากับ 6)
    if (fullOtp.length !== 6) {
      setMessage("กรุณากรอกรหัส 6 หลักให้ครบถ้วน");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    // ตรวจสอบว่ามี Supabase client และ Email หรือไม่
    if (!supabase || !email) {
      setMessage("เกิดข้อผิดพลาด: ไม่พบอีเมล หรือการตั้งค่า Supabase ไม่ถูกต้อง");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    try {
      // เรียกใช้ Supabase: ส่ง OTP เพื่อยืนยันอีเมล
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email,
        token: fullOtp,
        type: "email", // ระบุประเภทเป็นการยืนยันอีเมล
      });

      if (verifyError) {
        throw verifyError;
      }

      // ยืนยันสำเร็จ: แสดงข้อความ Success และหน่วงเวลาเปลี่ยนหน้า
      setMessage("ยืนยันสำเร็จ! ไปหน้าตั้งรหัสผ่านใหม่");
      setIsError(false);

      setTimeout(() => {
        // เปลี่ยนเส้นทางไปยังหน้าตั้งรหัสผ่านใหม่
        window.location.href = `/new_password`; 
      }, 1500);

    } catch (err: unknown) {
      console.error("Verify OTP error:", err);
      let errorMessage = "เกิดข้อผิดพลาดที่ไม่คาดคิด";
      
      // จัดการข้อความ Error จาก Supabase
      if (err instanceof Error) {
        if (
          err.message.includes("Invalid OTP") ||
          err.message.includes("Invalid verification code") ||
          err.message.includes("expired")
        ) {
          // ข้อความ Error สำหรับรหัสไม่ถูกต้องหรือหมดอายุ
          errorMessage = "รหัส OTP 6 หลักไม่ถูกต้องหรือหมดอายุ";
        } else {
          errorMessage = err.message;
        }
      }
      setMessage(`เกิดข้อผิดพลาด: ${errorMessage}`);
      setIsError(true);
    } finally {
      // ตั้งสถานะเป็นเสร็จสิ้นการโหลดเสมอ
      setIsLoading(false);
    }
  };

  // --- Logic: ขอรหัส OTP ใหม่ (Resend) ---
  const handleResendCode = async () => {
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    // ตรวจสอบว่ามี Supabase client และ Email หรือไม่
    if (!supabase || !email) {
      setMessage("ไม่พบอีเมล, ไม่สามารถส่งรหัสใหม่ได้");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    try {
      // ส่งคำขอ OTP ใหม่ไปที่อีเมล (สำหรับกรณีลืมรหัสผ่าน)
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: { shouldCreateUser: false }, // ตั้งค่าไม่ให้สร้าง User ใหม่หากยังไม่มี
      });

      if (error) {
        throw error;
      }

      setMessage("ส่งรหัส OTP ใหม่สำเร็จแล้ว กรุณาตรวจสอบอีเมล");
      setIsError(false);
      
      // รีเซ็ตช่องกรอกและโฟกัสช่องแรก
      setOtp(new Array(6).fill(""));
      inputRefs.current[0]?.focus();

    } catch (err: unknown) {
      console.error("Resend OTP error:", err);
      let errorMessage = "เกิดข้อผิดพลาดในการส่งรหัสใหม่";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setMessage(`เกิดข้อผิดพลาด: ${errorMessage}`);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // --- Container หลัก: พื้นหลัง Gradient และจัดกึ่งกลาง ---
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-green-500 to-blue-800 relative overflow-hidden">
      
      {/* Layer สีดำจางๆ เพื่อให้อ่านตัวหนังสือง่ายขึ้น */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      {/* --- Card: กล่องแบบฟอร์มหลัก (อยู่เหนือ Layer พื้นหลัง) --- */}
      <div className="w-full max-w-sm relative z-10 px-2 sm:px-0">
        <div className="p-6 sm:p-8 bg-white/60 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-white/30 transform transition duration-500 hover:shadow-blue-600/30">
          
          {/* หัวข้อและคำอธิบาย */}
          <div className="text-center mb-6 sm:mb-8 space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              ยืนยันตัวตน
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 font-medium px-2 leading-relaxed">
              กรุณากรอกรหัส 6 หลักที่เราส่งไปให้ที่อีเมล
            </p>
            {/* แสดงอีเมลที่กำลังดำเนินการ */}
            <p className="text-xs sm:text-sm text-gray-800 font-bold px-2">
              {email}
            </p>
          </div>

          {/* ส่วนแสดงข้อความแจ้งเตือน (Message Box) */}
          {message && (
            <div
              className={`p-3 mb-4 rounded-lg text-xs sm:text-sm font-semibold break-words ${
                isError
                  ? "bg-red-100 text-red-700 border border-red-300" // Style สำหรับ Error
                  : "bg-green-100 text-green-700 border border-green-300" // Style สำหรับ Success
              }`}
            >
              {message}
            </div>
          )}

          {/* แจ้งเตือนสำหรับนักพัฒนาหาก Supabase Config ไม่ถูกต้อง */}
          {!supabase && !message && (
            <div className="p-3 mb-4 rounded-lg text-xs sm:text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
              <strong>คำเตือน:</strong> กรุณาตั้งค่า{" "}
              <code className="font-mono">YOUR_SUPABASE_URL</code> และ{" "}
              <code className="font-mono">YOUR_SUPABASE_ANON_KEY</code> ในโค้ด
            </div>
          )}

          {/* แบบฟอร์มกรอก OTP */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* ช่องกรอกรหัส 6 ช่อง (Input Grid) */}
            <div className="flex justify-center gap-1.5 sm:gap-2 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1} // จำกัดให้กรอกได้ 1 ตัวอักษร
                  value={digit}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  // กำหนด Ref เพื่อควบคุมการโฟกัส
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  placeholder="•"
                  title={`OTP digit ${index + 1}`}
                  aria-label={`OTP digit ${index + 1}`}
                  className="w-10 h-10 sm:w-12 sm:h-12 text-center text-xl sm:text-2xl font-bold border-2 border-gray-300 bg-white rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 shadow-sm hover:border-gray-400"
                />
              ))}
            </div>

            {/* ปุ่มยืนยัน (Submit Button) */}
            <button
              type="submit"
              // กำหนดให้ปุ่ม Disabled หากกำลังโหลด, ไม่มีอีเมล, ไม่มี Supabase, หรือกรอก OTP ไม่ครบ 6 หลัก
              disabled={
                isLoading || !email || !supabase || otp.join("").length < 6
              }
              className={`w-full py-3 sm:py-3.5 rounded-xl font-bold shadow-lg transition-all duration-300 ease-in-out text-base sm:text-lg ${
                isLoading || !email || !supabase || otp.join("").length < 6
                  ? "bg-blue-300 text-white cursor-not-allowed opacity-50" // Style เมื่อ Disabled
                  : "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-600/40 hover:shadow-blue-600/60 hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" // Style เมื่อ Active
              }`}
            >
              {isLoading ? "กำลังตรวจสอบ..." : "ยืนยันรหัส OTP"}
            </button>
          </form>

          {/* ลิงก์กดส่งรหัสใหม่ (Resend Code) */}
          <div className="text-center mt-5 sm:mt-6">
            <button
              onClick={handleResendCode}
              disabled={isLoading || !email || !supabase}
              className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer transition duration-200 underline-offset-2 hover:underline py-2 px-3"
            >
              ไม่ได้รับรหัส? ส่งอีกครั้ง
            </button>
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
}