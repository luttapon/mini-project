import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export function createClient(cookieStore: ReturnType<typeof cookies>) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        
        async get(name: string) {
          return (await cookieStore).get(name)?.value
        },

        // --- 1. แก้ไขฟังก์ชัน SET ---
        // เราจะส่งเป็น "อ็อบเจกต์เดียว" แทน 3 อาร์กิวเมนต์
        async set(name: string, value: string, options: CookieOptions) {
          try {
            (await cookieStore).set({ name, value, ...options })
          } catch (error) {
            // (เมิน error นี้ไป)
          }
        },

        // --- 2. แก้ไขฟังก์ชัน REMOVE ---
        // เราจะ "set" cookie ให้หมดอายุ (maxAge: 0) แทนการ "delete"
        async remove(name: string, options: CookieOptions) {
          try {
            (await cookieStore).set({ name, value: '', ...options, maxAge: 0 })
          } catch (error) {
            // (เมิน error นี้ไป)
          }
        },
      },
    }
  )
}