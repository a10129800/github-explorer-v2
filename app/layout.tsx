import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '開源專案雷達 | GitHub Explorer V2',
  description: "Discover What's Rising in Open Source — 挖掘最新熱門、正在崛起、具有創意且可操作體驗的優質開源專案",
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#080c14] text-slate-100 min-h-screen font-sans selection:bg-cyan-500/30 selection:text-cyan-200 antialiased">
        {children}
      </body>
    </html>
  );
}
