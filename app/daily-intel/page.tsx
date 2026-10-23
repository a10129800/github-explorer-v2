'use client';

import React, { useState, Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { DailyIntelView } from '@/components/DailyIntelView';

function DailyIntelContent() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
      <Navbar
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      <div className="flex-1 flex w-full px-4 sm:px-6 py-6 gap-6">
        <Sidebar
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 lg:ml-64 min-w-0 space-y-6">
          <DailyIntelView />
        </main>
      </div>
    </div>
  );
}

export default function DailyIntelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080c14] flex items-center justify-center text-xs text-slate-500">載入每日情報雷達中...</div>}>
      <DailyIntelContent />
    </Suspense>
  );
}

