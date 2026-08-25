import type { NextConfig } from 'next';
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  // .mdx is allowed as a route extension for completeness; content lives in
  // content/ and is imported, not routed.
  pageExtensions: ['ts', 'tsx', 'mdx'],
};

// No remark/rehype plugins on purpose: Turbopack requires plugins to be named
// by string rather than passed as functions, and we need none of them.
const withMDX = createMDX({});

export default withMDX(nextConfig);
