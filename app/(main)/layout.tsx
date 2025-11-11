
import { NavbarTop } from "@/app/components/NavbarTop";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <>
          <NavbarTop />
          {/* <main> tag นี้ควรจะห่อหุ้ม {children} */}
          <main className="min-h-screen pt-25">
            {children}
          </main>
       </>
    );
}