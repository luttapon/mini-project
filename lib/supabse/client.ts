import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase' // 👈 import type ที่เราสร้างในขั้นตอนที่ 3

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// เราใส่ <Database> เพื่อให้ TypeScript รู้จักตารางของเรา
export const supabase = createClient<Database>(supabaseUrl, supabaseKey)