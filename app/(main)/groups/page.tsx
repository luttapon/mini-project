'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { UsersRound } from 'lucide-react'

interface Group {
  id: string
  name: string
  description: string | null
  avatar_url: string | null
  cover_url: string | null
  owner_id: string
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true)
      setError('')

      const { data, error } = await supabase.from('groups').select('*')

      if (error) {
        console.error('Error fetching groups:', error.message)
        setError('เกิดข้อผิดพลาดในการโหลดกลุ่ม')
      } else {
        setGroups(data)
      }
      setLoading(false)
    }

    fetchGroups()
  }, [])

  const avatarPlaceholder = '/default-avatar.png'
  const coverPlaceholder = '/default-cover.png'

  return (
    <div className="min-h-screen bg-gray-50 p-10 flex flex-col items-center">
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl p-8 shadow-lg mb-8 w-full max-w-6xl">
        <h1 className="text-4xl font-extrabold text-white tracking-tight text-center">
          👥 กลุ่มทั้งหมด
        </h1>
        <p className="text-sky-100 mt-2 text-sm text-center">
          สำรวจและเข้าร่วมกลุ่มที่คุณสนใจ
        </p>
      </div>

      {loading && <p className="text-center text-gray-500">กำลังโหลด...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      <div className="flex flex-wrap justify-center gap-6 w-full max-w-6xl">
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
                {group.avatar_url ? (
                  <img src={avatarUrl} alt={group.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <UsersRound className="w-10 h-10 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Name */}
              <h2 className="absolute bottom-16 w-full text-center text-white text-xl sm:text-2xl font-extrabold break-words line-clamp-2 p-2"
>
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
          ยังไม่มีกลุ่มในระบบ
        </p>
      )}
    </div>
  )
}
