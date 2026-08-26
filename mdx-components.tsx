import type { ReactNode } from 'react';
import type { MDXComponents } from 'mdx/types';

/**
 * The one place MDX prose gets its neo-brutalist styling. Every .mdx file under
 * content/ inherits from here, so documents carry no classes of their own.
 * App Router requires this file at the project root.
 */
const prose: MDXComponents = {
  h1: (p) => (
    <h1 className="mb-4 border-b-[3px] border-black pb-2 font-mono text-xl font-bold" {...p} />
  ),
  h2: (p) => (
    <h2 className="mb-2 mt-7 border-b-2 border-black pb-1 font-mono text-base font-bold uppercase tracking-wide" {...p} />
  ),
  h3: (p) => <h3 className="mb-1 mt-5 font-mono text-sm font-bold uppercase tracking-wide" {...p} />,

  p: (p) => <p className="mb-3 text-pretty text-sm leading-relaxed text-[#1b1b1b]" {...p} />,

  a: ({ href = '', ...rest }) => {
    // Anything off-site or a static file would otherwise unmount the whole desktop.
    const leavesApp = /^[a-z]+:/i.test(href) || /\.[a-z0-9]{2,4}$/i.test(href);
    return (
      <a
        href={href}
        {...(leavesApp ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="font-medium underline decoration-[#ffd23f] decoration-[3px] underline-offset-2 hover:bg-[#ffd23f]"
        {...rest}
      />
    );
  },

  ul: (p) => <ul className="mb-3 list-disc pl-5 text-sm leading-relaxed marker:text-[#d94f2b]" {...p} />,
  ol: (p) => <ol className="mb-3 list-decimal pl-5 text-sm leading-relaxed marker:font-bold" {...p} />,
  li: (p) => <li className="mb-1" {...p} />,

  /* Inline code. Block code is handled by <pre>, which resets these. */
  code: (p) => (
    <code className="rounded border-2 border-black bg-[#ffd23f] px-1 font-mono text-[12px]" {...p} />
  ),
  pre: (p) => (
    <pre
      className="mb-4 overflow-x-auto rounded-xl border-[3px] border-black bg-black p-3 font-mono text-[12px] leading-relaxed text-[#fffdf7]
                 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                 [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit"
      {...p}
    />
  ),

  blockquote: (p) => (
    <blockquote className="mb-3 rounded-r-lg border-l-[6px] border-[#d94f2b] bg-[#d94f2b0d] py-2 pl-3 pr-2 text-sm italic leading-relaxed" {...p} />
  ),

  hr: (p) => <hr className="my-6 border-t-[3px] border-black" {...p} />,
  strong: (p) => <strong className="font-bold" {...p} />,

  img: (p) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="mb-4 max-w-full rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" alt="" {...p} />
  ),

  /* Custom component, available to any .mdx without an import. */
  Signature: ({ children }: { children?: ReactNode }) => (
    <p className="mt-10 text-2xl font-black tracking-tight">— {children}</p>
  ),

  /* Wide tables scroll inside their own container rather than the window. */
  table: (p) => (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full border-collapse overflow-hidden rounded-xl border-[3px] border-black text-sm" {...p} />
    </div>
  ),
  th: (p) => <th className="border-2 border-black bg-black px-2 py-1 text-left font-mono text-xs text-[#fffdf7]" {...p} />,
  td: (p) => <td className="border-2 border-black px-2 py-1 align-top" {...p} />,
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { ...prose, ...components };
}
