import {
  BookOpen,
  Briefcase,
  Building2,
  Clock,
  ExternalLink,
  FileText,
  Flame,
  Folder,
  Globe,
  FileDown,
  History,
  House,
  Image,
  Layers,
  Mail,
  Microscope,
  Monitor,
  NotebookPen,
  Package,
  Palette,
  Ruler,
  Skull,
  Trash2,
  TrendingUp,
  User,
  Video,
  Wrench,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { IconKey, Node } from '@/data/tree';
import { GithubMark, LinkedinMark } from './icons';

type Glyph = ComponentType<{ className?: string; strokeWidth?: number }>;

/**
 * How a node's logo fills its square tile, shared by the desktop icon and the
 * readme stamp so the two can never drift: `contain` insets a mark that would
 * otherwise be cropped, and anything else bleeds to the edge.
 */
export function logoFit(node: Pick<Node, 'imageFit'>): string {
  return node.imageFit === 'contain' ? 'object-contain p-1.5' : 'object-cover';
}

const REGISTRY: Record<IconKey, Glyph> = {
  briefcase: Briefcase,
  building: Building2,
  user: User,
  impact: TrendingUp,
  layers: Layers,
  package: Package,
  microscope: Microscope,
  notebook: NotebookPen,
  image: Image,
  palette: Palette,
  document: FileDown,
  home: House,
  clock: Clock,
  wrench: Wrench,
  book: BookOpen,
  trash: Trash2,
  skull: Skull,
  monitor: Monitor,
  ruler: Ruler,
  history: History,
  flame: Flame,
  file: FileText,
  folder: Folder,
  link: ExternalLink,
  globe: Globe,
  mail: Mail,
  github: GithubMark,
  linkedin: LinkedinMark,
  video: Video,
};

/** What a node falls back to when it names no icon of its own. */
const BY_KIND: Record<Node['kind'], IconKey> = {
  folder: 'folder',
  doc: 'file',
  pdf: 'document',
  video: 'video',
  image: 'image',
  app: 'mail',
  link: 'link',
};

export function glyphFor(node: Node): Glyph {
  return REGISTRY[node.icon ?? BY_KIND[node.kind]];
}
