'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Check } from 'lucide-react' // เพิ่ม Check icon สำหรับ Checkbox

export default function EditGroupPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.groupId as string

  // --- ส่วนจัดการ State (ข้อมูลฟอร์มและไฟล์) ---
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  // State สำหรับสิทธิ์การโพสต์ (ดึงค่าจาก DB เมื่อโหลด)
  const [allowMembersToPost, setAllowMembersToPost] = useState(true)
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null) // ไฟล์ใหม่ที่เลือก
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null) // URL Preview/URL เดิม
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // --- Effect: โหลดข้อมูลกลุ่มเดิมมาแสดงในฟอร์ม ---
  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupId) return
      setLoading(true)

      // ดึงข้อมูลกลุ่มเดิม
      const { data, error } = await supabase
        .from('groups')
        .select('*, allow_members_to_post') // ดึงข้อมูลสิทธิ์การโพสต์
        .eq('id', groupId)
        .single()

      if (error) {
        console.error(error)
        setError('ไม่สามารถโหลดข้อมูลกลุ่มได้')
      } else if (data) {
        setName(data.name)
        setDescription(data.description || '')
        // ตั้งค่า State สิทธิ์การโพสต์จาก DB
        setAllowMembersToPost(data.allow_members_to_post ?? true)

        // แปลง Path รูปภาพเดิมเป็น Public URL สำหรับแสดงผล Preview
        if (data.avatar_url) setAvatarPreview(supabase.storage.from('groups').getPublicUrl(data.avatar_url).data.publicUrl)
        if (data.cover_url) setCoverPreview(supabase.storage.from('groups').getPublicUrl(data.cover_url).data.publicUrl)
      }

      setLoading(false)
    }

    fetchGroup()
  }, [groupId]) // ทำงานเมื่อ groupId เปลี่ยน

  // --- Logic: เลือกไฟล์รูปภาพและแสดงตัวอย่าง (Avatar) ---
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setAvatarFile(file)
    // สร้าง Object URL สำหรับแสดงตัวอย่าง (Preview)
    setAvatarPreview(file ? URL.createObjectURL(file) : null)
  }

  // --- Logic: เลือกไฟล์รูปภาพและแสดงตัวอย่าง (Cover) ---
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setCoverFile(file)
    // สร้าง Object URL สำหรับแสดงตัวอย่าง (Preview)
    setCoverPreview(file ? URL.createObjectURL(file) : null)
  }

  // --- Helper: ฟังก์ชันอัปโหลดไฟล์ไปยัง Storage ---
  const handleUploadFile = async (file: File, type: 'avatar' | 'cover'): Promise<string | undefined> => {
    if (!file) return undefined
    const folder = type === 'avatar' ? 'avatars' : 'covers'
    // สร้าง Path ที่ไม่ซ้ำกัน
    const filePath = `${folder}/${Date.now()}_${file.name}`

    // อัปโหลดไฟล์ไปยัง Bucket 'groups'
    const { error } = await supabase.storage.from('groups').upload(filePath, file)
    if (error) {
      console.error('Upload error:', error.message)
      return undefined
    }

    return filePath
  }

  // --- Logic: บันทึกการแก้ไข (Submit) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. ตรวจสอบสิทธิ์ผู้ใช้ (อย่างน้อยต้องล็อกอิน)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('กรุณาล็อกอินก่อนแก้ไขกลุ่ม')

      // 2. ดึงข้อมูลกลุ่มปัจจุบัน (เพื่อเอา Path รูปเก่า)
      const { data: currentGroup } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (!currentGroup) throw new Error('ไม่พบข้อมูลกลุ่ม')

      let avatarPath: string | undefined = undefined
      let coverPath: string | undefined = undefined

      // 3. จัดการรูป Avatar: ลบรูปเก่า -> อัปโหลดใหม่
      if (avatarFile) {
        if (currentGroup.avatar_url) {
          await supabase.storage.from('groups').remove([currentGroup.avatar_url]) // ลบรูปเก่า
        }
        avatarPath = await handleUploadFile(avatarFile, 'avatar') // อัปโหลดรูปใหม่
      }

      // 4. จัดการรูป Cover: ลบรูปเก่า -> อัปโหลดใหม่
      if (coverFile) {
        if (currentGroup.cover_url) {
          await supabase.storage.from('groups').remove([currentGroup.cover_url]) // ลบรูปเก่า
        }
        coverPath = await handleUploadFile(coverFile, 'cover') // อัปโหลดรูปใหม่
      }

      // 5. อัปเดตข้อมูลในฐานข้อมูล
      const { error } = await supabase
        .from('groups')
        .update({
          name,
          description,
          // อัปเดตฟิลด์สิทธิ์การโพสต์
          allow_members_to_post: allowMembersToPost,
          // อัปเดต Path รูปภาพ (ถ้ามีการอัปโหลดใหม่)
          ...(avatarPath ? { avatar_url: avatarPath } : {}), 
          ...(coverPath ? { cover_url: coverPath } : {})
        })
        .eq('id', groupId)

      if (error) throw error

      // สำเร็จ: กลับไปหน้ากลุ่ม
      router.push(`/groups/${groupId}`)
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
      else setError('เกิดข้อผิดพลาดไม่ทราบสาเหตุ')
    } finally {
      setLoading(false)
    }
  }

  return (
    // --- Container หลัก ---
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        
        {/* ส่วนที่ 1: แก้ไขรูปปก (Cover) */}
        <div className="relative w-full h-56 bg-gray-200 cursor-pointer group">
          <label className="w-full h-full block relative">
            {coverPreview ? (
              // แสดงรูป Preview/รูปเดิม
              <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg cursor-pointer">
                รูปหน้าปก
              </div>
            )}
            
            {/* Overlay แสดงเมื่อ Hover */}
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none"></div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <span className="bg-black/50 text-white px-4 py-2 rounded-full text-sm font-semibold">
                คลิกเพื่อแก้ไขรูป
              </span>
            </div>
            
            {/* Input รับไฟล์ */}
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="hidden"
            />
          </label>
        </div>

        {/* ส่วนที่ 2: แก้ไขรูปโปรไฟล์ (Avatar) */}
        <div className="relative -mt-12 flex justify-center cursor-pointer">
          <label className="relative group">
            {avatarPreview ? (
              // แสดงรูป Preview/รูปเดิม
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-28 h-28 rounded-full border-4 border-white object-cover shadow-lg"
              />
            ) : (
              <div className="w-28 h-28 bg-gray-300 rounded-full border-4 border-white flex items-center justify-center shadow-lg text-gray-400 cursor-pointer">
                รูปโปรไฟล์
              </div>
            )}
            
            {/* Overlay แสดงเมื่อ Hover */}
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none rounded-full"></div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-full">
              <span className="bg-black/50 text-white px-3 py-1 rounded-full text-xs font-semibold">
                แก้ไข
              </span>
            </div>
            
            {/* Input รับไฟล์ */}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
        </div>

        {/* ส่วนที่ 3: ฟอร์มแก้ไขข้อมูลทั่วไป */}
        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5">
          {error && <p className="text-red-500 text-center">{error}</p>}

          {/* Input ชื่อกลุ่ม */}
          <input
            type="text"
            placeholder="ชื่อกลุ่ม"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-3xl px-5 py-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            required
            disabled={loading}
          />

          {/* Textarea คำอธิบายกลุ่ม */}
          <textarea
            placeholder="คำอธิบายกลุ่ม"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-3xl px-5 py-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none transition"
            rows={4}
            disabled={loading}
          />
          
          {/* Checkbox สำหรับแก้ไขสิทธิ์การโพสต์ */}
          <div 
            className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-xl transition hover:bg-gray-50"
            onClick={() => setAllowMembersToPost(prev => !prev)}
          >
            <div 
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                allowMembersToPost 
                  ? 'bg-sky-600 border-sky-600' 
                  : 'bg-white border-gray-400'
              }`}
            >
              {allowMembersToPost && <Check className="w-4 h-4 text-white" />}
            </div>
            <label className="text-gray-800 text-sm font-medium cursor-pointer select-none">
              อนุญาตให้สมาชิกกลุ่มสามารถโพสต์ได้
            </label>
          </div>

          {/* ปุ่มดำเนินการ (ยกเลิก / บันทึก) */}
          <div className="flex justify-between gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-400 text-white py-3 rounded-2xl font-semibold shadow-md hover:bg-gray-500 transition flex-1 cursor-pointer hover:scale-105 active:scale-95"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="bg-sky-600 text-white py-3 rounded-2xl font-semibold shadow-md hover:bg-sky-700 transition flex-1 cursor-pointer hover:scale-105 active:scale-95 disabled:bg-sky-300"
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}