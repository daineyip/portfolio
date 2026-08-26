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
  Wrench,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { IconKey, Node } from '@/data/tree';
import { GithubMark, LinkedinMark } from './icons';

type Glyph = ComponentType<{ className?: string; strokeWidth?: number }>;

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
};

/** What a node falls back to when it names no icon of its own. */
const BY_KIND: Record<Node['kind'], IconKey> = {
  folder: 'folder',
  doc: 'file',
  pdf: 'document',
  app: 'mail',
  link: 'link',
};

export function glyphFor(node: Node): Glyph {
  return REGISTRY[node.icon ?? BY_KIND[node.kind]];
}
