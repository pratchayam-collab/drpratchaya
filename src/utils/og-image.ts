import puppeteer from '@cloudflare/puppeteer';
import { CANONICAL_ORIGIN } from '~/utils/site-url';

export interface OgImageContent {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export const ogR2Key = (kind: 'home' | 'conditions', slug?: string): string =>
  kind === 'home' ? 'og/home.png' : `og/conditions/${slug}.png`;

export const buildOgImageHtml = ({ eyebrow, title, subtitle }: OgImageContent): string => {
  const fontSerif = `${CANONICAL_ORIGIN}/fonts/noto-serif-thai-var-thai.woff2`;
  const fontSans = `${CANONICAL_ORIGIN}/fonts/ibm-plex-sans-thai-400-thai.woff2`;

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <style>
    @font-face {
      font-family: 'Noto Serif Thai';
      src: url('${fontSerif}') format('woff2');
      font-weight: 100 900;
      font-display: block;
    }
    @font-face {
      font-family: 'IBM Plex Sans Thai';
      src: url('${fontSans}') format('woff2');
      font-weight: 400;
      font-display: block;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1200px;
      height: 630px;
      background: linear-gradient(145deg, #faf8f4 0%, #eef6f7 100%);
      color: #0f2833;
      font-family: 'IBM Plex Sans Thai', sans-serif;
      padding: 72px 80px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .eyebrow {
      font-size: 28px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #146a80;
      font-weight: 600;
    }
    h1 {
      margin-top: 20px;
      font-family: 'Noto Serif Thai', serif;
      font-size: 56px;
      line-height: 1.25;
      max-width: 1040px;
      font-weight: 600;
    }
    p {
      margin-top: 28px;
      font-size: 30px;
      line-height: 1.5;
      color: #2a4a57;
      max-width: 980px;
    }
    .rule {
      margin-top: 48px;
      width: 120px;
      height: 4px;
      background: #1f93b0;
    }
  </style>
</head>
<body>
  <div class="eyebrow">${escapeHtml(eyebrow)}</div>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(subtitle)}</p>
  <div class="rule" aria-hidden="true"></div>
</body>
</html>`;
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

export type OgRenderEnv = Pick<CloudflareEnv, 'BROWSER' | 'MEDIA'>;

export const fetchOgPng = async (
  env: OgRenderEnv,
  key: string,
  html: string,
): Promise<Uint8Array> => {
  const cached = await env.MEDIA.get(key);
  if (cached) {
    return new Uint8Array(await cached.arrayBuffer());
  }

  const browser = await puppeteer.launch(env.BROWSER as unknown as Parameters<typeof puppeteer.launch>[0]);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const screenshot = await page.screenshot({ type: 'png' });
    const body =
      screenshot instanceof Uint8Array ? screenshot : new Uint8Array(screenshot as ArrayBuffer);

    await env.MEDIA.put(key, body, {
      httpMetadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    return body;
  } finally {
    await browser.close();
  }
};
