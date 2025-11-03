import Image from "next/image";

type ProfileData = {
  avatarSrc: string | null;
  name: string;
  description: string;
};

type PostPreview = {
  id: string;
  title: string;
  summary: string;
};

// Ready to be replaced once backend data is available
const profileData: ProfileData = {
  avatarSrc: "/profile.jpg",
  name: "tewan",
  description: "คำอธิบาย",
};

const userPosts: PostPreview[] = [];


export default function Page() {
  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-amber-50 px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <section className="overflow-hidden rounded-3xl border border-sky-200 bg-white shadow-xl shadow-sky-100">
          <div className="h-36 w-full bg-linear-to-r from-sky-400 via-blue-900 to-blue-900"/>
          <div className="px-15 pb-6">
            <div className="-mt-16 flex flex-wrap items-end gap-7">
              <div className="relative h-32 w-32">
                {profileData.avatarSrc ? (
                  <Image
                    src={profileData.avatarSrc}
                    alt="Profile avatar of the AquaSphere community manager"

                    fill
                    priority
                    sizes="128px"
                    className="rounded-2xl border-4 border-white object-cover shadow-xl shadow-sky-200"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-2xl border-4 border-dashed border-white bg-sky-100 text-sky-500">
                    <span className="text-xs font-medium">รอข้อมูลรูปภาพ</span>
                  </div>
                )}
              </div>
              <div className="grow">
                <h1 className="text-3xl font-semibold text-sky-950">{profileData.name}</h1>
                <p className="mt-1 text-sm text-sky-700">{profileData.description}</p>
              </div>
              <button className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 cursor-pointer">
                แก้ไขโปรไฟล์
              </button>
            </div>
            <div className="mt-6">
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-sky-200 bg-white p-6 shadow-lg shadow-sky-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-sky-950">โพสต์ของ {profileData.name}</h2>
            <span className="text-sm text-sky-600">{userPosts.length} โพสต์</span>
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-sky-200 bg-sky-50 p-6 text-center text-sky-600">
            <p className="text-sm font-medium">รอข้อมูลโพสต์จาก backend</p>
          </div>
        </section>
      </div>
    </div>
  );
}
