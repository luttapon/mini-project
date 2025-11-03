"use client";
import React, { useState, useEffect } from 'react';
import { Home, Users, Bell, Menu, UserPlus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
const useRouter = () => ({
  push: (path: string) => console.log(`Navigating to: ${path}`),
});


// กำหนดประเภทของแท็บที่ใช้ในการนำทาง
type Tab = 'Home' | 'Friends' | 'Notifications' | 'Settings';

// --- 1. Main Content Components (เนื้อหาหลักตามแท็บที่เลือก) ---

//ตัวอย่างคอมโพเนนต์สำหรับแต่ละแท็บ
const HomeFeed: React.FC = () => (
  <div className="space-y-4 p-4 md:p-6 bg-white rounded-xl shadow-lg">
    <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">ฟีด (Feed)</h2>
    <p className="text-gray-500">ที่นี่คือส่วนของโพสต์และกิจกรรมต่างๆ ที่คุณติดตาม</p>

    {/* Mock Post 1 (โพสต์จำลอง 1) */}
    <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold text-sm">A</div>
        <div className="font-semibold text-gray-900">Andy W.</div>
      </div>
      <p className="text-gray-700">ยินดีต้อนรับสู่ Our Zone! แพลตฟอร์มใหม่ที่น่าตื่นเต้นนี้ดูดีมากๆ เลยครับ ใครมีไอเดียกิจกรรมสนุกๆ มาแชร์กันบ้างครับ? #OurZoneCommunity</p>
      <div className="flex justify-end text-sm text-gray-400 mt-2">
        <span>เมื่อ 5 นาทีที่แล้ว</span>
      </div>
    </div>

    {/* Mock Post 2 (โพสต์จำลอง 2) */}
    <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 bg-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm">B</div>
        <div className="font-semibold text-gray-900">Beth C.</div>
      </div>
      <p className="text-gray-700">ฉันกำลังมองหาเพื่อนร่วมทีมสำหรับโปรเจกต์ด้าน Web Development ใครสนใจบ้างคะ? ติดต่อมาได้เลย! 💻</p>
      <div className="flex justify-end text-sm text-gray-400 mt-2">
        <span>เมื่อ 2 ชั่วโมงที่แล้ว</span>
      </div>
    </div>
  </div>
);

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
            {/* <!-- Placeholder: โลโก้เว็บ --> */}
            <div className="w-10  h-10 rounded-full flex items-center justify-center text-whi font-extrabold ">
              <Link href="/dashboard">
                <Image src="/logo.jpg" alt="Profile Icon" width={60} height={60} />
              </Link>
            </div>

            <h1 className="text-2xl text-gray-800 ml-3 hidden md:block" style={logoStyle} >
              <Link href="/dashboard">  Our Zone </Link>
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
