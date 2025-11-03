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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">
          ยืนยันตัวตน
        </h1>
        <p className="text-center text-gray-600 mb-6">
          กรุณากรอกรหัส 6 หลักที่เราส่งไปให้ที่อีเมล <strong>{email}</strong>
        </p>

{/* แสดงข้อความสถานะ/แจ้งเตือน */}
        {message && (
          <div className={`p-3 mb-4 rounded-lg text-sm font-medium break-words ${
            isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}
        
        {/* คำเตือนหากยังไม่ได้ตั้งค่า Supabase */}
        {(!supabase && !message) && (
            <div className="p-3 mb-4 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-800">
                <strong>คำเตือน:</strong> กรุณาตั้งค่า <code>YOUR_SUPABASE_URL</code> และ <code>YOUR_SUPABASE_ANON_KEY</code> ในโค้ด
            </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ส่วนของ OTP Inputs */}
          <div className="flex justify-center gap-2 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text" // ใช้ type="text" จะจัดการได้ง่ายกว่า "number"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                placeholder={`•`}
                title={`OTP digit ${index + 1}`}
                aria-label={`OTP digit ${index + 1}`}
                className="w-12 h-12 text-center text-2xl font-semibold border border-gray-300 rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            ))}
          </div>

          {/* ปุ่ม Submit */}
          <button
            type="submit"
            disabled={isLoading || !email || !supabase || otp.join('').length < 6}
            className={`w-full py-3 rounded-lg text-white font-semibold shadow-lg transition duration-300 ease-in-out mt-2 ${
              (isLoading || !email || !supabase || otp.join('').length < 6)
                ? 'bg-indigo-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transform hover:scale-[1.01]'
            }`}
          >
            {isLoading ? 'กำลังตรวจสอบ...' : 'ยืนยันรหัส OTP'}
          </button>
        </form>

        {/* ลิงก์ Resend Code */}
        <div className="text-center mt-4">
          <button onClick={handleResendCode}
            disabled={isLoading || !email || !supabase}
            className="text-sm text-indigo-600 hover:text-indigo-500 disabled:text-gray-400 disabled:cursor-not-allowed">
            ไม่ได้รับรหัส? ส่งอีกครั้ง
          </button>
        </div>
      </div>
    </div>
  );
}
