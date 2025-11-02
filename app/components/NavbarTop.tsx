import Link from "next/link";
import Image from "next/image";

export const NavbarTop = () => {
  return (
    <nav className="flex justify-between items-center bg-cyan-400 px-8 py-2 gap-6 fixed top-0 left-0 w-full z-50 h-20">
      <div className="flex-1">
        <Link href="/dashboard" > 
          HOME 
        </Link>
      </div>
      <div className="flex-1 flex justify-center">
        <input
          type="text"
          placeholder="Search..."
          className="px-4 py-2 
            rounded-full 
            border-none 
            text-base 
            bg-white
            text-gray-700 
            placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-yellow-400 
            max-w-md
            "
        ></input>
      </div>
      <div className="flex-1 flex justify-end items-center gap-6">
        <button
          className="p-2 rounded-full 
            text-yellow-400 
            hover:text-white hover:bg-yellow-300
            active:bg-white active:text-gray-200
            transition-colors"
          aria-label="Notifications"
        >
            <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-8 w-8" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={2}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
            />
          </svg>
        </button>
      </div>
      <div className="w-10 h-10 rounded-full overflow-hidden ring-3 ring-yellow-400">
        <Link href="/profile">
          <Image
            src="/profile-icon.png"
            alt="Profile Icon"
            width={40}  
            height={40}
          />
        </Link>
      </div>
    </nav>
  );
};
