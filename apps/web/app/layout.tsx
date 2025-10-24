import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import QueryProvider from "../src/components/QueryProvider";
import { Toaster } from 'react-hot-toast';

const geistSans = localFont({
  src: [{ path: "./fonts/GeistVF.woff", weight: "100 900" }],
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: [{ path: "./fonts/GeistMonoVF.woff", weight: "100 900" }],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "교육 플랫폼",
  description: "온라인 학습 및 시험 플랫폼",
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}