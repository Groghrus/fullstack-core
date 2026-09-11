/** @type {import('next').NextConfig} */
const nextConfig = {
  // Для рантайм-поиска на Vercel нужно, чтобы .md темы попали в
  // серверную функцию вместе с исходниками репо.
  outputFileTracingIncludes: {
    '/api/search': ['../../packages/content/themes/**/*.md'],
  },
}

export default nextConfig