'use client';
import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

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
    
    // สถานะสำหรับกล่องข้อความตอบกลับ
    const [message, setMessage] = useState<MessageState>({ text: '', type: '' });

    // สร้าง router ท
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

    /**
     * จัดการตรรกะสำหรับการส่งฟอร์ม
     * @param e เหตุการณ์การส่งฟอร์ม
     */
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        // ตรรกะการตรวจสอบอย่างง่าย (สำหรับสาธิต)
        if (username && password) {
            // ในแอปพลิเคชันจริง ข้อมูลนี้จะถูกส่งไปยังเซิร์ฟเวอร์
            console.log('Attempting login with:', { username, password });
            
            showMessage('เข้าสู่ระบบสำเร็จ! (แต่ข้อมูลไม่ได้ถูกส่งไปยังเซิร์ฟเวอร์จริง)', 'success');
            
            // ล้างฟอร์มหลังจากการส่งที่สำเร็จ (จำลอง)
            setUsername('');
            setPassword('');

        } else {
            showMessage('กรุณากรอกชื่อผู้ใช้/อีเมล และรหัสผ่านให้ครบถ้วน', 'error');
        }
    };
    
    /**
     * จัดการตรรกะเมื่อผู้ใช้คลิกปุ่มย้อนกลับ (จำลองการกลับไปหน้าแรก)
     */
    const handleGoBack = () => {
        // ใช้ router.push('/') เพื่อเปลี่ยนเส้นทางไปยังหน้าหลัก
        router.push('/');
    };

    // กำหนดคลาสสำหรับกล่องข้อความตามสถานะ
    const messageClasses = message.type === 'success'
        ? 'bg-green-100 text-green-700'
        : 'bg-red-100 text-red-700';

    // ---------------------------------------------------------------------
    // กำหนดแหล่งที่มาของภาพพื้นหลัง 
    const imagePathFromPublic = '/bg.png'; // ตัวอย่างการใช้ภาพจากโฟลเดอร์ public
    const backgroundImageSource = imagePathFromPublic;
    
    // ---------------------------------------------------------------------

    return (
        // คอนเทนเนอร์หลักที่มีพื้นหลังเป็นรูปภาพ (ใช้ URL หรือ Base64 String ใน style)
        <div 
            className="flex items-center justify-center min-h-screen p-4 sm:p-6 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImageSource})`, fontFamily: 'Inter, sans-serif' }}
        >
            {/* Overlay สีดำจางๆ เพื่อให้ข้อความอ่านง่ายขึ้น */}
            <div className="absolute inset-0 bg-black opacity-40"></div>

            {/* คอนเทนเนอร์การ์ดเข้าสู่ระบบ */}
            <div className="w-full max-w-md relative z-10"> {/* เพิ่ม relative และ z-10 เพื่อให้อยู่เหนือ overlay */}
                
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
                        {/* ชื่อเรื่อง: เข้าสู่ระบบ */}
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                            เข้าสู่ระบบ
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            โปรดกรอกรายละเอียดเพื่อดำเนินการต่อ
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* ช่องข้อมูล: ชื่อผู้ใช้หรืออีเมล */}
                        <div className="mb-5">
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                ชื่อผู้ใช้ หรือ อีเมล
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

                        {/* ช่องข้อมูล: รหัสผ่าน */}
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
                                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition duration-150 ease-in-out">
                                    ลืมรหัสผ่าน?
                                </a>
                            </div>
                        </div>

                        {/* ปุ่มส่ง: เข้าสู่ระบบ - กำหนดสีฟ้าโดยตรง (ใช้ blue-600) */}
                        <button
                            type="submit"
                            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md shadow-blue-600/30 hover:bg-blue-700 transition duration-200 ease-in-out transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 text-lg"
                        >
                            เข้าสู่ระบบ
                        </button>
                    </form>

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
                        <a href="#" className="font-medium text-blue-600 hover:text-blue-700">
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
