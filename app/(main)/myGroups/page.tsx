'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { PlusCircle } from 'lucide-react'

interface Group {
  id: string
  name: string
  description: string | null
  avatar_url: string | null
  cover_url: string | null
  owner_id: string
}

export default function MyGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserAndGroups = async () => {
      setLoading(true)
      setError('')
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('คุณยังไม่ได้ล็อกอิน')
        setLoading(false)
        return
      }

      setUserId(user.id)

      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('owner_id', user.id)

      if (error) {
        console.error('Error fetching my groups:', error.message)
        setError('เกิดข้อผิดพลาดในการโหลดกลุ่มของฉัน')
      } else {
        setGroups(data)
      }

      setLoading(false)
    }

    fetchUserAndGroups()
  }, [])

  const avatarPlaceholder = '/default-avatar.png'
  const coverPlaceholder = '/default-cover.png'

  return (
    <div className="min-h-screen bg-gray-50 p-10 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-8 text-center text-sky-700">
        กลุ่มของฉัน
      </h1>

      {loading && <p className="text-center text-gray-500">กำลังโหลด...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      <div className="flex flex-wrap justify-center gap-6 w-full max-w-6xl">
        {/* ปุ่มสร้างกลุ่มใหม่ แบบเดิม */}
        <Link
          href="/create"
          className="w-52 h-60 rounded-2xl shadow-md flex flex-col items-center justify-center border-2 border-dashed border-sky-400 hover:border-sky-600 hover:scale-105 transform transition cursor-pointer bg-white"
        >
          <PlusCircle className="w-12 h-12 text-sky-500" />
          <span className="mt-4 text-lg font-semibold text-sky-700 text-center">
            สร้างกลุ่มใหม่
          </span>
        </Link>

        {/* Card กลุ่มของฉัน */}
        {groups.map((group) => {
          const avatarUrl = group.avatar_url
            ? supabase.storage.from('groups').getPublicUrl(group.avatar_url).data.publicUrl
            : avatarPlaceholder
          const coverUrl = group.cover_url
            ? supabase.storage.from('groups').getPublicUrl(group.cover_url).data.publicUrl
            : coverPlaceholder

          return (
            <div
              key={group.id}
              className="w-52 h-60 rounded-2xl shadow-md overflow-hidden cursor-pointer transform hover:scale-105 transition relative"
              style={{
                backgroundImage: `url(${coverUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/40"></div>
              {/* Avatar */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img src={avatarUrl} alt={group.name} className="w-full h-full object-cover" />
              </div>

              {/* Name */}
              <h2 className="absolute bottom-16 w-full text-center text-white text-xl sm:text-2xl font-extrabold break-words line-clamp-2 p-2">
                {group.name}
              </h2>

              {/* Button */}
              <Link
                href={`/groups/${group.id}`}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-40 text-center bg-sky-600 text-white py-2 rounded-xl font-medium hover:bg-sky-700 transition"
              >
                ดูรายละเอียด
              </Link>
            </div>
          )
        })}
      </div>

      {!loading && groups.length === 0 && (
        <p className="text-center text-gray-400 mt-10 text-lg">
          คุณยังไม่มีกลุ่มในระบบ
        </p>
      )}
    </div>
  )
}
