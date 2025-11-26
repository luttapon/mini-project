"use client"

import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center px-4 py-8"
      style={
        {
          backgroundImage:
            'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(/wallpaper5.png)'
        }
      }
    >
      {/* Container หลักจัดวางเนื้อหาให้เหมาะกับทุกขนาดหน้าจอ */}
      <div className="flex flex-col items-center gap-6 sm:gap-8 text-center max-w-4xl w-full">
        
        {/* Logo ชุมชนปรับขนาดให้เหมาะกับมือถือ */}
        <div className="mb-2">
          <Image
            src="/community.png"
            alt="Community"
            width={320}
            height={320}
            priority
            className="h-40 w-40 sm:h-56 sm:w-56 md:h-64 md:w-64 rounded-full object-cover shadow-2xl border-4 border-white/20"
          />
        </div>

        {/* หัวข้อหลัก ปรับขนาดตัวอักษรตามหน้าจอ */}
        <div className="space-y-3 sm:space-y-4 px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-yellow-300 tracking-wide leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            ยินดีต้อนรับสู่ชุมชนออนไลน์
          </h1>
          
          {/* คำบรรยายเพิ่มเติมเพื่อความเป็นทางการ */}
          <p className="text-base sm:text-lg md:text-xl text-gray-100 font-light max-w-2xl mx-auto leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            แพลตฟอร์มชุมชนออนไลน์สำหรับการเชื่อมต่อ แบ่งปัน และสร้างสรรค์ร่วมกัน
          </p>
        </div>

        {/* ส่วนเพิ่มเติม */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12 w-full px-4">
          {/* คุณสมบัติ 1 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 shadow-lg transition-all duration-300">
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">📰</div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              ติดตามข่าวสาร
            </h3>
            <p className="text-xs sm:text-sm text-gray-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              รับข้อมูลข่าวสารและกิจกรรมล่าสุดจากชุมชน
            </p>
          </div>

          {/* คุณสมบัติ 2 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 shadow-lg transition-all duration-300">
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">💬</div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              แบ่งปันประสบการณ์
            </h3>
            <p className="text-xs sm:text-sm text-gray-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              แลกเปลี่ยนความคิดเห็นและเรื่องราวต่างๆ
            </p>
          </div>

          {/* คุณสมบัติ 3 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 shadow-lg transition-all duration-300">
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">👥</div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              สร้างกลุ่มของคุณ
            </h3>
            <p className="text-xs sm:text-sm text-gray-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              จัดตั้งและบริหารกลุ่มตามความสนใจ
            </p>
          </div>
        </div>

        {/* ปุ่มจัดเรียงแนวตั้งบนมือถือและแนวนอนบนหน้าจอใหญ่ */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4 sm:pt-6 w-full sm:w-auto px-4">
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full sm:w-auto rounded-full bg-sky-600 px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-medium text-white shadow-xl transition-all duration-200 hover:bg-sky-700 hover:shadow-2xl cursor-pointer hover:scale-105 active:scale-95 border-2 border-sky-400"
          >
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            onClick={() => router.push('/register')}
            className="w-full sm:w-auto rounded-full bg-white px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-medium text-indigo-700 shadow-xl transition-all duration-200 hover:bg-gray-100 hover:shadow-2xl cursor-pointer hover:scale-105 active:scale-95 border-2 border-gray-200"
          >
            ลงทะเบียน
          </button>
        </div>
      </div>
    </div>
  )
}
