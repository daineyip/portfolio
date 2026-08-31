import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';
import { findNode } from '@/data/tree';

/**
 * A document's own MDX, rendered as a page instead of inside a window.
 *
 * The prose styling all lives in mdx-components.tsx, so this is only the measure —
 * and one substitution. `<Open id="...">` means "open this in the desktop", which
 * on mobile would push a window onto a store nobody can see; here the same link has
 * to mean "go to that page" instead. Passing `components` to the compiled MDX
 * overrides the global provider for this render only.
 */
type MDX = ComponentType<{ components?: Record<string, unknown> }>;

function MobileOpen({ id, children }: { id: string; children?: ReactNode }) {
  const node = findNode(id);
  if (!node) return <>{children}</>;

  const label = children ?? node.label;
  const underline = 'font-medium underline decoration-[#ffd23f] decoration-[3px] underline-offset-2';

  if (node.kind === 'link') {
    return (
      <a href={node.href} target="_blank" rel="noopener noreferrer" className={underline}>
        {label}
        <span className="font-mono text-[11px]"> ↗</span>
      </a>
    );
  }

  /* Only folders and docs have a page here; anything else stays plain text rather
     than becoming a link that goes nowhere. */
  if (node.kind === 'folder' || node.kind === 'doc') {
    return (
      <Link href={`/${node.id}`} className={underline}>
        {label}
      </Link>
    );
  }

  return <>{label}</>;
}

export default function Prose({ Body }: { Body: ComponentType }) {
  const Doc = Body as MDX;
  return <Doc components={{ Open: MobileOpen }} />;
}
