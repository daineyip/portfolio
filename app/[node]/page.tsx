import { notFound } from 'next/navigation';
import FolderPage from '@/components/boring/FolderPage';
import { MOBILE_SECTIONS, TREE, childrenOf, findNode, type Node } from '@/data/tree';

/**
 * One page per folder or document, for Boring Mode. The desktop reaches the same
 * content by opening windows; a phone reaches it by a URL, so every node that can
 * be a page gets one.
 *
 * Only folders and docs qualify — a link leaves the site and a PDF opens in the
 * browser's own viewer, so neither needs a page of ours.
 */
function pageable(node: Node | undefined): node is Node {
  return node?.kind === 'folder' || node?.kind === 'doc';
}

export function generateStaticParams() {
  const ids = [
    ...MOBILE_SECTIONS.flatMap((id) => childrenOf(id).map((child) => child.id)),
    ...TREE.filter((n) => n.kind === 'doc').map((n) => n.id),
    'identity-bio',
    'identity-motivation',
  ];
  return [...new Set(ids)].map((node) => ({ node }));
}

export default async function Page({ params }: { params: Promise<{ node: string }> }) {
  const { node: id } = await params;
  const node = findNode(id);
  if (!pageable(node)) notFound();

  return (
    <div className="wallpaper min-h-screen md:hidden">
      <FolderPage node={node} />
    </div>
  );
}
