'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
// นำเข้าไอคอน Check สำหรับ Checkbox
import { Check } from 'lucide-react' 

export default function CreateGroupPage() {
  const router = useRouter()

  // --- ส่วนจัดการ State (ข้อมูลในฟอร์ม) ---
  const [name, setName] = useState('') // ชื่อกลุ่ม
  const [description, setDescription] = useState('') // คำอธิบาย
  // State สำหรับกำหนดสิทธิ์การโพสต์ (เริ่มต้นเป็น true: อนุญาต)
  const [allowMembersToPost, setAllowMembersToPost] = useState(true) 
  
  // --- ส่วนจัดการ State (ไฟล์รูปภาพ) ---
  const [avatarFile, setAvatarFile] = useState<File | null>(null) // ไฟล์รูปโปรไฟล์
  const [coverFile, setCoverFile] = useState<File | null>(null)   // ไฟล์รูปปก
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null) // URL ตัวอย่างรูปโปรไฟล์
  const [coverPreview, setCoverPreview] = useState<string | null>(null)   // URL ตัวอย่างรูปปก

  // --- ส่วนจัดการ State (สถานะการทำงาน) ---
  const [loading, setLoading] = useState(false) // สถานะกำลังโหลด
  const [error, setError] = useState('')        // ข้อความ Error

  // --- Logic: เลือกรูปโปรไฟล์และแสดงตัวอย่าง ---
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setAvatarFile(file)
    // สร้าง Object URL สำหรับแสดงตัวอย่าง
    setAvatarPreview(file ? URL.createObjectURL(file) : null)
  }

  // --- Logic: เลือกรูปปกและแสดงตัวอย่าง ---
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setCoverFile(file)
    // สร้าง Object URL สำหรับแสดงตัวอย่าง
    setCoverPreview(file ? URL.createObjectURL(file) : null)
  }

  // --- Helper: ฟังก์ชันอัปโหลดไฟล์ไป Supabase Storage ---
  const handleUploadFile = async (file: File, type: 'avatar' | 'cover') => {
    if (!file) return null
    const folder = type === 'avatar' ? 'avatars' : 'covers'
    // ตั้งชื่อไฟล์ให้ไม่ซ้ำกันด้วย Date.now() และชื่อไฟล์เดิม
    const filePath = `${folder}/${Date.now()}_${file.name}`

    // อัปโหลดไฟล์ไปยัง Bucket 'groups'
    const { error } = await supabase.storage.from('groups').upload(filePath, file)
    if (error) {
      console.error('Upload error:', error.message)
      return null
    }

    return filePath // คืนค่า path ที่ใช้เก็บไฟล์ใน Storage
  }

  // --- Logic: บันทึกข้อมูล (Submit Form) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. ตรวจสอบว่า User Login หรือยัง
      const user = await supabase.auth.getUser()
      if (!user.data.user) throw new Error('กรุณาล็อกอินก่อนสร้างกลุ่ม')

      // 2. อัปโหลดรูปภาพ (ถ้ามีการเลือก)
      const avatarPath = avatarFile ? await handleUploadFile(avatarFile, 'avatar') : null
      const coverPath = coverFile ? await handleUploadFile(coverFile, 'cover') : null

      // 3. บันทึกข้อมูลลงฐานข้อมูล (Table: groups)
      const { data, error } = await supabase
        .from('groups')
        .insert([{
          name,
          description,
          avatar_url: avatarPath, // URL/Path ของรูปโปรไฟล์
          cover_url: coverPath,  // URL/Path ของรูปปก
          owner_id: user.data.user.id, // ID เจ้าของกลุ่ม
          // ฟิลด์กำหนดสิทธิ์การโพสต์
          allow_members_to_post: allowMembersToPost
        }])
        .select() // เลือกข้อมูลที่เพิ่ง insert กลับมา

      if (error) throw error

      // 4. สำเร็จ: ไปยังหน้ารายการกลุ่ม
      router.push('/groups')
    } catch (err: unknown) {
      // จัดการ Error
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('เกิดข้อผิดพลาดไม่ทราบสาเหตุ')
      }
    } finally {
      setLoading(false)
    }
  }

  // --- Logic: ยกเลิกและเคลียร์ค่า ---
  const handleCancel = () => {
    // เคลียร์ค่า State ทั้งหมด
    setName('')
    setDescription('')
    setAvatarFile(null)
    setCoverFile(null)
    setAvatarPreview(null)
    setCoverPreview(null)
    setAllowMembersToPost(true) 
    setError('')
    
    // นำทางกลับไปหน้า My Groups
    router.push('/myGroups')
  }

  return (
    // --- Container หลัก: พื้นหลังไล่เฉดสี ---
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-white flex items-center justify-center p-4">
      
      {/* การ์ดแบบฟอร์มหลัก */}
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        
        {/* --- ส่วนที่ 1: รูปภาพหน้าปก (Cover Image) --- */}
        <div className="relative w-full h-56 bg-gray-200 cursor-pointer group">
          <label className="w-full h-full block relative">
            {coverPreview ? (
              // แสดงรูปปกที่เลือก
              <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              // Placeholder รูปปก
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg cursor-pointer">
                รูปหน้าปก
              </div>
            )}
            
            {/* Effect เมื่อนำเมาส์ไปชี้ (Overlay) */}
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
            
            {/* Input รับไฟล์ (ซ่อนอยู่) */}
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="hidden"
            />
          </label>
        </div>

        {/* --- ส่วนที่ 2: รูปโปรไฟล์ (Avatar) --- */}
        <div className="relative -mt-12 flex justify-center cursor-pointer">
          <label className="relative group">
            {avatarPreview ? (
              // แสดงรูปโปรไฟล์ที่เลือก
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-28 h-28 rounded-full border-4 border-white object-cover shadow-lg"
              />
            ) : (
              // Placeholder รูปโปรไฟล์
              <div className="w-28 h-28 bg-gray-300 rounded-full border-4 border-white flex items-center justify-center shadow-lg text-gray-400 cursor-pointer">
                รูปโปรไฟล์
              </div>
            )}
            
            {/* Effect เมื่อนำเมาส์ไปชี้ (Overlay) */}
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none rounded-full"></div>
            
            {/* Input รับไฟล์ (ซ่อนอยู่) */}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
        </div>

        {/* --- ส่วนที่ 3: ฟอร์มกรอกข้อมูล (ชื่อ, รายละเอียด, สิทธิ์) --- */}
        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5">
          {/* แสดงข้อความ Error (ถ้ามี) */}
          {error && <p className="text-red-500 text-center">{error}</p>}

          {/* Input ชื่อกลุ่ม */}
          <input
            type="text"
            placeholder="ชื่อกลุ่ม"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-3xl px-5 py-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            required
          />

          {/* Textarea คำอธิบายกลุ่ม */}
          <textarea
            placeholder="คำอธิบายกลุ่ม"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-3xl px-5 py-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none transition"
            rows={4}
          />

          {/* Checkbox สำหรับกำหนดสิทธิ์การโพสต์ */}
          <div 
            className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-xl transition hover:bg-gray-50"
            onClick={() => setAllowMembersToPost(!allowMembersToPost)}
          >
            <div 
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                allowMembersToPost 
                  ? 'bg-sky-600 border-sky-600' // สถานะ Checked
                  : 'bg-white border-gray-400' // สถานะ Unchecked
              }`}
            >
              {allowMembersToPost && <Check className="w-4 h-4 text-white" />}
            </div>
            <label className="text-gray-800 text-sm font-medium cursor-pointer select-none">
              อนุญาตให้สมาชิกกลุ่มสามารถโพสต์ได้
            </label>
          </div>

          {/* --- ปุ่มดำเนินการ (สร้างกลุ่ม / ยกเลิก) --- */}
          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 bg-sky-600 text-white py-3 rounded-2xl font-semibold shadow-md hover:bg-sky-700 transition cursor-pointer hover:scale-105 active:scale-95 disabled:bg-sky-300"
            >
              {loading ? 'กำลังสร้าง...' : 'สร้างกลุ่ม'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-2xl font-semibold shadow-md hover:bg-gray-300 transition cursor-pointer hover:scale-105 active:scale-95"
            >
              ยกเลิก
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}