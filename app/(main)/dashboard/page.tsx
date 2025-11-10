"use client";
import React, { useState, useEffect } from 'react';
import { Home, Users, Bell, Menu, UserPlus, Send, ThumbsUp, MessageCircle, Share2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Mock useRouter
const useRouter = () => ({
  push: (path: string) => console.log(`Navigating to: ${path}`),
});

// กำหนดประเภทของแท็บที่ใช้ในการนำทาง
type Tab = 'Home' | 'Friends' | 'Notifications' | 'Settings';

// กำหนดประเภทของข้อมูลโพสต์
interface Post {
  id: number;
  author: string;
  authorInitial: string;
  authorColor: string;
  content: string;
  time: string;
  likes: number;
  comments: number;
  isLiked: boolean;
}

// --- 1. Main Content Components (เนื้อหาหลักตามแท็บที่เลือก) ---

/**
 * คอมโพเนนต์สำหรับการแสดงปุ่ม Like, Comment, Share
 */
const PostAction: React.FC<{ icon: React.ElementType, count: number, label: string, onClick: () => void, isActive?: boolean }> = ({ icon: Icon, count, label, onClick, isActive = false }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-1 py-2 px-3 rounded-full transition duration-150 text-sm ${isActive ? 'text-blue-600 bg-blue-50 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}
    aria-label={label}
  >
    <Icon size={18} />
    <span>{count}</span>
    <span className="hidden sm:inline-block">{label}</span>
  </button>
);

/**
 * คอมโพเนนต์สำหรับฟอร์มสร้างโพสต์ใหม่
 */
const CreatePostForm: React.FC<{ onPostSubmit: (content: string) => void }> = ({ onPostSubmit }) => {
  const [postContent, setPostContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (postContent.trim()) {
      onPostSubmit(postContent.trim());
      setPostContent(''); // ล้างเนื้อหาหลังโพสต์
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-blue-200 mb-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-3">สร้างโพสต์ใหม่ 📝</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows={4}
          placeholder="คุณกำลังคิดอะไรอยู่? แชร์ให้เพื่อนๆ ของคุณรู้สิ..."
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          required
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!postContent.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-full transition duration-150 disabled:bg-blue-300 flex items-center"
          >
            <Send size={18} className="mr-2" />
            โพสต์
          </button>
        </div>
      </form>
    </div>
  );
};

//ตัวอย่างคอมโพเนนต์สำหรับแต่ละแท็บ
const HomeFeed: React.FC = () => {
  // State สำหรับจัดการรายการโพสต์
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      author: "Andy W.",
      authorInitial: "A",
      authorColor: "bg-blue-400",
      content: "ยินดีต้อนรับสู่ Our Zone! แพลตฟอร์มใหม่ที่น่าตื่นเต้นนี้ดูดีมากๆ เลยครับ ใครมีไอเดียกิจกรรมสนุกๆ มาแชร์กันบ้างครับ? #OurZoneCommunity",
      time: "เมื่อ 5 นาทีที่แล้ว",
      likes: 12,
      comments: 5,
      isLiked: false,
    },
    {
      id: 2,
      author: "Beth C.",
      authorInitial: "B",
      authorColor: "bg-pink-400",
      content: "ฉันกำลังมองหาเพื่อนร่วมทีมสำหรับโปรเจกต์ด้าน Web Development ใครสนใจบ้างคะ? ติดต่อมาได้เลย! 💻",
      time: "เมื่อ 2 ชั่วโมงที่แล้ว",
      likes: 25,
      comments: 10,
      isLiked: true,
    },
  ]);

  // ฟังก์ชันสำหรับเพิ่มโพสต์ใหม่
  const handleNewPost = (content: string) => {
    const newPost: Post = {
      id: Date.now(), // ใช้ timestamp เป็น ID
      author: "คุณ (User)", // ผู้ใช้ที่โพสต์
      authorInitial: "U",
      authorColor: "bg-green-500",
      content: content,
      time: "เมื่อสักครู่",
      likes: 0,
      comments: 0,
      isLiked: false,
    };
    // เพิ่มโพสต์ใหม่ไว้ด้านบนสุดของรายการ
    setPosts([newPost, ...posts]);
    console.log("โพสต์ใหม่ถูกสร้าง:", content);
    alert("โพสต์ของคุณถูกสร้างแล้ว! (จำลอง)");
  };

  // ฟังก์ชันสำหรับจัดการการกดไลก์
  const handleLikeToggle = (postId: number) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const newLikes = post.isLiked ? post.likes - 1 : post.likes + 1;
        return {
          ...post,
          likes: newLikes,
          isLiked: !post.isLiked
        };
      }
      return post;
    }));
  };

  return (
    <div className="space-y-4 p-4 md:p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">หน้าหลักและฟีด (Home Feed)</h2>

      {/* เพิ่มฟอร์มสร้างโพสต์ */}
      <CreatePostForm onPostSubmit={handleNewPost} />
      
      {/* ส่วนแสดงโพสต์ */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200">
            {/* Header: Author Info */}
            <div className="flex items-center space-x-3 mb-3 border-b pb-2">
              <div className={`w-10 h-10 ${post.authorColor} rounded-full flex items-center justify-center text-white font-bold text-sm`}>{post.authorInitial}</div>
              <div>
                <div className="font-semibold text-gray-900">{post.author}</div>
                <div className="text-xs text-gray-400">{post.time}</div>
              </div>
            </div>

            {/* Content */}
            <p className="text-gray-700 mb-4">{post.content}</p>

            {/* Actions (Like, Comment, Share) */}
            <div className="flex justify-around border-t pt-2">
              <PostAction
                icon={ThumbsUp}
                count={post.likes}
                label="ไลก์"
                onClick={() => handleLikeToggle(post.id)}
                isActive={post.isLiked}
              />
              <PostAction
                icon={MessageCircle}
                count={post.comments}
                label="คอมเมนต์"
                // ฟังก์ชันจำลอง: แค่แสดง Alert เมื่อกด
                onClick={() => alert(`คุณต้องการคอมเมนต์ในโพสต์ของ ${post.author} ใช่หรือไม่?`)}
              />
              <PostAction
                icon={Share2}
                count={0}
                label="แชร์"
                // ฟังก์ชันจำลอง: แค่แสดง Alert เมื่อกด
                onClick={() => alert("กำลังแชร์โพสต์... (จำลอง)")}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


const FriendsPage: React.FC = () => (
  <div className="p-4 md:p-6 bg-white rounded-xl shadow-lg">
    <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4">ค้นหาและเพิ่มเพื่อน (Add Friends)</h2>
    <p className="text-gray-600 mb-6">คุณสามารถเพิ่มเพื่อนเพื่อติดตามกิจกรรมของพวกเขาได้</p>

    {/* รายการเพื่อนจำลอง */}
    <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 space-y-3">
      {[
        { name: "John S.", mutual: 5 },
        { name: "Lisa M.", mutual: 2 },
        { name: "Mark K.", mutual: 0 },
      ].map((user, index) => (
        <div key={index} className="flex items-center justify-between p-2 border-b last:border-b-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-800 font-bold">U</div>
            <div>
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-gray-500">{user.mutual > 0 ? `${user.mutual} เพื่อนร่วมกัน` : 'ไม่มีเพื่อนร่วมกัน'}</div>
            </div>
          </div>
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-3 rounded-full text-sm transition duration-150 flex items-center">
            <UserPlus size={16} className="mr-1" />
            เพิ่ม
          </button>
        </div>
      ))}
    </div>
  </div>
);


const NotificationsPage: React.FC = () => (
  <div className="p-4 md:p-6 bg-white rounded-xl shadow-lg">
    <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4">แจ้งเตือน (Notifications)</h2>
    <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 space-y-2">
      {/* รายการแจ้งเตือนจำลอง */}
      <NotificationItem text="Andy W. ได้แสดงความรู้สึกต่อโพสต์ของคุณ" time="1 นาทีที่แล้ว" isNew={true} />
      <NotificationItem text="Mark K. ได้ตอบกลับความคิดเห็นของคุณ" time="30 นาทีที่แล้ว" isNew={true} />
      <NotificationItem text="มีผู้ติดตามคุณ 2 คนใหม่" time="1 วันที่แล้ว" isNew={false} />
    </div>
  </div>
);

// คอมโพเนนต์สำหรับแสดงรายการแจ้งเตือนแต่ละรายการ
const NotificationItem: React.FC<{ text: string, time: string, isNew: boolean }> = ({ text, time, isNew }) => (
  <div className={`flex items-start p-3 rounded-lg transition duration-150 ${isNew ? 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-gray-50'}`}>
    {/* จุดสีแดงแสดงว่าเป็นการแจ้งเตือนใหม่ */}
    {isNew && <span className="w-2 h-2 rounded-full bg-red-500 mr-3 mt-1 flex-shrink-0"></span>}
    <div className="flex-1">
      <p className={`text-gray-800 ${isNew ? 'font-medium' : 'font-normal'}`}>{text}</p>
      <p className="text-xs text-gray-500 mt-0.5">{time}</p>
    </div>
  </div>
);

const SettingsPage: React.FC = () => (
  <div className="p-4 md:p-6 bg-white rounded-xl shadow-lg">
    <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4">เมนูและตั้งค่า (Menu & Settings)</h2>
    {/* รายการตั้งค่าจำลอง */}
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 space-y-4">
      <MenuItem icon="Profile" title="ข้อมูลส่วนตัว" description="จัดการข้อมูลโปรไฟล์ของคุณ" />
      <MenuItem icon="Security" title="ความปลอดภัยและความเป็นส่วนตัว" description="ตั้งค่ารหัสผ่านและสิทธิ์การเข้าถึง" />
      <MenuItem icon="Help" title="ช่วยเหลือและสนับสนุน" description="ติดต่อทีมงานหรือค้นหาคำถามที่พบบ่อย" />
    </div>
  </div>
);

// คอมโพเนนต์สำหรับแสดงรายการเมนูย่อยในการตั้งค่า
const MenuItem: React.FC<{ icon: string, title: string, description: string }> = ({ title, description }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer border">
    <div>
      <div className="font-medium text-gray-800">{title}</div>
      <div className="text-sm text-gray-500">{description}</div>
    </div>
    {/* ไอคอนลูกศรชี้ไปทางขวา */}
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <path d="m9 18 6-6-6-6" />
    </svg>
  </div>
);

// คอมโพเนนต์หลักที่เลือกแสดงเนื้อหาตามแท็บที่ถูกเลือก
const MainContent: React.FC<{ activeTab: Tab }> = ({ activeTab }) => {
  switch (activeTab) {
    case 'Home':
      return <HomeFeed />; // แสดงหน้าฟีดหลัก
    case 'Friends':
      return <FriendsPage />; // แสดงหน้าค้นหาเพื่อน
    case 'Notifications':
      return <NotificationsPage />; // แสดงหน้าแจ้งเตือน
    case 'Settings':
      return <SettingsPage />; // แสดงหน้าตั้งค่าและเมนู
    default:
      return <div className="p-4 text-center text-gray-500">เลือกแท็บเพื่อเริ่มต้น</div>;
  }
};

// --- 2. Navigation Components (แถบนำทาง) ---

// คอมโพเนนต์สำหรับรายการนำทางใน Sidebar
const NavIcon: React.FC<{
  icon: React.ElementType,
  tab: Tab,
  activeTab: Tab,
  onClick: (tab: Tab) => void,
  label: string
}> = ({ icon: Icon, tab, activeTab, onClick, label }) => {
  const isActive = activeTab === tab;
  // กำหนดคลาสสำหรับสถานะที่ถูกเลือก (Active) หรือไม่ถูกเลือก (Inactive)
  const activeClasses = isActive
    ? 'bg-blue-100 text-blue-600 border-l-4 border-blue-600 font-semibold' // Active: พื้นหลังสีฟ้าอ่อนและเส้นขอบซ้ายสีน้ำเงิน
    : 'text-gray-600 hover:bg-gray-100 hover:text-blue-500'; // Inactive: มีเอฟเฟกต์ Hover

  return (
    <button
      onClick={() => onClick(tab)}
      // คลาสพื้นฐาน: เต็มความกว้าง, จัดวางแบบ Flex, จัดกึ่งกลางไอคอนบนมือถือ
      className={`w-full flex items-center justify-center md:justify-start py-3 px-4 rounded-lg transition duration-200 ${activeClasses} focus:outline-none`}
      aria-label={label}
    >
      <Icon size={24} className="flex-shrink-0" />
      {/* ป้ายชื่อ (Label) จะซ่อนบนมือถือ (w-16) และแสดงบนเดสก์ท็อป (w-64) */}
      <span className="text-sm ml-4 hidden md:block">{label}</span>
    </button>
  );
};

// --- 3. Main Application Component (คอมโพเนนต์หลักของแอปพลิเคชัน) ---

const App: React.FC = () => {
  // ตั้งค่า State สำหรับการเปลี่ยนแท็บ
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const router = useRouter(); // Mock router

  // สไตล์สำหรับโลโก้ Our Zone (ใช้ฟอนต์ Pacifico)
  const logoStyle = {
    fontFamily: "'Pacifico', cursive",
    letterSpacing: '0.5px',
  };

  // โหลดฟอนต์ Pacifico จาก Google Fonts เมื่อคอมโพเนนต์ถูกเมาท์
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // กำหนดความกว้างของ Sidebar ที่ใช้ในการผลักเนื้อหาหลัก (w-16 บนมือถือ, w-64 บนเดสก์ท็อป)
  const sidebarWidthClass = 'ml-16 md:ml-64';

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* SIDEBAR (แถบเมนูหลักด้านซ้าย: แถบนำทางหลัก) */}
      <header className="fixed left-0 top-37 h-full w-16 md:w-64 bg-white shadow-xl z-20 transition-all duration-300 border-r border-gray-200">
        <div className="flex flex-col h-full">

          {/* TOP: Logo and Name (ส่วนหัวของ Sidebar) */}
          <div className="flex items-center justify-center md:justify-start px-4 h-16 border-b border-gray-100 flex-shrink-0">
            {/* */}
            <div className="w-10  h-10 rounded-full flex items-center justify-center text-whi font-extrabold ">
              <Link href="/dashboard">
                <Image src="/logo.jpg" alt="Profile Icon" width={60} height={60} />
              </Link>
            </div>

            <h1 className="text-2xl text-gray-800 ml-3 hidden md:block" style={logoStyle} >
              <Link href="/dashboard">  Our Zone </Link>
            </h1>
          </div>

          {/* MIDDLE: Navigation Tabs (เมนูนำทาง) */}
          {/* ใช้ flex-grow เพื่อให้เมนูนำทางใช้พื้นที่ที่เหลือทั้งหมด (เนื่องจากลบ Auth Buttons ออก) */}
          <nav className="flex flex-col space-y-1 p-2 flex-grow overflow-y-auto">
            <NavIcon icon={Home} tab="Home" activeTab={activeTab} onClick={setActiveTab} label="หน้าหลัก" />
            <NavIcon icon={Users} tab="Friends" activeTab={activeTab} onClick={setActiveTab} label="เพื่อน" />
            <NavIcon icon={Bell} tab="Notifications" activeTab={activeTab} onClick={setActiveTab} label="แจ้งเตือน" />
            <NavIcon icon={Menu} tab="Settings" activeTab={activeTab} onClick={setActiveTab} label="เมนู" />
          </nav>
        </div>
      </header>

      {/* Main Content Area (พื้นที่เนื้อหาหลัก) */}
      {/* ต้องมี margin ด้านซ้ายเพื่อไม่ให้ชนกับ Sidebar และทำให้เนื้อหาอยู่ตรงกลางอย่างสวยงาม */}
      <main className={`${sidebarWidthClass} pt-4 pb-10 transition-all duration-300 min-h-screen`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-0">
          <MainContent activeTab={activeTab} />
        </div>
      </main>

      {/* Footer (ส่วนท้าย) */}
      <footer className={`py-4 text-center text-xs text-gray-400 mt-8 border-t border-gray-200 ${sidebarWidthClass}`}>
        &copy; 2024 Our Zone Community. All rights reserved.
      </footer>
    </div>
  );
};

export default App;