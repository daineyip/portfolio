import type { ComponentType } from 'react';

import Bio from '@/content/identity/bio.mdx';
import Motivation from '@/content/identity/motivation.mdx';
import Resume from '@/content/identity/resume.mdx';
import Role from '@/content/work/company-one/role.mdx';
import Impact from '@/content/work/company-one/impact.mdx';
import CaseStudy from '@/content/projects/project-one/case-study.mdx';
import Stack from '@/content/projects/project-one/stack.mdx';
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
export type Node =
  | { kind: 'folder'; id: string; label: string; children: Node[] }
  | { kind: 'doc'; id: string; label: string; Body: ComponentType }
  | { kind: 'link'; id: string; label: string; href: string };

export const TREE: Node[] = [
  {
    kind: 'folder',
    id: 'work',
    label: 'Work Experience',
    children: [
      {
        kind: 'folder',
        id: 'work-company-one',
        label: 'Company One',
        children: [
          { kind: 'doc', id: 'work-company-one-role', label: 'role.mdx', Body: Role },
          { kind: 'doc', id: 'work-company-one-impact', label: 'impact.mdx', Body: Impact },
        ],
      },
    ],
  },
  {
    kind: 'folder',
    id: 'projects',
    label: 'Projects',
    children: [
      {
        kind: 'folder',
        id: 'project-one',
        label: 'project-one',
        children: [
          { kind: 'doc', id: 'project-one-case', label: 'case-study.mdx', Body: CaseStudy },
          { kind: 'doc', id: 'project-one-stack', label: 'stack.mdx', Body: Stack },
          { kind: 'link', id: 'project-one-live', label: 'live', href: 'https://example.com' },
        ],
      },
    ],
  },
  {
    kind: 'folder',
    id: 'home',
    label: '~',
    children: [
      { kind: 'doc', id: 'home-now', label: 'now.txt', Body: Now },
      { kind: 'doc', id: 'home-uses', label: 'uses.mdx', Body: Uses },
      { kind: 'doc', id: 'home-bookshelf', label: 'bookshelf.mdx', Body: Bookshelf },
    ],
  },
  {
    kind: 'folder',
    id: 'trash',
    label: 'Trash',
    children: [
      { kind: 'doc', id: 'trash-killed-project', label: 'killed-project.mdx', Body: KilledProject },
    ],
  },

  /* Reached from the ◆ menu, not from the desktop. */
  {
    kind: 'folder',
    id: 'about-this-mac',
    label: 'About This Mac',
    children: [
      { kind: 'doc', id: 'system-prd', label: 'prd.mdx', Body: Prd },
      { kind: 'doc', id: 'system-design-spec', label: 'design-spec.mdx', Body: DesignSpec },
      { kind: 'doc', id: 'system-changelog', label: 'changelog.mdx', Body: Changelog },
    ],
  },

  /* Identity — surfaced only through the menu bar, never on the desktop. */
  { kind: 'doc', id: 'identity-bio', label: 'Bio', Body: Bio },
  { kind: 'doc', id: 'identity-motivation', label: 'Motivation', Body: Motivation },
  { kind: 'doc', id: 'identity-resume', label: 'Resume', Body: Resume },
  { kind: 'link', id: 'link-github', label: 'GitHub', href: 'https://github.com' },
  { kind: 'link', id: 'link-linkedin', label: 'LinkedIn', href: 'https://linkedin.com' },
  { kind: 'link', id: 'link-email', label: 'Email', href: 'mailto:daine.c.yip@gmail.com' },
];

/** Desktop icons, in display order. */
export const DESKTOP: string[] = ['work', 'projects', 'home', 'project-one-live', 'trash'];

/**
 * Menu bar, left to right. A menu with a single item renders as a direct button
 * rather than a dropdown.
 */
export interface Menu {
  label: string;
  items: string[];
}

export const MENU_BAR: Menu[] = [
  { label: '◆ About This Mac', items: ['about-this-mac'] },
  { label: 'About', items: ['identity-bio', 'identity-motivation'] },
  { label: 'Resume', items: ['identity-resume'] },
  { label: 'Connect', items: ['link-github', 'link-linkedin', 'link-email'] },
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
