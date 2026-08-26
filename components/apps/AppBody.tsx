'use client';

import type { AppType } from '@/store/useWindowStore';
import Explorer from './Explorer';
import BioView from './BioView';
import ImageView from './ImageView';
import Inbox from './Inbox';
import PdfView from './PdfView';
import ReaderView from './ReaderView';
import VideoView from './VideoView';

/** The App Template switch: a window renders whichever template its appType names. */
export default function AppBody({ appType }: { appType: AppType }) {
  switch (appType) {
    case 'explorer':
      return <Explorer />;
    case 'reader':
      return <ReaderView />;
    case 'pdf':
      return <PdfView />;
    case 'image':
      return <ImageView />;
    case 'video':
      return <VideoView />;
    case 'bio':
      return <BioView />;
    case 'inbox':
      return <Inbox />;
  }
}
