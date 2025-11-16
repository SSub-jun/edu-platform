"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "강의실", href: "/curriculum" },
  { label: "Q&A", href: "/qna" },
  { label: "내정보", href: "/student" },
  { label: "교육안내", href: "/guide" },
];

export function MainNav() {
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const [isStudent, setIsStudent] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setIsReady(true);
      setIsStudent(false);
      return;
    }

    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]!));
        setIsStudent(payload.role === "student");
      } else {
        setIsStudent(false);
      }
    } catch {
      setIsStudent(false);
    } finally {
      setIsReady(true);
    }
  }, []);

  if (!pathname || !isReady || !isStudent) return null;

  // 학생용 주요 화면에서만 보여주기
  // - 로그인/회원가입/회사배정/관리자/강사/포털 화면에서는 숨김
  const hideOnRoutes = [
    "/login",
    "/signup",
    "/company-assign",
    "/admin",
    "/instructor",
    "/portal",
  ];
  if (hideOnRoutes.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <header className="w-full border-b border-border bg-surface/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 md:py-4">
        <Link href="/curriculum" className="flex items-center gap-2">
          <span className="text-base md:text-lg font-bold text-text-primary tracking-tight">
            KIST 교육센터
          </span>
        </Link>
        <nav className="flex items-center gap-1 md:gap-2 text-sm md:text-base flex-grow justify-end">
          {navItems.map((item, index) => {
            const isActive =
              item.href === "/curriculum"
                ? pathname === "/curriculum"
                : pathname.startsWith(item.href);

            return (
              <div key={item.href} className="flex items-center">
                {index > 0 && (
                  <div className="h-4 mx-2 border-l border-border opacity-40" />
                )}
                <Link
                  href={item.href}
                  className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full font-medium transition-colors ${isActive
                      ? "bg-primary text-white"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-primary"
                    }`}
                >
                  {item.label}
                </Link>
              </div>
            );
          })}
        </nav>
      </div>
    </header>
  );
}


