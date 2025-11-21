// app/verify-otp/page.tsx
"use client"; // ต้องเป็น Client Component เพราะเราใช้ state และ event handlers
import React, {
  useState,
  useRef,
  ChangeEvent,
  KeyboardEvent,
  useEffect,
} from "react";
import { supabase } from "@/lib/supabase/client";

export default function VerifyOtpPage() {
  // สร้าง state เพื่อเก็บค่า OTP 6 ตัว
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // สร้าง refs เพื่ออ้างอิงถึง input แต่ละตัว
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const emailFromUrl = searchParams.get("email");
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    } else {
      setMessage("ไม่พบอีเมลในURL กรุณาลองใหม่");
      setIsError(true);
    }
  }, []);
  // ฟังก์ชันเมื่อมีการเปลี่ยนแปลงค่าใน input
  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (value.length > 1 || (value && !/^[0-9]$/.test(value))) {
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // ฟังก์ชันเมื่อกดปุ่มคีย์บอร์ด (สำหรับ Backspace)
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    // ถ้ากด Backspace และช่อง input ว่างเปล่า
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ฟังก์ชันสำหรับ submit (ในที่นี้แค่ log ค่า)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      setMessage("กรุณากรอกรหัส 6 หลักให้ครบถ้วน");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    if (!supabase || !email) {
      setMessage(
        "เกิดข้อผิดพลาด: ไม่พบอีเมล หรือการตั้งค่า Supabase ไม่ถูกต้อง"
      );
      setIsError(true);
      setIsLoading(false);
      return;
    }

    try {
      // ตรวจสอบ OTP
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email,
        token: fullOtp,
        type: "email", // ประเภทต้องตรงกับที่ส่ง (signInWithOtp)
      });

      if (verifyError) {
        throw verifyError;
      } // สำเร็จ! // การ verifyOtp สำเร็จ หมายความว่าผู้ใช้ login แล้ว // เราจะส่งผู้ใช้ไปหน้า "ตั้งรหัสผ่านใหม่" (หน้าที่ 3)

      setMessage("ยืนยันสำเร็จ! ไปหน้าตั้งรหัสผ่านใหม่");
      setIsError(false); // ส่งผู้ใช้ไปหน้าที่ 3

      setTimeout(() => {
        window.location.href = `/new_password`;
      }, 1500);
    } catch (err: unknown) {
      console.error("Verify OTP error:", err);
      let errorMessage = "เกิดข้อผิดพลาดที่ไม่คาดคิด";
      if (err instanceof Error) {
        if (
          err.message.includes("Invalid OTP") ||
          err.message.includes("Invalid verification code") ||
          err.message.includes("expired")
        ) {
          errorMessage = "รหัส OTP 6 หลักไม่ถูกต้องหรือหมดอายุ";
        } else {
          errorMessage = err.message;
        }
      }
      setMessage(`เกิดข้อผิดพลาด: ${errorMessage}`);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };
  const handleResendCode = async () => {
    setIsLoading(true);
    setMessage("");
    setIsError(false);
    if (!supabase || !email) {
      setMessage("ไม่พบอีเมล, ไม่สามารถส่งรหัสใหม่ได้");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    try {
      // ส่ง OTP ไปที่อีเมลอีกครั้ง
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: { shouldCreateUser: false },
      });

      if (error) {
        throw error;
      }

      setMessage("ส่งรหัส OTP ใหม่สำเร็จแล้ว กรุณาตรวจสอบอีเมล");
      setIsError(false);
      setOtp(new Array(6).fill("")); // เคลียร์ช่อง OTP
      inputRefs.current[0]?.focus(); // ย้าย focus กลับไปช่องแรก
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
    // คอนเทนเนอร์หลัก เพิ่ม padding สำหรับมือถือและปรับ background
    <div 
      className="flex items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 bg-cover bg-center"
      style={{
        backgroundImage: `url("/bg.png")`,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Overlay เพื่อให้ข้อความอ่านง่ายขึ้น เพิ่มความเข้มเพื่อความคมชัดของตัวอักษร */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      {/* การ์ดหลัก */}
      <div className="w-full max-w-sm relative z-10 px-2 sm:px-0">
        <div className="p-6 sm:p-8 bg-white/60 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-white/30 transform transition duration-500 hover:shadow-blue-600/30">
          {/* หัวข้อและคำบรรยาย */}
          <div className="text-center mb-6 sm:mb-8 space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              ยืนยันตัวตน
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 font-medium px-2 leading-relaxed">
              กรุณากรอกรหัส 6 หลักที่เราส่งไปให้ที่อีเมล
            </p>
            <p className="text-xs sm:text-sm text-gray-800 font-bold px-2">
              {email}
            </p>
          </div>
          {/* แสดงข้อความสถานะ/แจ้งเตือน ปรับ spacing และขนาดตัวอักษร */}
          {message && (
            <div
              className={`p-3 mb-4 rounded-lg text-xs sm:text-sm font-semibold break-words ${
                isError
                  ? "bg-red-100 text-red-700 border border-red-300"
                  : "bg-green-100 text-green-700 border border-green-300"
              }`}
            >
              {message}
            </div>
          )}
          {/* คำเตือนหากยังไม่ได้ตั้งค่า Supabase */}
          {!supabase && !message && (
            <div className="p-3 mb-4 rounded-lg text-xs sm:text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
              <strong>คำเตือน:</strong> กรุณาตั้งค่า{" "}
              <code className="font-mono">YOUR_SUPABASE_URL</code> และ{" "}
              <code className="font-mono">YOUR_SUPABASE_ANON_KEY</code> ในโค้ด
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ส่วนของ OTP Inputs ปรับขนาดให้เหมาะกับมือถือและเพิ่ม styling */}
            <div className="flex justify-center gap-1.5 sm:gap-2 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
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

            {/* ปุ่ม Submit */}
            <button
              type="submit"
              disabled={
                isLoading || !email || !supabase || otp.join("").length < 6
              }
              className={`w-full py-3 sm:py-3.5 rounded-xl font-bold shadow-lg transition-all duration-300 ease-in-out text-base sm:text-lg ${
                isLoading || !email || !supabase || otp.join("").length < 6
                  ? "bg-blue-300 text-white cursor-not-allowed opacity-50"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-600/40 hover:shadow-blue-600/60 hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              }`}
            >
              {isLoading ? "กำลังตรวจสอบ..." : "ยืนยันรหัส OTP"}
            </button>
          </form>
          {/* ลิงก์ Resend Code */}
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
    </div>
  );
}
