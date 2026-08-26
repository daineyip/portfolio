import type { NextConfig } from 'next';
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  // .mdx is allowed as a route extension for completeness; content lives in
  // content/ and is imported, not routed.
  pageExtensions: ['ts', 'tsx', 'mdx'],
};

// Tables, strikethrough and autolinks are GitHub-flavoured Markdown, not core
// Markdown, so `.mdx` needs remark-gfm to see them at all — without it a table
// silently renders as paragraphs of pipes. Turbopack requires plugins named by
// string rather than passed as functions, hence the ['remark-gfm'] form.
const withMDX = createMDX({
  options: {
    remarkPlugins: [['remark-gfm']],
  },
});

export default withMDX(nextConfig);
