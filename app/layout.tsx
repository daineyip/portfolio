import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import './globals.css';
import Assistant from '@/components/Assistant';
import CommandPalette from '@/components/CommandPalette';
import Cursor from '@/components/Cursor';
import DesktopWrapper from '@/components/DesktopWrapper';
import MenuBar from '@/components/MenuBar';
import Shortcuts from '@/components/Shortcuts';
import SmallScreen from '@/components/SmallScreen';
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
        {/*
          `display: contents` rather than a real box, so the shell's absolutely
          positioned parts still resolve against <body> exactly as before — and
          `hidden` below md, where the desktop metaphor has no room to work.
        */}
        <div className="hidden md:contents">
          <DesktopWrapper />
          <MenuBar />
          <Taskbar />
          <CommandPalette index={searchIndex} />
          {/* Floats over the windows in the bottom-right corner; inside the gate,
              since a chat panel needs the desktop it points at. */}
          <Assistant />
          <Shortcuts />
          {children}
        </div>

        <SmallScreen />

        {/* Outside the gate: a narrow window on a desktop is still a desktop, and
            the notice deserves the same cursor as everything else. It decides for
            itself whether to run, on pointer type rather than width. */}
        <Cursor />

        {/* Outside it too, so visits that only ever see the small-screen notice
            still count. */}
        <Analytics />
      </body>
    </html>
  );
}
