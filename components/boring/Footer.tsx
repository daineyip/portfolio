import { CONTACT, findNode } from '@/data/tree';

/**
 * The end of the page: an invitation on the left, the ways to take it up on the
 * right. Set quietly — no rule above it, no icons, lighter than anything it
 * follows — so it reads as a sign-off rather than another section.
 *
 * Email is a plain `mailto:` rather than the desktop's Inbox window: there is no
 * window to compose in here, and the phone's mail app is better at it anyway.
 */
function ways() {
  const linkedin = findNode('link-linkedin');
  const github = findNode('link-github');
  const resume = findNode('identity-resume');

  return [
    linkedin?.kind === 'link' && { id: 'linkedin', label: 'linkedin', href: linkedin.href },
    { id: 'email', label: 'email', href: `mailto:${CONTACT.email}` },
    github?.kind === 'link' && { id: 'github', label: 'github', href: github.href },
    resume?.kind === 'pdf' && { id: 'resume', label: 'resume', href: resume.src },
  ].filter(Boolean) as Array<{ id: string; label: string; href: string }>;
}

export default function Footer() {
  return (
    /* Room above it so it is not crowded by the last tiles, and small enough that
       the whole sign-off holds one line on any phone from 375px up. `flex-wrap` is
       the release valve for the few narrower than that — better a second line than
       a page that scrolls sideways. */
    <footer className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 pt-10">
      <p className="whitespace-nowrap font-mono text-[10px] opacity-55">let&apos;s build together.</p>

      <div className="flex shrink-0 justify-end gap-x-3">
        {ways().map(({ id, label, href }) => (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap font-mono text-[10px] opacity-55"
          >
            {label}
          </a>
        ))}
      </div>
    </footer>
  );
}
