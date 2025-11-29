import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase' // ใช้ Database Type ที่สร้างจาก Supabase CLI

// ฟังก์ชันสร้าง Supabase Client สำหรับใช้งานใน Server Components หรือ Server Actions
export function createClient(cookieStore: ReturnType<typeof cookies>) {
  return createServerClient<Database>(
    // ดึงค่า URL และ Anon Key จาก Environment Variables
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        
        // --- ส่วนที่ 1: การอ่านค่า Cookie (get) ---
        // ใช้สำหรับดึงข้อมูล Session ของผู้ใช้จาก Browser
        async get(name: string) {
          // ดึงค่า Cookie จาก Next.js headers
          return (await cookieStore).get(name)?.value
        },

        // --- ส่วนที่ 2: การบันทึกค่า Cookie (set) ---
        // ใช้สำหรับสร้างหรืออัปเดต Session (เช่น ตอน Login หรือ Refresh Token)
        async set(name: string, value: string, options: CookieOptions) {
          try {
            // เรียกใช้ cookieStore.set แบบ Object ตามมาตรฐาน Next.js ล่าสุด
            (await cookieStore).set({ name, value, ...options })
          } catch (error) {
            // กรณีเกิด Error (เช่น เรียกใช้ใน Server Component ที่ห้ามเขียน Cookie)
            // เราจะข้ามไป เพื่อไม่ให้แอปพัง
          }
        },

        // --- ส่วนที่ 3: การลบค่า Cookie (remove) ---
        // ใช้สำหรับลบ Session (เช่น ตอน Logout)
        async remove(name: string, options: CookieOptions) {
          try {
            // การลบคือการ Set ค่าให้ว่างเปล่า และกำหนดอายุให้หมดทันที (maxAge: 0)
            (await cookieStore).set({ name, value: '', ...options, maxAge: 0 })
          } catch (error) {
            // ข้าม Error เช่นเดียวกันกับการ Set
          }
        },
      },
    }
  )
}