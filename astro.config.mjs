// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // The www host, not the apex: every canonical, sitemap and JSON-LD URL on the
  // site names www, and the apex redirects to it at the zone level. Leaving this
  // on the apex made Astro emit redirect stub pages during prerender.
  site: 'https://www.drpratchaya.com',

  // Astro 7 defaults to JSX whitespace rules; keep Astro 5/6 HTML compression.
  compressHTML: true,

  // Static by default. The Cloudflare adapter stays configured so an individual
  // route can opt into SSR later with `export const prerender = false`.
  output: 'static',
  adapter: cloudflare({
    // Optimise images with sharp at build time, which is what prerendered
    // routes need. Cloudflare's runtime image service is not used.
    imageService: 'compile',
    // Use the provisioned SESSIONS namespace (design spec §4) instead of a
    // second auto-provisioned SESSION KV binding.
    sessionKVBindingName: 'SESSIONS',
  }),

  // Thai is the default locale and is served from `/` without a prefix.
  // English is a real route tree under `/en/`, never a CSS toggle.
  i18n: {
    defaultLocale: 'th',
    locales: ['th', 'en'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
