'use client';

import type { AppType } from '@/store/useWindowStore';
import Explorer from './Explorer';
import ReaderView from './ReaderView';

/** The App Template switch: a window renders whichever template its appType names. */
export default function AppBody({ appType }: { appType: AppType }) {
  switch (appType) {
    case 'explorer':
      return <Explorer />;
    case 'reader':
      return <ReaderView />;
  }
}
