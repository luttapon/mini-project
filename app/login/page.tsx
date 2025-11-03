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

    /**
     * แสดงข้อความในกล่องข้อความที่กำหนดเองและซ่อนโดยอัตโนมัติ
     * @param text ข้อความที่จะแสดง
     * @param type 'success' หรือ 'error'.
     */
    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type });

        // ซ่อนข้อความโดยอัตโนมัติหลังจาก 5 วินาที
        setTimeout(() => {
            setMessage({ text: '', type: '' });
        }, 5000);
    };
    const handleGoogleSignIn = (): void => {
        console.log('Google Sign-In Clicked - Initiating OAuth flow...');
    };

    const handleFacebookSignIn = (): void => {
        console.log('Facebook Sign-In Clicked - Initiating OAuth flow...');
    };
    /**
     *  
     * @param e เหตุการณ์การส่งฟอร์ม
     */
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
                router.push('/dashboard'); // ไปหน้าหลัก
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
    const imagePathFromPublic = '/bglogin.png'; // ใช้ภาพจากโฟลเดอร์ public
    const backgroundImageSource = imagePathFromPublic;

    // ---------------------------------------------------------------------

    return (
        // คอนเทนเนอร์หลักที่มีพื้นหลังเป็นรูปภาพ
        <div
            className="flex items-center justify-center min-h-screen p-4 sm:p-6 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImageSource})`, fontFamily: 'Inter, sans-serif' }}
        >
            {/* Overlay เพื่อให้ข้อความอ่านง่ายขึ้น */}
            <div className="absolute inset-0 bg-black opacity-40"></div>

            {/* คอนเทนเนอร์การ์ดเข้าสู่ระบบ */}
            <div className="w-full max-w-md relative z-10">

                {/* ปุ่มย้อนกลับ (Back Button) */}
                <button
                    onClick={handleGoBack}
                    aria-label="ย้อนกลับไปหน้าหลัก"
                    className="flex items-center justify-center mb-4 text-white hover:text-gray-200 transition duration-150 p-2 rounded-full transform -translate-x-2 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                    {/* SVG Icon: Arrow Left */}
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                    <span className="text-base font-semibold">ย้อนกลับ</span>
                </button>

                <div className="bg-white p-8 sm:p-10 shadow-2xl rounded-xl border border-gray-100 transform transition duration-500 hover:shadow-indigo-600/20">

                    <div className="text-center mb-8">
                        {/* เข้าสู่ระบบ */}
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                            เข้าสู่ระบบ
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            โปรดกรอกรายละเอียดเพื่อดำเนินการต่อ
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* ช่องป้อน: ชื่อผู้ใช้หรืออีเมล */}
                        <div className="mb-5">
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out placeholder-gray-400 text-base"
                                aria-label="ชื่อผู้ใช้ หรือ อีเมล"
                            />
                        </div>

                        {/* ช่องป้อน: รหัสผ่าน */}
                        <div className="mb-6">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out placeholder-gray-400 text-base"
                                aria-label="รหัสผ่าน"
                            />
                            <div className="flex justify-end mt-2">
                                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition duration-150 ease-in-out"
                                    onClick={handleGopasswordreset}>
                                    ลืมรหัสผ่าน?
                                </a>
                            </div>
                        </div>

                        {/* ปุ่มส่ง: เข้าสู่ระบบ */}
                        <button
                            type="submit"
                            disabled={loading || !username || !password}
                            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md shadow-blue-600/30 hover:bg-blue-700 transition duration-200 ease-in-out transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 text-lg cursor-pointer"
                        >
                            {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
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

                    {/* กล่องข้อความสำหรับข้อเสนอแนะ */}
                    {message.text && (
                        <div
                            id="messageBox"
                            className={`mt-6 p-4 text-sm text-center rounded-lg transition-opacity duration-300 ${messageClasses}`}
                        >
                            {message.text}
                        </div>
                    )}

                    <p className="text-center text-sm text-gray-500 mt-6">
                        ยังไม่มีบัญชี?
                        <a href="#" className="font-medium text-blue-600 hover:text-blue-700" onClick={handleGoRegister}>
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
