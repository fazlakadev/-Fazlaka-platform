// app/admin/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/Language/LanguageProvider';
import AdminSidebar from './components/AdminSidebar';
import AdminSearchCommandPalette from './components/AdminSearchCommandPalette';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isRTL } = useLanguage();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative font-sans">
      <AdminSidebar isRTL={isRTL} onSearchToggle={() => setSearchOpen(prev => !prev)} />

      <AdminSearchCommandPalette
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <main className="transition-all duration-300 ease-in-out p-4 sm:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
            {children}
        </div>
      </main>
    </div>
  );
}
