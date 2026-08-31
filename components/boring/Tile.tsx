import Link from 'next/link';
import type { Node } from '@/data/tree';
import { glyphFor, logoFit } from '../NodeIcon';

/**
 * One experience, project or paper: its mark centred in a square, its name along
 * the bottom. The desktop says the same thing with an icon and a caption; here the
 * tile is the whole target, because a thumb is not a pointer.
 */
export default function Tile({ node }: { node: Node }) {
  const Glyph = glyphFor(node);

  return (
    <Link
      href={`/${node.id}`}
      className="group block overflow-hidden rounded-2xl border-[3px] border-black bg-[#fffdf7]
                 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5"
    >
      <div className="flex aspect-square items-center justify-center p-6">
        {node.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={node.image} alt="" className={`h-full w-full ${logoFit(node)}`} />
        ) : (
          <Glyph className="h-10 w-10" strokeWidth={2} />
        )}
      </div>

      {/* Its own band rather than an overlay: a mark that runs to the edge would sit
          under the name otherwise, and these marks do run to the edge. */}
      <div className="border-t-[3px] border-black px-3 py-2">
        <p className="truncate font-mono text-xs font-bold">{node.label}</p>
        {node.meta && <p className="truncate font-mono text-[10px] font-bold opacity-55">{node.meta}</p>}
      </div>
    </Link>
  );
}
