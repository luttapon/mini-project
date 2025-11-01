import { createBrowserClient } from '@supabase/ssr' 
import { Database } from '@/types/supabase'


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// เราใช้ createBrowserClient สำหรับฝั่ง Client
export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseKey
)