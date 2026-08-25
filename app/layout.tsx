import type { Metadata } from 'next';
import './globals.css';
import DesktopWrapper from '@/components/DesktopWrapper';
import MenuBar from '@/components/MenuBar';
import Taskbar from '@/components/Taskbar';

export const metadata: Metadata = { title: 'Portfolio OS' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* The OS shell lives in layout so navigation never unmounts it. */}
      <body className="relative h-screen overflow-hidden font-sans antialiased">
        <DesktopWrapper />
        <MenuBar />
        <Taskbar />
        {children}
      </body>
    </html>
  );
}
