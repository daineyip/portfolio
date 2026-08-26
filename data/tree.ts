import type { ComponentType } from 'react';
import type { AppType } from '@/store/useWindowStore';

import Bio from '@/content/identity/bio.mdx';
import Motivation from '@/content/identity/motivation.mdx';
import CompanyOneReadme from '@/content/work/company-one/readme.mdx';
import CompanyOnePhotos from '@/content/work/company-one/photos.mdx';
import CaseStudy from '@/content/projects/project-one/case-study.mdx';
import Stack from '@/content/projects/project-one/stack.mdx';
import Abstract from '@/content/research/topic-one/abstract.mdx';
import Findings from '@/content/research/topic-one/findings.mdx';
import Now from '@/content/home/now.mdx';
import Uses from '@/content/home/uses.mdx';
import Bookshelf from '@/content/home/bookshelf.mdx';
import Prd from '@/content/system/prd.mdx';
import DesignSpec from '@/content/system/design-spec.mdx';
import Changelog from '@/content/system/changelog.mdx';
import KilledProject from '@/content/trash/killed-project.mdx';

/**
 * One content tree. Surfaces below reference nodes by id, so a node can appear in
 * more than one place without duplicating content — `project-one-live` sits both
 * inside its project folder and on the desktop.
 *
 * `label` is what the visitor sees and is deliberately independent of the
 * filename, so a node backed by now.mdx can read as `now.txt`.
 */
export type IconKey =
  | 'briefcase' | 'building' | 'user' | 'impact'
  | 'layers' | 'package' | 'microscope' | 'notebook'
  | 'image' | 'palette' | 'document'
  | 'home' | 'clock' | 'wrench' | 'book'
  | 'trash' | 'skull'
  | 'monitor' | 'ruler' | 'history' | 'flame'
  | 'file' | 'folder' | 'link' | 'globe' | 'mail' | 'github' | 'linkedin';

interface NodeBase {
  id: string;
  label: string;
  /** Falls back to a per-kind default in components/NodeIcon.tsx. */
  icon?: IconKey;
  /** A logo in public/. Takes precedence over `icon` when present. */
  image?: string;
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
  | (NodeBase & { kind: 'app'; appType: AppType })
  | (NodeBase & { kind: 'link'; href: string });

export const TREE: Node[] = [
  {
    kind: 'folder',
    id: 'work',
    label: 'Work Experience',
    icon: 'briefcase',
    children: [
      {
        kind: 'folder',
        id: 'work-company-one',
        label: 'Company One',
        icon: 'building',
        children: [
          {
            kind: 'doc',
            id: 'work-company-one-readme',
            label: 'readme.mdx',
            icon: 'file',
            fullscreen: true,
            Body: CompanyOneReadme,
          },
          { kind: 'link', id: 'work-company-one-site', label: 'Product site', icon: 'globe', href: 'https://example.com' },
          { kind: 'link', id: 'work-company-one-figma', label: 'Figma', icon: 'palette', href: 'https://figma.com' },
          { kind: 'doc', id: 'work-company-one-photos', label: 'photos.mdx', icon: 'image', Body: CompanyOnePhotos },
          { kind: 'link', id: 'work-company-one-onepager', label: 'one-pager.pdf', icon: 'document', href: '/company-one-one-pager.pdf' },
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
      {
        kind: 'folder',
        id: 'project-one',
        label: 'project-one',
        icon: 'package',
        children: [
          { kind: 'doc', id: 'project-one-case', label: 'case-study.mdx', icon: 'file', Body: CaseStudy },
          { kind: 'doc', id: 'project-one-stack', label: 'stack.mdx', icon: 'layers', Body: Stack },
          { kind: 'link', id: 'project-one-live', label: 'live', icon: 'globe', href: 'https://example.com' },
        ],
      },
    ],
  },
  {
    kind: 'folder',
    id: 'home',
    label: 'Home',
    icon: 'home',
    children: [
      { kind: 'doc', id: 'home-now', label: 'now.txt', icon: 'clock', Body: Now },
      { kind: 'doc', id: 'home-uses', label: 'uses.mdx', icon: 'wrench', Body: Uses },
      { kind: 'doc', id: 'home-bookshelf', label: 'bookshelf.mdx', icon: 'book', Body: Bookshelf },
    ],
  },
  {
    kind: 'folder',
    id: 'research',
    label: 'Research',
    icon: 'microscope',
    children: [
      {
        kind: 'folder',
        id: 'research-topic-one',
        label: 'topic-one',
        icon: 'notebook',
        children: [
          { kind: 'doc', id: 'research-topic-one-abstract', label: 'abstract.mdx', icon: 'file', Body: Abstract },
          { kind: 'doc', id: 'research-topic-one-findings', label: 'findings.mdx', icon: 'impact', Body: Findings },
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
      { kind: 'doc', id: 'system-prd', label: 'prd.mdx', icon: 'file', Body: Prd },
      { kind: 'doc', id: 'system-design-spec', label: 'design-spec.mdx', icon: 'ruler', Body: DesignSpec },
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
    src: '/DaineResume_Product.pdf',
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
