
import { NavbarTop } from "@/app/components/NavbarTop";
import { NavbarSub } from "@/app/components/NavbarSub";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <>
          <NavbarTop />
          <NavbarSub />
          {/* <main> tag นี้ควรจะห่อหุ้ม {children} */}
          <main className="min-h-screen pt-30">
            {children}
          </main>
       </>
    );
}