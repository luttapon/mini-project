'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function EditGroupPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.groupId as string

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // --- โหลดข้อมูลเดิมของกลุ่ม ---
  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupId) return
      setLoading(true)

      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (error) {
        console.error(error)
        setError('ไม่สามารถโหลดข้อมูลกลุ่มได้')
      } else if (data) {
        setName(data.name)
        setDescription(data.description || '')
        if (data.avatar_url) setAvatarPreview(supabase.storage.from('groups').getPublicUrl(data.avatar_url).data.publicUrl)
        if (data.cover_url) setCoverPreview(supabase.storage.from('groups').getPublicUrl(data.cover_url).data.publicUrl)
      }

      setLoading(false)
    }

    fetchGroup()
  }, [groupId])

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

  const handleUploadFile = async (file: File, type: 'avatar' | 'cover'): Promise<string | undefined> => {
  if (!file) return undefined
  const folder = type === 'avatar' ? 'avatars' : 'covers'
  const filePath = `${folder}/${Date.now()}_${file.name}`

  const { error } = await supabase.storage.from('groups').upload(filePath, file)
  if (error) {
    console.error('Upload error:', error.message)
    return undefined
  }

  return filePath
}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
  setLoading(true)
  setError('')

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('กรุณาล็อกอินก่อนแก้ไขกลุ่ม')

    // --- โหลดข้อมูลกลุ่มปัจจุบันเพื่อดู path เก่า ---
    const { data: currentGroup } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()

    if (!currentGroup) throw new Error('ไม่พบข้อมูลกลุ่ม')

    let avatarPath: string | undefined = undefined
    let coverPath: string | undefined = undefined

    // --- ถ้ามีรูปใหม่ ให้ลบรูปเก่า ---
    if (avatarFile) {
      if (currentGroup.avatar_url) {
        await supabase.storage.from('groups').remove([currentGroup.avatar_url])
      }
      avatarPath = await handleUploadFile(avatarFile, 'avatar')
    }

    if (coverFile) {
      if (currentGroup.cover_url) {
        await supabase.storage.from('groups').remove([currentGroup.cover_url])
      }
      coverPath = await handleUploadFile(coverFile, 'cover')
    }

    // --- อัปเดตข้อมูลกลุ่ม ---
    const { error } = await supabase
      .from('groups')
      .update({
        name,
        description,
        ...(avatarPath ? { avatar_url: avatarPath } : {}),
        ...(coverPath ? { cover_url: coverPath } : {})
      })
      .eq('id', groupId)

    if (error) throw error

    router.push(`/groups/${groupId}`)
  } catch (err: unknown) {
    if (err instanceof Error) setError(err.message)
    else setError('เกิดข้อผิดพลาดไม่ทราบสาเหตุ')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Cover */}
        <div className="relative w-full h-56 bg-gray-200 cursor-pointer">
          <label className="w-full h-full block">
            {coverPreview ? (
              <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">
                Cover Preview
              </div>
            )}
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
          <label>
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-28 h-28 rounded-full border-4 border-white object-cover shadow-lg"
              />
            ) : (
              <div className="w-28 h-28 bg-gray-300 rounded-full border-4 border-white flex items-center justify-center shadow-lg text-gray-400">
                Avatar
              </div>
            )}
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

          <div className="flex justify-between gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-400 text-white py-3 rounded-2xl font-semibold shadow-md hover:bg-gray-500 transition flex-1"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-sky-600 text-white py-3 rounded-2xl font-semibold shadow-md hover:bg-sky-700 transition flex-1"
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
