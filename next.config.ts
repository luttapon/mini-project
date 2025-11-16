import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qszumcgdfsttpizjheph.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/avatars/**', // avatar
      },
      {
        protocol: 'https',
        hostname: 'qszumcgdfsttpizjheph.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/groups/**', // cover
      },
      {
        protocol: 'https',
        hostname: 'qszumcgdfsttpizjheph.supabase.co',
        port: '',
        pathname: '/storage/v1/object/sign/post_media/**', // เพิ่มสำหรับโพสต์ media
      },
      {
        protocol: 'https',
        hostname: 'placehold.co', // placeholder
        port: '',
      },
    ],
  },
};

export default nextConfig;
