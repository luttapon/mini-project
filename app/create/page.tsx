'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function CreateGroupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setAvatarFile(file)
    setAvatarPreview(file ? URL.createObjectURL(file) : null)
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setCoverFile(file)
    setCoverPreview(file ? URL.createObjectURL(file) : null)
  }

  const handleUploadFile = async (file: File, type: 'avatar' | 'cover') => {
    if (!file) return null
    const folder = type === 'avatar' ? 'avatars' : 'covers'
    const filePath = `${folder}/${Date.now()}_${file.name}`

    const { error } = await supabase.storage.from('groups').upload(filePath, file)
    if (error) {
      console.error('Upload error:', error.message)
      return null
    }

    return filePath
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const user = await supabase.auth.getUser()
      if (!user.data.user) throw new Error('กรุณาล็อกอินก่อนสร้างกลุ่ม')

      const avatarPath = avatarFile ? await handleUploadFile(avatarFile, 'avatar') : null
      const coverPath = coverFile ? await handleUploadFile(coverFile, 'cover') : null

      const { data, error } = await supabase
        .from('groups')
        .insert([{
          name,
          description,
          avatar_url: avatarPath,
          cover_url: coverPath,
          owner_id: user.data.user.id
        }])
        .select()

      if (error) throw error

      router.push('/groups')
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

  // --- ฟังก์ชันยกเลิก ---
  const handleCancel = () => {
    // ล้างฟอร์ม
    setName('')
    setDescription('')
    setAvatarFile(null)
    setCoverFile(null)
    setAvatarPreview(null)
    setCoverPreview(null)
    setError('')
    // ไปหน้ากลุ่มทั้งหมด
    router.push('/myGroups')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Cover */}
        <div className="relative w-full h-56 bg-gray-200 cursor-pointer group">
          <label className="w-full h-full block relative">
            {coverPreview ? (
              <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg cursor-pointer">
                รูปหน้าปก
              </div>
            )}
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Avatar */}
        <div className="relative -mt-12 flex justify-center cursor-pointer">
          <label className="relative group">
            {avatarPreview ? (
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
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none rounded-full"></div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5">
          {error && <p className="text-red-500 text-center">{error}</p>}

          <input
            type="text"
            placeholder="ชื่อกลุ่ม"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-3xl px-5 py-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            required
          />

          <textarea
            placeholder="คำอธิบายกลุ่ม"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-3xl px-5 py-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none transition"
            rows={4}
          />

          {/* ปุ่ม Submit + Cancel */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-sky-600 text-white py-3 rounded-2xl font-semibold shadow-md hover:bg-sky-700 transition cursor-pointer hover:scale-105 active:scale-95"
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
