# Pre-v2 static site

These five hand-written HTML files are the previous version of drpratchaya.com,
moved here unmodified when the Astro v2 rebuild began.

| File | Contents |
| --- | --- |
| `index.html` | Old bilingual homepage |
| `acl.html` | ACL tear — Thai patient article |
| `patellofemoral.html` | Patellofemoral disorders — Thai patient article |
| `rotator-cuff.html` | Rotator cuff tear — Thai patient article |
| `shoulder-dislocation.html` | Shoulder dislocation / Bankart — Thai patient article |

## Why they are kept

The four condition articles hold roughly **18,100 Thai characters** of reviewed
patient-facing medical writing. That copy has not been migrated yet. It is due
to move into an Astro content collection in a later task, at which point the
homepage's `/conditions/<slug>/` links become real routes.

Until that migration lands, these files are the only copy of that content.
**Do not delete them, and do not rewrite their prose.**

## What is wrong with them

They are kept for their text, not as a template. Known problems, all of which
the v2 build exists to fix:

- **Thai headings render in a fallback font.** All four article pages load
  `Playfair Display` and use it for headings. Playfair ships no Thai glyphs, so
  every Thai heading silently falls back to a system font.
- **Render-blocking webfonts** from the Google Fonts CDN.
- **Both languages in one DOM**, toggled with CSS, which reads to search
  engines as duplicate content. v2 uses real routes (`/` and `/en/`) instead.
- **Three conflicting colour token sets** across the five files.

## Serving

Nothing serves this directory. The live pre-v2 site is a separate, manually
uploaded Worker, so moving these files out of the repository root changed
nothing in production.
