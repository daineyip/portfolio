import { Mail } from 'lucide-react';
import { CONTACT, findNode } from '@/data/tree';
import { glyphFor } from '../NodeIcon';

/**
 * The end of the page: an invitation on the left, the ways to take it up on the
 * right. The desktop keeps these behind the Connect menu and the Inbox app; a
 * phone has neither, so they sit where a thumb ends up.
 *
 * Email is a plain `mailto:` rather than the desktop's Inbox window — there is no
 * window to compose in here, and the phone's mail app is better at it anyway.
 */
function ways() {
  const linkedin = findNode('link-linkedin');
  const github = findNode('link-github');
  const resume = findNode('identity-resume');

  return [
    linkedin?.kind === 'link' && { id: 'linkedin', label: 'LinkedIn', href: linkedin.href, Glyph: glyphFor(linkedin) },
    { id: 'email', label: 'Email', href: `mailto:${CONTACT.email}`, Glyph: Mail },
    github?.kind === 'link' && { id: 'github', label: 'GitHub', href: github.href, Glyph: glyphFor(github) },
    resume?.kind === 'pdf' && { id: 'resume', label: 'Resume', href: resume.src, Glyph: glyphFor(resume) },
  ].filter(Boolean) as Array<{ id: string; label: string; href: string; Glyph: typeof Mail }>;
}

export default function Footer() {
  return (
    <footer className="flex items-end justify-between gap-4 border-t-[3px] border-black pt-6">
      <p className="text-xl font-black leading-tight tracking-tight">Let&apos;s build together.</p>

      <div className="flex shrink-0 gap-2">
        {ways().map(({ id, label, href, Glyph }) => (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className="flex h-10 w-10 items-center justify-center rounded-xl border-[3px] border-black
                       bg-[#fffdf7] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
          >
            <Glyph className="h-4 w-4" strokeWidth={2.5} />
          </a>
        ))}
      </div>
    </footer>
  );
}
