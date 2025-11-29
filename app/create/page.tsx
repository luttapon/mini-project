'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Check, UploadCloud } from 'lucide-react' 

export default function CreateGroupPage() {
  const router = useRouter()

  // --- ส่วนจัดการ State (ข้อมูลในฟอร์ม) ---
  const [name, setName] = useState('') 
  const [description, setDescription] = useState('') 
  const [allowMembersToPost, setAllowMembersToPost] = useState(true) 
  
  // --- ส่วนจัดการ State (ไฟล์รูปภาพ) ---
  const [avatarFile, setAvatarFile] = useState<File | null>(null) 
  const [coverFile, setCoverFile] = useState<File | null>(null)   
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null) 
  const [coverPreview, setCoverPreview] = useState<string | null>(null)   

  // --- ส่วนจัดการ State (สถานะการทำงาน) ---
  const [loading, setLoading] = useState(false) 
  const [error, setError] = useState('')        

  // --- Logic: เลือกรูปโปรไฟล์และแสดงตัวอย่าง ---
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  // --- Logic: เลือกรูปปกและแสดงตัวอย่าง ---
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (file) {
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  // --- Helper: ฟังก์ชันอัปโหลดไฟล์ ---
  const handleUploadFile = async (file: File, type: 'avatar' | 'cover') => {
    if (!file) return null

    const folder = type === 'avatar' ? 'avatars' : 'covers'
    
    // ตั้งชื่อไฟล์ใหม่ (กันภาษาไทย/เว้นวรรค) -> ใช้ เวลาปัจจุบัน.นามสกุลไฟล์
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    // อัปโหลดไปยัง Bucket 'groups'
    const { error } = await supabase.storage.from('groups').upload(filePath, file)
    
    if (error) {
      console.error(`Error uploading ${type}:`, error.message)
      throw new Error(`อัปโหลดรูป ${type} ไม่สำเร็จ: ${error.message}`)
    }

    // คืนค่า Path
    return filePath 
  }

  // --- Logic: บันทึกข้อมูล (Submit Form) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. ตรวจสอบ Login
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('กรุณาล็อกอินก่อนสร้างกลุ่ม')

      // 2. อัปโหลดรูปภาพ (ถ้ามี)
      let avatarPath = null
      let coverPath = null

      if (avatarFile) {
        avatarPath = await handleUploadFile(avatarFile, 'avatar')
      }
      if (coverFile) {
        coverPath = await handleUploadFile(coverFile, 'cover')
      }

      // 3. บันทึกข้อมูลลงฐานข้อมูล
      const { error: insertError } = await supabase
        .from('groups')
        .insert([{
          name,
          description,
          avatar_url: avatarPath, 
          cover_url: coverPath,  
          owner_id: user.id, 
          allow_members_to_post: allowMembersToPost
        }])

      if (insertError) throw insertError

      // 4. สำเร็จ: ไปหน้ารวมกลุ่ม
      router.push('/groups')
      
    // 🛠️ แก้ไข: เปลี่ยน any เป็น unknown และเช็ค type ก่อนใช้งาน
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('เกิดข้อผิดพลาดไม่ทราบสาเหตุ')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/myGroups')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        
        {/* รูปปก */}
        <div className="relative w-full h-56 bg-gray-200 cursor-pointer group hover:bg-gray-300 transition">
          <label className="w-full h-full flex items-center justify-center relative">
            {coverPreview ? (
              <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <UploadCloud className="w-10 h-10 mb-2" />
                <span>เพิ่มรูปหน้าปก</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
          </label>
        </div>

        {/* รูปโปรไฟล์ */}
        <div className="relative -mt-12 flex justify-center cursor-pointer">
          <label className="relative group">
            <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-300 flex items-center justify-center hover:bg-gray-400 transition">
                {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                <span className="text-gray-500 text-xs">รูปโปรไฟล์</span>
                )}
            </div>
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>
        </div>

        {/* ฟอร์ม */}
        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5">
          {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl text-center text-sm">{error}</div>}

          <input
            type="text"
            placeholder="ชื่อกลุ่ม"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-sky-500 outline-none"
            required
          />

          <textarea
            placeholder="คำอธิบายกลุ่ม..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-sky-500 outline-none resize-none"
            rows={4}
          />

          <div 
            className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            onClick={() => setAllowMembersToPost(!allowMembersToPost)}
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${allowMembersToPost ? 'bg-sky-600 border-sky-600' : 'bg-white border-gray-300'}`}>
              {allowMembersToPost && <Check className="w-4 h-4 text-white" />}
            </div>
            <span className="text-gray-700 select-none">สมาชิกสามารถโพสต์ได้</span>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 bg-sky-600 text-white py-3 rounded-2xl font-semibold shadow hover:bg-sky-700 disabled:bg-sky-300 transition"
            >
              {loading ? 'กำลังบันทึก...' : 'สร้างกลุ่ม'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-2xl font-semibold hover:bg-gray-200 transition"
            >
              ยกเลิก
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}