import type { ComponentType } from 'react';
import type { AppType } from '@/store/useWindowStore';

import Bio from '@/content/identity/bio.mdx';
import Motivation from '@/content/identity/motivation.mdx';
import MarketerhireReadme from '@/content/work/marketerhire/readme.mdx';
import BinanceReadme from '@/content/work/binance-us/readme.mdx';
import OnwareReadme from '@/content/work/onware/readme.mdx';
import DunroeReadme from '@/content/work/dunroe/readme.mdx';
import WipReadme from '@/content/projects/workinprogress/readme.mdx';
import OvalReadme from '@/content/projects/oval-updates/readme.mdx';
import HyperscreenReadme from '@/content/projects/hyperscreen/readme.mdx';
import SystopiaReadme from '@/content/research/systopia/readme.mdx';
import HomeReadme from '@/content/home/readme.mdx';
import Prd from '@/content/system/prd.mdx';
import Changelog from '@/content/system/changelog.mdx';
import Todo from '@/content/system/todo.mdx';
import KilledProject from '@/content/trash/killed-project.mdx';

/**
 * One content tree. Surfaces below reference nodes by id, so a node can appear in
 * more than one place without duplicating content — `project-one-live` sits both
 * inside its project folder and on the desktop.
 *
 * `label` is what the visitor sees and is deliberately independent of the
 * filename, so a node backed by readme.mdx can read as `Home`.
 */
export type IconKey =
  | 'briefcase' | 'building' | 'user' | 'impact'
  | 'layers' | 'package' | 'microscope' | 'notebook'
  | 'image' | 'palette' | 'document'
  | 'home' | 'clock' | 'wrench' | 'book'
  | 'trash' | 'skull'
  | 'monitor' | 'ruler' | 'history' | 'flame'
  | 'file' | 'folder' | 'link' | 'globe' | 'mail' | 'github' | 'linkedin'
  | 'video';

interface NodeBase {
  id: string;
  label: string;
  /** Falls back to a per-kind default in components/NodeIcon.tsx. */
  icon?: IconKey;
  /**
   * A second line under the label, set small and muted. Used on the company
   * folders to carry the years, so Work Experience reads as a timeline at a
   * glance instead of only inside each readme.
   */
  meta?: string;
  /** A logo in public/. Takes precedence over `icon` when present. */
  image?: string;
  /**
   * How that logo fills its square tile. Default `cover` bleeds it edge to edge,
   * which is what a square mark wants; `contain` is for a mark that isn't square
   * and would otherwise be cropped.
   */
  imageFit?: 'cover' | 'contain';
  /** Docs only: render with a template other than the default reader. */
  app?: AppType;
  /**
   * Docs only: open maximized, as a document to read rather than a file to peek
   * at. Used for company and project readmes.
   */
  fullscreen?: boolean;
}

export type Node =
  | (NodeBase & { kind: 'folder'; children: Node[] })
  | (NodeBase & { kind: 'doc'; Body: ComponentType })
  | (NodeBase & { kind: 'pdf'; src: string })
  | (NodeBase & { kind: 'video'; src: string })
  | (NodeBase & { kind: 'image'; src: string; alt?: string; caption?: string })
  | (NodeBase & { kind: 'app'; appType: AppType })
  | (NodeBase & { kind: 'link'; href: string });

export const TREE: Node[] = [
  /*
   * Newest first. One folder per company: a readme plus whatever that work left
   * behind. Every company logo is `contain` so the four tiles read as a set —
   * each mark sits inside its tile rather than bleeding to the edges.
   */
  {
    kind: 'folder',
    id: 'work',
    label: 'Work Experience',
    icon: 'briefcase',
    children: [
      {
        kind: 'folder',
        id: 'work-marketerhire',
        label: 'MarketerHire',
        meta: '2025 — Now',
        image: '/MH_logo.png',
        imageFit: 'contain',
        children: [
          {
            kind: 'doc',
            id: 'work-marketerhire-readme',
            label: 'readme.mdx',
            icon: 'file',
            fullscreen: true,
            Body: MarketerhireReadme,
          },
          { kind: 'link', id: 'work-marketerhire-site', label: 'marketerhire.com/mh1', icon: 'globe', href: 'https://marketerhire.com/mh1' },
        ],
      },
      {
        kind: 'folder',
        id: 'work-binance',
        label: 'Binance.US',
        meta: '2023',
        image: '/Binance_Logo.png',
        imageFit: 'contain',
        children: [
          {
            kind: 'doc',
            id: 'work-binance-readme',
            label: 'readme.mdx',
            icon: 'file',
            fullscreen: true,
            Body: BinanceReadme,
          },
          { kind: 'link', id: 'work-binance-staking', label: 'Staking', icon: 'impact', href: 'https://www.binance.us/staking' },
          { kind: 'link', id: 'work-binance-walletconnect', label: 'WalletConnect guide', icon: 'book', href: 'https://www.binance.com/en/academy/articles/how-to-use-walletconnect' },
          { kind: 'link', id: 'work-binance-site', label: 'binance.us', icon: 'globe', href: 'https://www.binance.us' },
        ],
      },
      {
        kind: 'folder',
        id: 'work-onware',
        label: 'Onware Inc.',
        meta: '2022',
        image: '/onware_logo.png',
        imageFit: 'contain',
        children: [
          {
            kind: 'doc',
            id: 'work-onware-readme',
            label: 'readme.mdx',
            icon: 'file',
            fullscreen: true,
            Body: OnwareReadme,
          },
          { kind: 'link', id: 'work-onware-tableau', label: 'Tableau consulting', icon: 'impact', href: 'https://onware.com/tableau/' },
          { kind: 'link', id: 'work-onware-site', label: 'onware.com', icon: 'globe', href: 'https://onware.com' },
        ],
      },
      {
        kind: 'folder',
        id: 'work-dunroe',
        label: 'Dunroe.io',
        meta: '2021',
        image: '/dunroe.png',
        imageFit: 'contain',
        children: [
          {
            kind: 'doc',
            id: 'work-dunroe-readme',
            label: 'readme.mdx',
            icon: 'file',
            fullscreen: true,
            Body: DunroeReadme,
          },
          { kind: 'link', id: 'work-dunroe-site', label: 'dunroe.io', icon: 'globe', href: 'https://dunroe.io' },
        ],
      },
    ],
  },
  {
    kind: 'folder',
    id: 'projects',
    label: 'Projects',
    icon: 'layers',
    children: [
      /* These three marks already fill a square, so they bleed to the tile edge —
         the same way they read as shortcuts on the desktop. */
      {
        kind: 'folder',
        id: 'project-oval',
        label: 'Oval Updates',
        meta: '2026',
        image: '/bot-avatar.png',
        children: [
          {
            kind: 'doc',
            id: 'project-oval-readme',
            label: 'readme.mdx',
            icon: 'file',
            fullscreen: true,
            Body: OvalReadme,
          },
          { kind: 'link', id: 'project-oval-site', label: 'ovalupdates.com', icon: 'globe', href: 'https://www.ovalupdates.com' },
        ],
      },
      {
        kind: 'folder',
        id: 'project-hyperscreen',
        label: 'Hyperscreen',
        meta: '2025',
        image: '/amazon_logo.jpg',
        children: [
          {
            kind: 'doc',
            id: 'project-hyperscreen-readme',
            label: 'readme.mdx',
            icon: 'file',
            fullscreen: true,
            Body: HyperscreenReadme,
          },
          {
            kind: 'pdf',
            id: 'project-hyperscreen-brd',
            label: 'business-requirements.pdf',
            icon: 'document',
            fullscreen: true,
            src: '/brd.pdf',
          },
          {
            kind: 'pdf',
            id: 'project-hyperscreen-tor',
            label: 'terms-of-reference.pdf',
            icon: 'document',
            fullscreen: true,
            src: '/prd.pdf',
          },
          {
            kind: 'pdf',
            id: 'project-hyperscreen-design',
            label: 'internal-design.pdf',
            icon: 'document',
            fullscreen: true,
            src: '/technicaldesign.pdf',
          },
          { kind: 'link', id: 'project-hyperscreen-repo', label: 'Team-4-Amazon', icon: 'github', href: 'https://github.com/CPSC319-2025/Team-4-Amazon' },
        ],
      },
      {
        kind: 'folder',
        id: 'project-wip',
        label: 'WorkInProgress',
        meta: '2024 — 2025',
        image: '/wip-logo.png',
        children: [
          {
            kind: 'doc',
            id: 'project-wip-readme',
            label: 'readme.mdx',
            icon: 'file',
            fullscreen: true,
            Body: WipReadme,
          },
          {
            kind: 'video',
            id: 'project-wip-demo',
            label: 'demo.mp4',
            icon: 'video',
            src: '/wip-demo.mp4',
          },
          {
            kind: 'image',
            id: 'project-wip-founders',
            label: 'founders.png',
            icon: 'image',
            src: '/founders.png',
            alt: 'The WorkInProgress founding team at a restaurant patio in downtown Vancouver',
          },
          {
            kind: 'image',
            id: 'project-wip-team',
            label: 'team.jpg',
            icon: 'image',
            src: '/team.jpg',
            alt: 'The six-person WorkInProgress team at an indoor kart-racing track',
          },
          { kind: 'link', id: 'project-wip-site', label: 'wipnetwork.ca', icon: 'globe', href: 'https://www.wipnetwork.ca' },
        ],
      },
    ],
  },

  /*
   * Home is a document, not a folder: it is the one thing a visitor should read
   * first, so it opens maximized and explains where everything else lives.
   */
  {
    kind: 'doc',
    id: 'home',
    label: 'Home',
    icon: 'home',
    fullscreen: true,
    Body: HomeReadme,
  },
  {
    kind: 'folder',
    id: 'research',
    label: 'Research',
    icon: 'microscope',
    children: [
      {
        kind: 'folder',
        id: 'research-systopia',
        label: 'UBC Systopia Lab',
        meta: '2025',
        image: '/systopia_logo.png',
        /* 579x886 — a portrait mark, so it must be contained, never cropped. */
        imageFit: 'contain',
        children: [
          {
            kind: 'doc',
            id: 'research-systopia-readme',
            label: 'readme.mdx',
            icon: 'file',
            fullscreen: true,
            Body: SystopiaReadme,
          },
          {
            kind: 'pdf',
            id: 'research-systopia-paper',
            label: 'final-report.pdf',
            icon: 'document',
            fullscreen: true,
            src: '/researchpaper.pdf',
          },
          { kind: 'link', id: 'research-systopia-repo', label: 'TLA+ specs', icon: 'github', href: 'https://github.com/daineyip/TLA' },
        ],
      },
    ],
  },

  {
    kind: 'folder',
    id: 'trash',
    label: 'Trash',
    icon: 'trash',
    children: [
      { kind: 'doc', id: 'trash-killed-project', label: 'killed-project.mdx', icon: 'skull', Body: KilledProject },
    ],
  },

  /* Reached from the ◆ menu, not from the desktop. */
  {
    kind: 'folder',
    id: 'about-this-desktop',
    label: 'About This Desktop',
    icon: 'monitor',
    children: [
      { kind: 'doc', id: 'system-prd', label: 'prd.mdx', icon: 'file', fullscreen: true, Body: Prd },
      { kind: 'doc', id: 'system-todo', label: 'TODO.mdx', icon: 'wrench', Body: Todo },
      { kind: 'doc', id: 'system-changelog', label: 'changelog.mdx', icon: 'history', Body: Changelog },
    ],
  },

  /* Deployed sites, pinned to the right edge of the desktop. */
  {
    kind: 'link',
    id: 'shortcut-wip',
    label: 'WIP Internships',
    image: '/wip-logo.png',
    href: 'https://www.wipnetwork.ca',
  },
  {
    kind: 'link',
    id: 'shortcut-oval',
    label: 'Market News',
    image: '/bot-avatar.png',
    href: 'https://www.ovalupdates.com',
  },

  /* Identity — surfaced only through the menu bar, never on the desktop. */
  {
    kind: 'doc',
    id: 'identity-bio',
    label: 'Bio',
    icon: 'user',
    app: 'bio',
    fullscreen: true,
    Body: Bio,
  },
  {
    kind: 'doc',
    id: 'identity-motivation',
    label: 'Motivation',
    icon: 'flame',
    fullscreen: true,
    Body: Motivation,
  },
  {
    kind: 'pdf',
    id: 'identity-resume',
    label: 'Resume',
    icon: 'document',
    fullscreen: true,
    src: '/resume.pdf',
  },
  { kind: 'link', id: 'link-github', label: 'GitHub', icon: 'github', href: 'https://github.com/daineyip' },
  { kind: 'link', id: 'link-linkedin', label: 'LinkedIn', icon: 'linkedin', href: 'https://www.linkedin.com/in/daineyip/' },
  { kind: 'app', id: 'app-inbox', label: 'Message me', icon: 'mail', appType: 'inbox' },
];

/**
 * Availability shown in the menu bar. Flip `STATUS` when it changes — it is a
 * statement about Daine, so it is configuration rather than something a visitor
 * can toggle.
 */
export type StatusKey = 'busy' | 'open';

export const STATUS_OPTIONS: Record<StatusKey, { label: string; dot: string; live: boolean }> = {
  busy: { label: 'Busy', dot: '#d94f2b', live: true },
  open: { label: 'Open to work', dot: '#35c46a', live: false },
};

export const STATUS: StatusKey = 'busy';

/** Hero fields for the bio page; the prose itself lives in content/identity/bio.mdx. */
export const CONTACT = {
  name: 'Daine Yip',
  email: 'daineyip@icloud.com',
};

export const BIO = {
  name: 'Daine Yip',
  role: 'Technical Product Manager',
  location: '📍 Vancouver, BC',
  photo: '/daine.jpeg',
};

/** Wallpaper greeting. Split so the name can carry its own block treatment. */
export const GREETING = {
  before: "Hi, I'm",
  name: 'Daine',
  after: 'and this is my desktop.',
};

/** Desktop icons, in display order. */
export const DESKTOP: string[] = ['home', 'work', 'projects', 'research', 'trash'];

/** Pinned shortcuts down the right edge — deployed sites, not folders. */
export const SHORTCUTS: string[] = ['shortcut-wip', 'shortcut-oval'];

/**
 * Menu bar, left to right. A menu with a single item renders as a direct button
 * rather than a dropdown.
 */
export interface Menu {
  label: string;
  items: string[];
}

export const MENU_BAR: Menu[] = [
  { label: '◆ About This Desktop', items: ['about-this-desktop'] },
  { label: 'About', items: ['identity-bio', 'identity-motivation'] },
  { label: 'Resume', items: ['identity-resume'] },
  { label: 'Connect', items: ['link-github', 'link-linkedin', 'app-inbox'] },
];

export function findNode(id: string, nodes: Node[] = TREE): Node | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.kind === 'folder') {
      const hit = findNode(id, node.children);
      if (hit) return hit;
    }
  }
  return undefined;
}

export function childrenOf(id: string): Node[] {
  const node = findNode(id);
  return node?.kind === 'folder' ? node.children : [];
}

/** Ancestor chain for a node, root first, including the node itself. */
export function pathTo(id: string, nodes: Node[] = TREE, trail: Node[] = []): Node[] | undefined {
  for (const node of nodes) {
    const next = [...trail, node];
    if (node.id === id) return next;
    if (node.kind === 'folder') {
      const hit = pathTo(id, node.children, next);
      if (hit) return hit;
    }
  }
  return undefined;
}
