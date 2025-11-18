"use client"

import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center px-4"
      style={
        {
          backgroundImage:
            'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(/bg.png)'
        }
      }
    >
      <div className="flex flex-col items-center gap-7 text-center">
        <Image
          src="/community.png"
          alt="Community"
          width={320}
          height={320}
          priority
          className="h-64 w-64 rounded-full object-cover shadow-xl"
        />
        <h1 className="text-6xl font-semibold text-yellow-300 tracking-wide">
          ยินดีต้อนรับสู่ชุมชนออนไลน์
        </h1>
        <div className="flex flex-col sm:flex-row gap-10 pt-5">
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="rounded-full bg-sky-600 px-10 py-4 text-lg text-white shadow-lg transition hover:bg-sky-800 cursor-pointer hover:scale-105 active:scale-95"
          >
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            onClick={() => router.push('/register')}
            className="rounded-full bg-white px-10 py-4 text-lg text-indigo-600 shadow-lg transition hover:bg-gray-300 cursor-pointer hover:scale-105 active:scale-95"
          >
            ลงทะเบียน
          </button>
        </div>
      </div>
    </div>
  )
}
