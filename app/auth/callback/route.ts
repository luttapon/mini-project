// 1. Import createClient จาก "server.ts" ของคุณ
import { createClient } from '@/lib/supabase/server' 
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// 2. สร้างฟังก์ชัน GET
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code') // ดึง 'code' ที่ Google ส่งมา

  if (code) {
    // 3. สร้าง Server Client โดยใช้ cookies
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // 4. แลก 'code' ให้เป็น 'session' (ขั้นตอนนี้จะสร้างคุกกี้ให้ผู้ใช้)
    await supabase.auth.exchangeCodeForSession(code)
  }

  // 5. ส่งผู้ใช้กลับไปหน้าแรกของเว็บ
  return NextResponse.redirect(`${requestUrl.origin}/`)
}