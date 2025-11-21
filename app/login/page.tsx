'use client';
import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faFacebookF } from "@fortawesome/free-brands-svg-icons";

// กำหนดโครงสร้างสำหรับสถานะข้อความตอบกลับ
interface MessageState {
    text: string;
    type: 'success' | 'error' | '';
}

// คอมโพเนนต์หลัก App
const App: React.FC = () => {
    // สถานะสำหรับข้อมูลฟอร์ม
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    // สถานะสำหรับกล่องข้อความตอบกลับ
    const [message, setMessage] = useState<MessageState>({ text: '', type: '' });

    // สร้าง router 
    const router = useRouter();


    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type });

        // ซ่อนข้อความโดยอัตโนมัติหลังจาก 5 วินาที
        setTimeout(() => {
            setMessage({ text: '', type: '' });
        }, 5000);
    };
    
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true); // เริ่ม Loading
        setMessage({ text: '', type: '' }); // ล้างข้อความเก่า

        // (โค้ดที่เพิ่มเข้ามา)
        // เรียก Supabase Auth
        // เราใช้ 'username' state (ที่ผู้ใช้กรอก) เป็น 'email'
        const { data, error } = await supabase.auth.signInWithPassword({
            email: username,
            password: password,
        });

        setLoading(false); // หยุด Loading

        if (error) {
            // ถ้า Supabase ส่ง error กลับมา (เช่น รหัสผิด, ไม่มี user)
            console.error('Login error:', error.message);
            showMessage('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'error');
        } else if (data.user) {
            // ถ้าสำเร็จ
            showMessage('เข้าสู่ระบบสำเร็จ! กำลังไปหน้าหลัก...', 'success');

            // รอ 1 วินาทีให้ผู้ใช้อ่านข้อความ แล้วค่อย Redirect
            setTimeout(() => {
                router.push('/profile'); // ไปหน้าหลัก
                router.refresh(); // (สำคัญ!) สั่งให้ Next.js โหลดข้อมูลใหม่ (ในฐานะ user ที่ login แล้ว)
            }, 1000);
        }
    };

    /**
     * ฟังก์ชันสําหรับปุ่มย้อนกลับ (กลับไปยังหน้าหลัก)
     */
    const handleGoBack = () => {
        // ใช้ router.push('/') เพื่อเปลี่ยนเส้นทางไปยังหน้าหลัก
        router.push('/');
    };
    // ---------------------------------------------------------------------
    const handleGoRegister = () => {
        // ใช้ router.push('/register') เพื่อเปลี่ยนเส้นทางไปยังหน้า register
        router.push('/register');
    };

    const handleGopasswordreset = () => {
        // ใช้ router.push('/password_reset') เพื่อเปลี่ยนเส้นทางไปยังหน้า password_reset
        router.push('/password_reset');
    };
    // กำหนดคลาสสำหรับกล่องข้อความตามสถานะ
    const messageClasses = message.type === 'success'
        ? 'bg-green-100 text-green-700'
        : 'bg-red-100 text-red-700';

    // ---------------------------------------------------------------------
    // กำหนดแหล่งที่มาของภาพพื้นหลัง 
    const imagePathFromPublic = '/wallpaper4.jpg'; // ใช้ภาพจากโฟลเดอร์ public
    const backgroundImageSource = imagePathFromPublic;

    // ---------------------------------------------------------------------

    return (
        // คอนเทนเนอร์หลักที่มีพื้นหลังเป็นรูปภาพ เพิ่ม padding สำหรับมือถือ
        <div
            className="flex items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImageSource})`, fontFamily: 'Inter, sans-serif' }}
        >
            {/* Overlay เพื่อให้ข้อความอ่านง่ายขึ้น เพิ่มความเข้มเพื่อความคมชัดของตัวอักษร */}
            <div className="absolute inset-0 bg-black opacity-50"></div>

            {/* คอนเทนเนอร์การ์ดเข้าสู่ระบบ จำกัดความกว้างสูงสุดสำหรับมือถือ */}
            <div className="w-full max-w-md relative z-10 px-2 sm:px-0">

                {/* ปุ่มย้อนกลับ ปรับขนาดและ shadow เพื่อความชัดเจน */}
                <button
                    onClick={handleGoBack}
                    aria-label="ย้อนกลับไปหน้าหลัก"
                    className="flex items-center justify-start mb-4 sm:mb-6 text-white hover:text-gray-200 transition-all duration-200 p-2 px-3 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg cursor-pointer"
                >
                    {/* SVG Icon: Arrow Left */}
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                    <span className="text-sm sm:text-base font-semibold drop-shadow-lg">ย้อนกลับ</span>
                </button>

                {/* การ์ดหลัก */}
                <div className="bg-white/50 backdrop-blur-lg p-6 sm:p-8 md:p-10 shadow-2xl rounded-2xl border-2 border-white/30 transform transition duration-500 hover:shadow-indigo-600/30">

                    {/* หัวข้อและคำบรรยาย */}
                    <div className="text-center mb-6 sm:mb-8 space-y-2">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                            เข้าสู่ระบบ
                        </h1>
                        <p className="mt-2 text-xs sm:text-sm text-gray-600 font-medium px-2">
                            โปรดกรอกรายละเอียดเพื่อดำเนินการต่อ
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* ช่องป้อนอีเมล */}
                        <div className="mb-4 sm:mb-5">
                            <label htmlFor="username" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
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
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out placeholder-gray-400 text-sm sm:text-base shadow-sm hover:border-gray-400"
                                aria-label="ชื่อผู้ใช้ หรือ อีเมล"
                            />
                        </div>

                        {/* ช่องป้อนรหัสผ่าน */}
                        <div className="mb-5 sm:mb-6">
                            <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
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
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out placeholder-gray-400 text-sm sm:text-base shadow-sm hover:border-gray-400"
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

                        {/* ปุ่ม เข้าสู่ระบบ */}
                        <button
                            type="submit"
                            disabled={loading || !username || !password}
                            className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/40 hover:shadow-blue-600/60 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-base sm:text-lg cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
                        </button>
                    </form>

                    {/* ข้อความและลิงก์ลงทะเบียน */}
                    <p className="text-center text-xs sm:text-sm text-gray-700 mt-6 sm:mt-8 font-medium">
                        ยังไม่มีบัญชี?{' '}
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
        </div>
    );
};

// ส่งออกคอมโพเนนต์ App เป็นค่าเริ่มต้น
export default App;
