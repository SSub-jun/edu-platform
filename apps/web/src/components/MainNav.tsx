"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe2 } from "lucide-react";
import { localeLabels, supportedLocales, type Locale } from "../i18n/config";
import { useLocale, useT } from "../i18n/client";

const navItems = [
  { labelKey: "nav.classroom", fallback: "강의실", href: "/curriculum" },
  { labelKey: "nav.qna", fallback: "Q&A", href: "/qna" },
  { labelKey: "nav.myInfo", fallback: "내정보", href: "/student" },
  { labelKey: "nav.guide", fallback: "교육안내", href: "/guide" },
];

export function MainNav() {
  const pathname = usePathname();
  const { locale, setLocale } = useLocale();
  const t = useT(locale);
  const [isReady, setIsReady] = useState(false);
  const [isStudent, setIsStudent] = useState(false);

  const handleLocaleChange = (nextLocale: Locale) => {
    if (nextLocale === locale) return;

    setLocale(nextLocale);
    window.location.reload();
  };

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
    "/reset-password",
    "/company-assign",
    "/admin",
    "/instructor",
    "/portal",
  ];
  if (hideOnRoutes.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
        <Link href="/curriculum" className="flex items-center gap-3">
          <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-base font-black text-white">
            K
          </span>
          <span className="text-lg font-black tracking-tight text-text-primary md:text-xl">
            {t("nav.brand")}
          </span>
        </Link>
        <nav className="grid w-full grid-cols-2 gap-2 text-sm md:flex md:w-auto md:items-center md:justify-end md:text-base">
          {navItems.map((item) => {
            const isActive =
              item.href === "/curriculum"
                ? pathname === "/curriculum"
                : pathname.startsWith(item.href);

            return (
              <div key={item.href} className="flex w-full items-center md:w-auto md:shrink-0">
                <Link
                  href={item.href}
                  className={`inline-flex min-h-10 w-full items-center justify-center rounded-lg px-4 py-2 text-center font-bold transition-colors md:w-auto ${isActive
                      ? "bg-primary text-white shadow-sm"
                      : "border border-border bg-bg-elevated text-text-secondary hover:text-text-primary"
                    }`}
                >
                  {t(item.labelKey) || item.fallback}
                </Link>
              </div>
            );
          })}
          <div className="relative col-span-2 w-full shrink-0 md:col-span-1 md:ml-2 md:w-auto">
            <Globe2
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
            />
            <select
              value={locale}
              onChange={(event) => handleLocaleChange(event.target.value as Locale)}
              aria-label="Language"
              className="h-10 w-full rounded-lg border-2 border-border bg-bg-elevated pl-9 pr-2 text-xs font-bold text-text-secondary focus:border-info focus:outline-none focus:ring-2 focus:ring-info/20 md:w-[132px]"
            >
              {supportedLocales.map((item) => (
                <option key={item} value={item}>
                  {localeLabels[item]}
                </option>
              ))}
            </select>
          </div>
        </nav>
      </div>
    </header>
  );
}
