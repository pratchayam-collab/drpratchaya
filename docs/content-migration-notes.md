# Condition article migration notes (HTML → Markdown)

Migrated 2026-09-18 from legacy static HTML into `src/content/conditions/*.md`. Body text is limited to hero **lead** plus `.article-body` (sidebar CTA, TOC, related links, and footer are intentionally omitted).

## Source copy discrepancies

| File | `legacy/` | `doc-gitignored/` |
| --- | --- | --- |
| `acl.html` | Present | **Not present** (no copy to diff) |
| `rotator-cuff.html` | Present | Present — **byte-identical** (`diff -q`) |
| `shoulder-dislocation.html` | Present | Present — **byte-identical** |
| `patellofemoral.html` | Present | Present — **byte-identical** |

Primary source used: `legacy/*.html` for all four articles.

## Character count verification

Comparison: hero lead + `.article-body` plain text (HTML tags stripped) vs Markdown body (after frontmatter, whitespace-normalised).

| Slug | Source Thai chars | Markdown Thai chars | Δ Thai | Source non-space chars | Markdown non-space chars |
| --- | ---: | ---: | ---: | ---: | ---: |
| `acl` | 5,295 | 5,295 | 0.00% | 6,123 | 6,406 |
| `rotator-cuff` | 3,840 | 3,840 | 0.00% | 4,960 | 5,167 |
| `shoulder-dislocation` | 4,085 | 4,085 | 0.00% | 5,082 | 5,346 |
| `patellofemoral` | 2,938 | 2,938 | 0.00% | 4,106 | 4,276 |

Thai character counts match exactly. Non-space character totals are slightly higher in Markdown (~4–5%) because of structural punctuation (`##`, `**`, `>`, `—`) that replaces HTML/CSS presentation; no clinical prose was added or removed.

## Known legacy styling (not content)

Thai headings in the HTML used **Playfair Display**, which has no Thai glyphs, so headings silently fell back to a system font. v2 uses **Noto Serif Thai** in the design system.

## Global `TODO(owner)` fields

Every article frontmatter includes:

```yaml
shortAnswer: "" # TODO(owner)
```

Owner must approve a 40–60 word short answer; candidates below are **verbatim** from each article’s opening section (lead or first explanatory block).

## Still missing for published pages (template / SEO)

- **FAQPage JSON-LD** — FAQ content exists in HTML and is now in frontmatter `faq` + body; no `FAQPage` schema in legacy HTML.
- **`og:image`** — not set on any of the four legacy pages.
- **`og:locale`** — only `acl.html` had `og:locale` (`th_TH`); other three did not.
- **Sidebar table of contents** — only `acl.html` included a TOC block in markup; all four shared CSS for a TOC. Markdown does not model sidebar navigation.
- **In-page anchor IDs** — ACL sidebar links (`#acl-what`, etc.) had **no matching `id` attributes** in the HTML body.

---

## `acl` (`legacy/acl.html` → `src/content/conditions/acl.md`)

### Sections (body)

1. Lead (hero)
2. เอ็นไขว้หน้าคืออะไร?
3. ระดับความรุนแรงของการบาดเจ็บ (grade grid)
4. สาเหตุและกลไกการบาดเจ็บ
5. อาการที่พบ
6. การวินิจฉัย
7. แนวทางการรักษา (non-op, ACL reconstruction, graft types, surgical steps)
8. การฟื้นฟูหลังผ่าตัด (rehab timeline)
9. คำถามที่พบบ่อย (5 items)

Approximate Thai characters in migrated body: **5,295**.

### SEO carried across

| Field | Value |
| --- | --- |
| `<title>` | เอ็นไขว้หน้าขาด (ACL Tear) — อาการ การวินิจฉัย และการผ่าตัด \| นพ.ปรัชญา มานพ |
| `meta description` | เอ็นไขว้หน้าขาด (ACL Tear) คืออะไร อาการเป็นอย่างไร วินิจฉัยด้วย MRI ผ่าตัด ACL reconstruction ฟื้นฟูกี่เดือน โดย นพ.ปรัชญา มานพ ศัลยแพทย์ออร์โธปิดิกส์เวชศาสตร์การกีฬา |
| `meta keywords` | เอ็นไขว้หน้าขาด, ACL tear, ACL reconstruction, ผ่าตัดเอ็นไขว้หน้า, เข่าหลวม, เข่าไม่มั่นคง, เข่าหักพับ, ผ่าตัดส่องกล้องเข่า, นพ.ปรัชญา มานพ, Pratchaya Manop, sports medicine thailand |
| `canonical` | https://www.drpratchaya.com/acl |
| `og:title` | เอ็นไขว้หน้าขาด (ACL) — ผ่าตัดและฟื้นฟู \| นพ.ปรัชญา มานพ |
| `og:description` | ข้อมูลครบเรื่องเอ็นไขว้หน้าขาด อาการ การวินิจฉัย การผ่าตัด ACL reconstruction และการฟื้นฟู โดยศัลยแพทย์กีฬาผู้เชี่ยวชาญ |
| `og:url` | https://www.drpratchaya.com/acl |
| `og:locale` | th_TH |

### JSON-LD (`MedicalWebPage`)

- `@type`: `MedicalWebPage`
- `name`: เอ็นไขว้หน้าขาด (ACL Tear) — อาการ การวินิจฉัย และการผ่าตัด
- `description`: ข้อมูลครบเรื่องเอ็นไขว้หน้าขาด อาการ การวินิจฉัย การผ่าตัด ACL reconstruction และการฟื้นฟู
- `url`: https://www.drpratchaya.com/acl
- `author`: `@type` `Physician`, `name` นพ.ปรัชญา มานพ, `url` https://www.drpratchaya.com
- `about`: `@type` `MedicalCondition`, `name` Anterior Cruciate Ligament Tear, `alternateName` เอ็นไขว้หน้าขาด
- `medicalAudience`: `@type` `Patient` (**ACL only** among the four pages)

### Short-answer candidates (verbatim)

**Lead:**

> เส้นเอ็นที่มีความสำคัญที่สุดของข้อเข่า เมื่อขาดแล้วจะไม่สมานกันเองตามธรรมชาติ ต้องผ่าตัดสร้างเส้นเอ็นใหม่ทดแทน เพื่อให้เข่ากลับมามั่นคงและใช้งานได้ตามปกติ

**First section opening (alternative / extension):**

> เอ็นไขว้หน้า (Anterior Cruciate Ligament หรือ ACL) คือเส้นเอ็นที่อยู่ภายในข้อเข่า ทำหน้าที่ยึดกระดูกต้นขา (femur) กับกระดูกหน้าแข้ง (tibia) เข้าด้วยกัน ป้องกันไม่ให้กระดูกหน้าแข้งเคลื่อนไปข้างหน้ามากเกินไป และควบคุมการหมุนของเข่า

### Ambiguities / not resolved

- Sidebar TOC `href` values (`#acl-what`, …) do not correspond to element `id`s in the legacy HTML.
- Sidebar “งานวิจัยที่เกี่ยวข้อง” blurb (ACL, MPFL, Patellofemoral — Arthroscopy Techniques / OJSM) lives only in the sidebar, not in `.article-body`; not migrated into Markdown body.

---

## `rotator-cuff` (`legacy/rotator-cuff.html`)

### Sections

1. Lead
2. เอ็นหัวไหล่คืออะไร?
3. ประเภทและขนาดของรอยขาด (grade grid)
4. สาเหตุ (3 subtypes)
5. อาการที่พบ
6. การวินิจฉัย
7. การรักษา (non-op, arthroscopic repair steps, RoHI research callout)
8. การฟื้นฟูหลังผ่าตัด
9. คำถามที่พบบ่อย (4 items)

Approximate Thai characters: **3,840**.

### SEO

| Field | Value |
| --- | --- |
| `<title>` | เอ็นหัวไหล่ขาด (Rotator Cuff Tear) — อาการ การวินิจฉัย และการผ่าตัด \| นพ.ปรัชญา มานพ |
| `meta description` | เอ็นหัวไหล่ขาด (Rotator Cuff Tear) คืออะไร ปวดไหล่แบบไหนควรพบแพทย์ ผ่าตัดส่องกล้องซ่อมเอ็นหัวไหล่ ฟื้นฟูกี่เดือน โดย นพ.ปรัชญา มานพ ศัลยแพทย์ผู้เชี่ยวชาญ |
| `meta keywords` | เอ็นหัวไหล่ขาด, rotator cuff tear, ผ่าตัดไหล่, ผ่าตัดเอ็นหัวไหล่, rotator cuff repair, ปวดไหล่, ไหล่อ่อนแรง, shoulder arthroscopy, นพ.ปรัชญา มานพ, Pratchaya Manop |
| `canonical` | https://www.drpratchaya.com/rotator-cuff |
| `og:title` | เอ็นหัวไหล่ขาด (Rotator Cuff Tear) \| นพ.ปรัชญา มานพ |
| `og:description` | ข้อมูลครบเรื่องเอ็นหัวไหล่ขาด อาการ การวินิจฉัย การผ่าตัดส่องกล้องซ่อมเอ็น และการฟื้นฟู โดยศัลยแพทย์ผู้เชี่ยวชาญ |
| `og:url` | https://www.drpratchaya.com/rotator-cuff |

### JSON-LD

- `@type`: `MedicalWebPage`
- `name`: เอ็นหัวไหล่ขาด (Rotator Cuff Tear)
- `description`: ข้อมูลครบเรื่องเอ็นหัวไหล่ขาด อาการ การวินิจฉัย การผ่าตัด และการฟื้นฟู
- `url`: https://www.drpratchaya.com/rotator-cuff
- `author`: `Physician` / นพ.ปรัชญา มานพ / https://www.drpratchaya.com
- `about`: `MedicalCondition` / Rotator Cuff Tear / alternateName เอ็นหัวไหล่ขาด
- No `medicalAudience`

### Short-answer candidates

**Lead:**

> หนึ่งในสาเหตุที่พบบ่อยที่สุดของอาการปวดไหล่และไหล่อ่อนแรง เมื่อเส้นเอ็นขาดแล้วจะไม่หายเองและรอยขาดจะขยายใหญ่ขึ้นเรื่อยๆ หากไม่รักษา

### Ambiguities

- Related-article link text in sidebar says “ไหล่หลุด (Bankart Repair)” while the shoulder page H1 includes “Shoulder Dislocation & Bankart Repair”; left as-is in source only in sidebar (not in body).
- Sidebar research citations (OJSM 2023, JSES 2024) not in `.article-body`.

---

## `shoulder-dislocation` (`legacy/shoulder-dislocation.html`)

### Sections

1. Lead
2. ไหล่หลุดคืออะไร? (stat grid)
3. สาเหตุและปัจจัยเสี่ยง
4. อาการที่พบ
5. การวินิจฉัย
6. แนวทางการรักษา (non-op, Bankart steps)
7. การฟื้นฟูหลังผ่าตัด
8. คำถามที่พบบ่อย (4 items)

Approximate Thai characters: **4,085**.

### SEO

| Field | Value |
| --- | --- |
| `<title>` | ไหล่หลุด (Shoulder Dislocation & Bankart Repair) — อาการ การวินิจฉัย และการผ่าตัด \| นพ.ปรัชญา มานพ |
| `meta description` | ไหล่หลุด ไหล่หลุดซ้ำ Bankart lesion คืออะไร รักษาอย่างไร ผ่าตัด Bankart repair ด้วยการส่องกล้อง โดย นพ.ปรัชญา มานพ ศัลยแพทย์ออร์โธปิดิกส์เวชศาสตร์การกีฬา |
| `meta keywords` | ไหล่หลุด, shoulder dislocation, Bankart repair, Bankart lesion, ไหล่หลุดซ้ำ, ผ่าตัดไหล่หลุด, ผ่าตัดส่องกล้องไหล่, SLAP repair, นพ.ปรัชญา มานพ, Pratchaya Manop, sports medicine thailand |
| `canonical` | https://www.drpratchaya.com/shoulder-dislocation |
| `og:title` | ไหล่หลุด & Bankart Repair \| นพ.ปรัชญา มานพ |
| `og:description` | ข้อมูลครบเรื่องไหล่หลุด Bankart lesion อาการ การวินิจฉัย การผ่าตัดส่องกล้อง Bankart repair และการฟื้นฟู |
| `og:url` | https://www.drpratchaya.com/shoulder-dislocation |

### JSON-LD

- `@type`: `MedicalWebPage`
- `name`: ไหล่หลุด (Shoulder Dislocation & Bankart Repair)
- `description`: ข้อมูลครบเรื่องไหล่หลุด Bankart lesion การผ่าตัดส่องกล้อง Bankart repair และการฟื้นฟู
- `url`: https://www.drpratchaya.com/shoulder-dislocation
- `author`: `Physician` / นพ.ปรัชญา มานพ
- `about`: `MedicalCondition` / Shoulder Dislocation / alternateName ไหล่หลุด
- No `medicalAudience`

### Short-answer candidates

**Lead:**

> ข้อไหล่หลุดง่ายที่สุดในร่างกาย และมีอัตราหลุดซ้ำสูงมากในคนอายุน้อย การผ่าตัด Bankart repair ด้วยการส่องกล้องเป็นวิธีที่มีประสิทธิภาพสูงสุดในการป้องกันการหลุดซ้ำ

### Ambiguities

- Stat card label uses HTML entity `อายุ &lt;20 ปี`; rendered as “อายุ <20 ปี” in Markdown.
- Sidebar JSES Reviews 2024 citation not in `.article-body`.

---

## `patellofemoral` (`legacy/patellofemoral.html`)

### Sections

1. Lead
2. ปัญหาข้อสะบ้ามีกี่แบบ? (four condition cards)
3. สะบ้าหลุด (Patellar Dislocation) — risk factors, MPFL reconstruction steps, research callout
4. ข้อสะบ้าเสื่อม — symptoms, non-op injections, research callout (2026)
5. การฟื้นฟูหลังผ่าตัด MPFL
6. คำถามที่พบบ่อย (4 items)

Approximate Thai characters: **2,938**.

### SEO

| Field | Value |
| --- | --- |
| `<title>` | ปัญหาข้อสะบ้า (Patellofemoral & MPFL Reconstruction) — อาการ การวินิจฉัย และการรักษา \| นพ.ปรัชญา มานพ |
| `meta description` | สะบ้าหลุด สะบ้าหลุดซ้ำ เจ็บเข่าด้านหน้า MPFL reconstruction ข้อเสื่อม patellofemoral การฉีด hyaluronate คืออะไร รักษาอย่างไร โดย นพ.ปรัชญา มานพ |
| `meta keywords` | สะบ้าหลุด, patellofemoral, MPFL reconstruction, เจ็บเข่าด้านหน้า, สะบ้าหลุดซ้ำ, ข้อสะบ้าเสื่อม, hyaluronate injection, นพ.ปรัชญา มานพ, Pratchaya Manop, knee specialist thailand |
| `canonical` | https://www.drpratchaya.com/patellofemoral |
| `og:title` | ปัญหาข้อสะบ้า & MPFL Reconstruction \| นพ.ปรัชญา มานพ |
| `og:description` | สะบ้าหลุด MPFL reconstruction เจ็บเข่าด้านหน้า ข้อสะบ้าเสื่อม การรักษาครบทุกแบบ โดยศัลยแพทย์ผู้เชี่ยวชาญ |
| `og:url` | https://www.drpratchaya.com/patellofemoral |

### JSON-LD

- `@type`: `MedicalWebPage`
- `name`: ปัญหาข้อสะบ้า (Patellofemoral & MPFL Reconstruction)
- `description`: ข้อมูลครบเรื่องปัญหาข้อสะบ้า สะบ้าหลุด MPFL reconstruction และการรักษาข้อสะบ้าเสื่อม
- `url`: https://www.drpratchaya.com/patellofemoral
- `author`: `Physician` / นพ.ปรัชญา มานพ
- `about`: `MedicalCondition` / Patellofemoral Disorder / alternateName ปัญหาข้อสะบ้า
- No `medicalAudience`

### Short-answer candidates

**Lead:**

> ตั้งแต่สะบ้าหลุดซ้ำในนักกีฬา ไปจนถึงข้อเสื่อมสะบ้าในผู้สูงอายุ ปัญหาข้อสะบ้ามีหลายรูปแบบและแต่ละแบบต้องการการรักษาที่แตกต่างกัน

### Ambiguities

- Opening copy says problems divide into **“3 กลุ่มหลัก”** but the layout shows **four** condition cards (including Chondromalacia Patella). Not reconciled.
- Research block links pointed to `index.html#research`; Markdown retains link **text** only (“ตีพิมพ์ใน … →”), not URLs, matching visible copy without adding routes.
- Sidebar research list (two papers) duplicated partially in body; sidebar-only lines were not added to body.
