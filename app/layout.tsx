import type { Metadata } from 'next';
import './globals.css';
import CommandPalette from '@/components/CommandPalette';
import Cursor from '@/components/Cursor';
import DesktopWrapper from '@/components/DesktopWrapper';
import MenuBar from '@/components/MenuBar';
import Shortcuts from '@/components/Shortcuts';
import Taskbar from '@/components/Taskbar';
import { buildSearchIndex } from '@/lib/search-index';

export const metadata: Metadata = {
  title: 'Daine Yip',
  icons: { icon: '/daine.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  /* Read off disk here, in a server component, so the documents are indexed once at
     build time and reach the palette as plain data. */
  const searchIndex = buildSearchIndex();

  return (
    <html lang="en">
      {/* The OS shell lives in layout so navigation never unmounts it. */}
      <body className="relative h-screen overflow-hidden font-sans antialiased">
        <DesktopWrapper />
        <MenuBar />
        <Taskbar />
        <CommandPalette index={searchIndex} />
        <Shortcuts />
        <Cursor />
        {children}
      </body>
    </html>
  );
}
