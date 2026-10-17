# LevelUp Money Life — Design Reference

> **วัตถุประสงค์:** ไฟล์นี้คือ single source of truth สำหรับ AI agent หรือ developer ที่จะทำงานกับ project นี้ อ่านไฟล์เดียวแล้วเข้าใจ design system ทั้งหมดได้โดยไม่ต้องไล่อ่านทุก component

---

## 1. Product Context & Personality

**แอปคืออะไร:** Desktop finance tracker ที่มี gamification layer — ผู้ใช้คือ working adult ที่อยากจัดการ salary, expenses, savings, และ daily habits ในที่เดียว

**Brand Personality:** Finance Command Center ที่มี quest, XP, และ level — รู้สึก motivating และ clear ไม่ใช่ bank website หรือ fantasy game

**Design Principle ที่ต้องจำ:**
1. **Finance first, game layer second** — money data ต้องอ่านได้ก่อนเสมอ
2. **Month-end clarity** — ทุก screen ต้องตอบ "เงินหายไปกับอะไร?" ได้เร็ว
3. **Habit loop** — logging และ quest ต้อง low friction แต่ให้ความรู้สึก rewarding
4. **Planning over guilt** — summary ชี้ทางต่อ ไม่ตำหนิ

**Anti-references:** ห้ามดูเหมือน bank website (stiff, corporate, cold) และห้าม overloaded fantasy decoration ที่ทำให้ table อ่านยาก

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | React + Vite (TypeScript) |
| Desktop | Tauri v2 |
| Styling | Tailwind CSS **v4** (`@tailwindcss/postcss`) |
| Animation | Motion v12 (`motion/react`) |
| Icons (static) | `iconsax-react` via `src/components/icons` (never import it directly in components) |
| Icons (animated) | Lordicon Wired Outline (free set) via `LordIcon` + `lottie-web` light player |
| Font (Latin, numerals) | `Outfit Variable` (`@fontsource-variable/outfit`) |
| Font (Thai) | `Anuphan Variable` (`@fontsource-variable/anuphan`) |
| i18n | `react-i18next` (TH / EN) |
| Charts | `recharts` |
| OCR | `tesseract.js` |

> **Tailwind v4 Rule:** ห้ามใช้ `tailwindcss` plugin ใน `postcss.config.js` — ใช้ `@tailwindcss/postcss` เท่านั้น

---

## 3. Color Tokens

Tokens ถูก define ใน `src/index.css` ทั้ง `:root` (light) และ `.dark` (dark mode)

### 3.1 Semantic Surface Tokens

| Token | Light value | Dark value | ใช้กับ |
|---|---|---|---|
| `--base` | `#F5F8F4` (Mist Green) | `#071B1A` (Ink Green) | page background |
| `--surface` | `#FEFFFC` (Pure Crisp) | `#0D2927` (Ink Forest) | card / panel bg |
| `--surface-subtle` | `#EAF1EB` (Mist Subtle) | `#143532` (Forest Subtle) | header/footer ของ card |
| `--ink` | `#142D2B` (Deep Ink) | `#EDF7F1` (Crisp Sage) | primary text |
| `--ink-soft` | `#49605C` (Slate Forest) | `#C2D3CB` (Muted Sage) | secondary text, labels |
| `--ink-faint` | `#6B827E` (Muted Forest) | `#8FA79D` (Faint Sage) | placeholder, hint text |
| `--line` | `#D9E5DD` (Light Sage) | `#294943` (Defined Forest) | border, divider |
| `--line-subtle` | `#E5EFE8` (Subtle) | `#1D3D3A` (Forest Sub) | เส้นแบ่งที่ faint มาก |

### 3.2 Semantic Accent Tokens

| Token group | Light | Dark | ความหมาย |
|---|---|---|---|
| `--primary` / `--primary-soft` / `--primary-ink` / `--primary-contrast` | `#1C5954` / `rgba(28,89,84,.10)` / `#1C5954` / `#FEFFFC` | `#76AA9D` / `rgba(118,170,157,.16)` / `#76AA9D` / `#071B1A` | Primary action, active tab, CTA button |
| `--jade` / `--jade-soft` / `--jade-ink` | `#4D8E75` / `rgba(77,142,117,.12)` / `#285444` | `#8BB999` / `rgba(139,185,153,.16)` / `#8BB999` | Income, XP gain, growth, savings |
| `--amber` / `--amber-soft` / `--amber-ink` | `#C99A4B` / `rgba(201,154,75,.12)` / `#8A601B` | `#D7AE68` / `rgba(215,174,104,.16)` / `#D7AE68` | Warning, pending, streak badge |
| `--rose` / `--rose-soft` / `--rose-ink` | `#B96D69` / `rgba(185,109,105,.12)` / `#873632` | `#D58A83` / `rgba(213,138,131,.16)` / `#D58A83` | Expense, error, debt |
| `--moss` / `--moss-soft` / `--moss-ink` | `#879B62` / `rgba(135,155,98,.12)` / `#4E5E32` | `#A7B67B` / `rgba(167,182,123,.16)` / `#A7B67B` | Secondary category (Home, Health) |

### 3.3 Special Tokens

| Token | Light | Dark | ใช้กับ |
|---|---|---|---|
| `--amount-icon-rose` | `#A03C38` | `#F0A49E` | Icon ของ expense amount (contrast สูงกว่า `--rose`) |
| `--amount-icon-jade` | `#2D7A5A` | `#7DD6A8` | Icon ของ income amount |

### 3.4 Shadow Tokens

| Token | ใช้กับ |
|---|---|
| `--shadow-diffuse` | Card hover state, larger containers |
| `--shadow-tile` | Default card shadow (subtle) |
| `--shadow-press` | Active/pressed state |
| `--shadow-glow-teal` | Focus ring glow effect บน primary elements |

### 3.5 วิธีใช้ Token ใน Tailwind v4

```tsx
// ถูก — อ้างอิงผ่าน CSS variable
className="bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--color-line)]"

// ผิด — hardcode hex โดยไม่อ้างอิง token
className="bg-[#FEFFFC] text-[#142D2B]"
```

> **ข้อยกเว้น:** primary button และ active tab ใช้ hardcode hex เพราะต้องการ light/dark override เฉพาะตัว:
> `bg-[#1C5954] text-[#FEFFFC] dark:bg-[#76AA9D] dark:text-[#071B1A]`

---

## 4. Typography

### 4.1 Font Stack

```
--font-sans: "Outfit Variable", "Anuphan Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
--font-mono: var(--font-sans); /* numerals use sans + tabular-nums via .font-mono */
```

- **Outfit** — อังกฤษและตัวเลขทั้งแอป (Outfit ไม่มีตัวอักษรไทย)
- **Anuphan** — ตัวอักษรไทย ถูกเลือกอัตโนมัติผ่าน font stack
- `font-mono` = ฟอนต์ sans + `tabular-nums` ใช้กับ **ตัวเลขทางการเงิน** (amount, XP, percentage) เพื่อให้หลักเรียงตรงกัน
- `html[lang="th"]` ถูกตั้งโดย `i18n.ts` และเพิ่ม line-height เป็น 1.6 เพราะสระ/วรรณยุกต์ไทยต้องการพื้นที่แนวตั้ง

### 4.2 Type Scale

| Role | Class | ใช้กับ |
|---|---|---|
| Section heading | `text-sm font-semibold tracking-tight` | Card title, section label |
| Micro label | `text-[11px] font-semibold uppercase tracking-wider` | MetricTile label, badge |
| Body text | `text-sm text-[var(--color-ink-soft)] leading-relaxed` | Description, notes |
| Hint / Caption | `text-[11px] text-[var(--color-ink-faint)]` | Subtext, helper |
| Metric value | `font-mono text-xl sm:text-2xl font-bold tracking-tight` | Financial numbers |
| Tab label | `text-xs font-semibold` | Nav tab |

> **Rule:** ห้ามใช้ Inter font — ใช้ Outfit (อังกฤษ/ตัวเลข) และ Anuphan (ไทย) เท่านั้น
> **Rule:** ตัวเลขการเงิน (บาท, XP, %) ต้องใช้ `font-mono` (tabular-nums) เสมอ

---

## 5. Spacing & Layout

### 5.1 Design Variance: Level 8 (Asymmetric)

ตาม design-taste-frontend-v1 skill — project นี้ตั้ง `DESIGN_VARIANCE: 8` หมายความว่า:
- Layout ต้อง **asymmetric** ไม่ centered-only
- ใช้ **CSS Grid** แทน flexbox math (`grid grid-cols-1 md:grid-cols-3 gap-6`)
- Desktop ใช้ layout หนาแน่น (dense) ได้ แต่ mobile ต้อง single-column เสมอ (`w-full px-4`)

### 5.2 Standard Spacing

| Context | Value |
|---|---|
| Card internal padding | `p-5 sm:p-6` |
| Card header/footer padding | `px-5 py-3.5 sm:px-6 sm:py-4` |
| MetricTile internal | `p-4 sm:p-4.5` |
| Gap ระหว่าง section | `gap-4` – `gap-6` |
| Gap ใน form block | `gap-2` |

### 5.3 Border Radius

| Context | Value |
|---|---|
| Card / Panel | `rounded-2xl` |
| Button pill / badge | `rounded-full` |
| Button standard | `rounded-xl` |
| Input field | `rounded-lg` |
| Icon container | `rounded-lg` |

### 5.4 Page Layout Pattern

```tsx
// ห้ามใช้ h-screen — ใช้ min-h-[100dvh] เสมอ
<div className="min-h-[100dvh] bg-[var(--color-base)]">
  <div className="max-w-7xl mx-auto px-4 py-6">
    ...
  </div>
</div>
```

---

## 6. Component Patterns

### 6.1 BentoCard

ไฟล์: `src/components/common/BentoCard.tsx`

```tsx
<BentoCard
  header={<h2>ชื่อ section</h2>}   // optional — renders bg-surface-subtle strip
  footer={<p>footer content</p>}    // optional
  noPadding={false}                  // true = ไม่ใส่ p-5 default padding
>
  {/* content */}
</BentoCard>
```

**Anatomy:**
- `rounded-2xl border border-line bg-surface shadow-tile`
- Hover: `shadow-diffuse`
- Top edge: `1px` inner highlight (`bg-white/40 dark:bg-white/10`) — liquid glass refraction
- Animate in: `opacity: 0 → 1, y: 12 → 0` ด้วย ease `[0.16, 1, 0.3, 1]`
- Header strip: `bg-surface-subtle border-b border-line`

### 6.2 MetricTile

ไฟล์: `src/components/common/MetricTile.tsx`

```tsx
<MetricTile
  icon={<TrendUp size={16} weight="duotone" />}
  label="รายรับเดือนนี้"
  value="฿32,500"
  subtext="เพิ่มขึ้น 8% จากเดือนที่แล้ว"
  tone="jade"  // jade | teal | rose | amber | moss | neutral
  onClick={...}
/>
```

**Tone → Color mapping:**
| Tone | Icon bg | Value text |
|---|---|---|
| `jade` / `emerald` | `jade-soft` bg, `jade-ink` text | `jade-ink` |
| `teal` | `primary-soft` bg, `primary-ink` text | `primary-ink` |
| `rose` | `rose-soft` bg, `rose-ink` text | `rose-ink` |
| `amber` | `amber-soft` bg, `amber-ink` text | `amber-ink` |
| `moss` / `indigo` | `moss-soft` bg, `moss-ink` text | `moss-ink` |
| `neutral` | `surface-subtle` bg, `ink-soft` text | `ink` |

**Motion:** Hover ยก `y: -2` ด้วย spring `stiffness: 350, damping: 25`

### 6.3 Modal Pattern

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <motion.div
    initial={{ opacity: 0, scale: 0.96, y: 8 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.96, y: 8 }}
    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    className="relative w-full max-w-lg rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--shadow-diffuse)] overflow-hidden"
  >
    {/* Liquid glass top edge */}
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40 dark:bg-white/10" />
    ...
  </motion.div>
</div>
```

### 6.4 Badge Pattern (Gamification)

```tsx
// Level badge — jade tone
<div className="inline-flex items-center gap-2 rounded-full border border-[var(--jade)]/30 bg-[var(--jade-soft)] px-3 py-1 text-xs font-semibold text-[var(--jade-ink)] shadow-xs">
  <Trophy size={14} weight="fill" className="text-[var(--jade)]" />
  <span>Lv.5 · Strategist</span>
</div>

// Streak badge — amber tone
<div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--amber)]/30 bg-[var(--amber-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--amber-ink)] shadow-xs">
  <Fire size={14} weight="fill" className="text-[var(--amber)]" />
  <span>7-Day Streak</span>
</div>
```

**Badge border rule:** ใช้ `border-[color]/30` เสมอ — ไม่ใช้ solid border บน badge

### 6.5 Button Patterns

```tsx
// Primary CTA (Quick Add)
<button className="inline-flex items-center gap-1.5 rounded-xl bg-[#1C5954] text-[#FEFFFC] dark:bg-[#76AA9D] dark:text-[#071B1A] px-3.5 py-2 text-xs font-semibold transition hover:opacity-90 active:scale-[0.98] shadow-sm">

// Secondary / Ghost button
<button className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-surface)] active:scale-[0.98] shadow-xs">

// Tinted CTA (Scan Slip)
<button className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary-soft)] px-3 py-2 text-xs font-semibold text-[var(--primary-ink)] transition hover:opacity-90 active:scale-[0.98] shadow-xs">
```

**Active state rule:** ทุก interactive element ต้องมี `active:scale-[0.98]`

### 6.6 Tab Navigation

```tsx
// Active tab
<button className="rounded-xl px-4 py-2 text-xs font-semibold bg-[#1C5954] text-[#FEFFFC] dark:bg-[#76AA9D] dark:text-[#071B1A] shadow-sm">

// Inactive tab
<button className="rounded-xl px-4 py-2 text-xs font-semibold bg-[var(--color-surface-subtle)] text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)] border border-[var(--color-line)] transition-all">
```

### 6.7 Segmented Pill (Theme / Language switcher)

```tsx
<div className="inline-flex items-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] p-0.5 shadow-xs">
  {/* Active indicator via Motion layoutId */}
  <motion.div layoutId="pillIndicator" className="absolute inset-0 rounded-lg bg-[var(--color-surface)] shadow-xs border border-[var(--color-line)]" />
  <button className="relative z-10 ...">Option A</button>
</div>
```

### 6.8 Financial Table

- ใช้ `divide-y divide-[var(--color-line-subtle)]` แทน card-per-row
- Amount column: `font-mono` เสมอ
- Expense amount: `rose-ink` / `amount-icon-rose`
- Income amount: `jade-ink` / `amount-icon-jade`
- Category badge: `rounded-full px-2 py-0.5 text-[10px] font-semibold`

### 6.9 XP Progress Bar

```tsx
<div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-line)]">
  <motion.div
    className="h-full rounded-full bg-gradient-to-r from-[#4D8E75] to-[#1C5954] dark:from-[#8BB999] dark:to-[#76AA9D]"
    initial={{ width: 0 }}
    animate={{ width: `${progressPct}%` }}
    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
  />
</div>
```

---

## 7. Motion & Animation

**Library:** `motion` (import จาก `"motion/react"`) — ไม่ใช้ `framer-motion` โดยตรงอีกต่อไป
**Tokens:** `src/constants/motion.ts` — ห้ามเขียน `stiffness`/`damping`/`ease` แบบ inline ใน component

หลักคิด (จาก Impeccable `animate`): motion ต้องมีหน้าที่ — ยืนยัน action, อธิบาย state/ความสัมพันธ์, รักษา continuity หรือเป็นโมเมนต์สำคัญหนึ่งเดียว (Level Up) ไม่ใช่ของตกแต่ง

### 7.1 Timing

| Token | ระยะเวลา | ใช้กับ |
|---|---|---|
| `DURATION.feedback` | 120ms | feedback ทันที (กด, toggle) |
| `DURATION.state` | 200ms | เปลี่ยน state ทั่วไป |
| `DURATION.overlay` | 300ms | modal, view transition, card mount |
| `DURATION.focal` | 600ms | โมเมนต์ที่ตั้งใจ (XP bar) |

Exit เร็วกว่า entrance เสมอ · Easing หลัก: `EASE_OUT_EXPO = [0.16, 1, 0.3, 1]` ผ่าน `easeOut(duration)`

### 7.2 Springs (Motion `visualDuration` + `bounce`)

```ts
SPRING.press     // { visualDuration: 0.15, bounce: 0 }  ปุ่ม, tile hover/tap
SPRING.state     // { visualDuration: 0.22, bounce: 0 }  pill indicator, popover, select
SPRING.overlay   // { visualDuration: 0.3,  bounce: 0 }  modal, toast
SPRING.celebrate // { visualDuration: 0.5,  bounce: 0.2 } Level Up เท่านั้น
```

งาน routine ใช้ `bounce: 0` (ไม่ overshoot) — bounce อนุญาตเฉพาะ celebration

### 7.3 Mount Animation Presets

```tsx
// BentoCard (ไม่มี hover lift — การ์ดที่คลิกไม่ได้ห้ามลอย)
initial={{ opacity: 0, y: 12 }}
animate={{ opacity: 1, y: 0 }}
transition={easeOut(DURATION.overlay)}

// Modal
transition={SPRING.overlay}
```

### 7.4 Staggered List

ใช้ `stagger()` ของ Motion เฉพาะเมื่อสิ่งที่ปรากฏเป็น list จริง และจำกัด delay รวม ≤ ~300ms

```tsx
import { stagger } from "motion/react";
const container = { animate: { transition: { delayChildren: stagger(0.04) } } };
```

### 7.5 Performance & Anti-patterns

| ห้าม | แทนด้วย |
|---|---|
| Animate `width`/`height`/`top`/`left` สำหรับ progress bar | `scaleX` + `origin-left` (w-full) |
| `animate-pulse` บน status ที่นิ่ง | จุดสีนิ่ง — pulse เฉพาะงานที่กำลังทำงานจริง (เช่น OCR scanning) |
| `whileHover` ยก/หมุน element ที่คลิกไม่ได้ หรือรูป/โลโก้ | hover feedback เฉพาะ element ที่ interactive |
| Spring stiffness/damping ที่ overshoot | `SPRING.*` tokens |
| `window.addEventListener('scroll')` | `useScroll` จาก `motion/react` |
| `useState` สำหรับ continuous animation | `useMotionValue` + `useTransform` |
| `z-50` ไม่มีเหตุผล | z-index เฉพาะ modal (50), overlay (30) |

ข้อยกเว้น: expand/collapse panel ใช้ `height: "auto"` ของ Motion ได้ (Motion วัดขนาดให้)

### 7.6 Reduced Motion (ห้ามลบ)

`<MotionConfig reducedMotion="user">` ครอบทั้งแอป (ตัด transform, คง opacity/สี) + CSS fallback:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Icon Usage (Iconsax + Lordicon)

Import จาก `src/components/icons` เท่านั้น ห้าม import `iconsax-react` ตรงๆ

- `index.tsx` — wrapper ที่แปลง prop `weight` เป็น Iconsax variant และคงชื่อ export เดิม (`Plus`, `Trash`, `CheckCircle` …)
- `glyphs.tsx` — ไอคอนที่ Iconsax ไม่มี (Check, X, Circle, Fire, TShirt) วาดตาม grid และเส้น 1.5px เดียวกัน
- `utils/iconKeys.ts` — รายการ key, alias ของค่าเก่า (emoji / ชื่อ Phosphor) และ `resolveIconKey` เป็น pure data ไม่ import React ชั้นข้อมูลใช้ไฟล์นี้
- `registry.tsx` — ไอคอนที่ **เก็บเป็นข้อมูล** (preset, หมวดหมู่, เป้าหมายออม) เก็บเป็น key เช่น `coffee`, `meal`, `transit` ไม่ผูกกับไลบรารี ค่าเก่าถูกแปลงตอนโหลดแล้วเขียนกลับ DB หนึ่งครั้ง ถ้าจะเพิ่มไอคอนให้เพิ่มใน `ICON_KEYS` (utils/iconKeys.ts) และ `ICONS` (registry.tsx) TypeScript จะบังคับให้ทั้งสองตรงกัน
- ใช้ `<AppIcon name={...} />` เมื่อแสดงค่าที่มาจากข้อมูล และ `<PresetIcon />` สำหรับ preset (สีตามหมวดหมู่)

### 8.1 Weight Convention

| Context | Weight | Iconsax variant |
|---|---|---|
| UI ทั่วไป (nav, ปุ่ม, header) | `regular` / `bold` | Linear |
| Active, badge, status, เน้น | `fill` | Bold |
| Preset, หมวดหมู่, ไอคอนตกแต่ง | `duotone` | Bulk |

### 8.1.1 Animated icons (Lordicon)

ใช้ `LordIcon` ได้ไม่เกินจุดสำคัญ: level-up (`confetti`), quest สำเร็จ (`medal`), บันทึกรายการสำเร็จ (`check`), balance ตรงกัน (`scale`), empty state ของรายการ (`coins`) และเป้าหมายออม (`piggy-bank`)

- เล่นครั้งเดียว ไม่วนซ้ำ สีวาดใหม่ตามธีมตอนรันจึงใช้ได้ทั้ง light/dark
- ต้องส่ง `fallback` เป็นไอคอน Iconsax เสมอ จะแสดงแทนเมื่อผู้ใช้ตั้ง `prefers-reduced-motion`
- ไฟล์ JSON อยู่ใน `src/assets/lordicon` ไม่โหลดจาก CDN ตอนรัน ไอคอนฟรีต้องมีเครดิต (อยู่ท้ายหน้า Settings)

### 8.2 Size Convention

| Context | Size |
|---|---|
| Badge icon | `size={14}` |
| Button icon | `size={15}` |
| Form / input icon | `size={16}` |
| Header icon | `size={16}` – `size={18}` |
| Section icon | `size={20}` |
| Empty state | `size={48}` – `size={64}` |

### 8.3 Icon Color Rules

```tsx
// ถูก — icon ใช้ token ของ accent
<Trophy size={14} weight="fill" className="text-[var(--jade)]" />
<Fire size={14} weight="fill" className="text-[var(--amber)]" />

// ถูก — amount icon ใช้ special high-contrast token
<ArrowDown size={16} style={{ color: "var(--amount-icon-rose)" }} />
<ArrowUp size={16} style={{ color: "var(--amount-icon-jade)" }} />

// ผิด — hardcode hex
<Icon className="text-[#4D8E75]" />

// ผิด — emoji แทน icon
<span>🔥 7 วัน</span>
```

> **ANTI-EMOJI POLICY:** ห้ามใช้ emoji ทุกกรณี ใช้ไอคอนจาก `src/components/icons` เท่านั้น

---

## 9. Category Color Mapping

ดูจาก `src/types.ts`

| Category | Hex | Token | Semantic |
|---|---|---|---|
| `Income` | `#4D8E75` | `--jade` | Growth / Positive |
| `Food` | `#C99A4B` | `--amber` | Daily living |
| `Transport` | `#1C5954` | `--primary` | Core structure |
| `Home` | `#879B62` | `--moss` | Domestic |
| `Health` | `#879B62` | `--moss` | Wellness |
| `Learning` | `#1C5954` | `--primary` | Growth investment |
| `Fun` | `#C99A4B` | `--amber` | Lifestyle |
| `Debt` | `#B96D69` | `--rose` | Obligation |
| `Savings` | `#4D8E75` | `--jade` | Positive goal |

### Budget Buckets

| Bucket | Hex | Token | Categories |
|---|---|---|---|
| `Needs` | `#1C5954` | `--primary` | Food, Transport, Home, Health |
| `Wants` | `#879B62` | `--moss` | Learning, Fun |
| `Savings` | `#4D8E75` | `--jade` | Debt, Savings |

### Chart Palette (Recharts)

```ts
CHART_PALETTE = ["#4D8E75", "#1C5954", "#879B62", "#C99A4B", "#B96D69"]
// Jade → Teal → Moss → Amber → Rose
```

---

## 10. Gamification Layer

### 10.1 GamificationState Structure

```ts
type GamificationState = {
  level: number;
  currentLevelXp: number;
  xpForNextLevel: number;
  totalXp: number;
  streakDays: number;
  lastActiveDate: string;   // ISO date string
  titleRankKey: string;     // i18n key เช่น "rank.strategist"
  unlockedAchievementIds: string[];
}
```

### 10.2 XP Sources

| Action | XP |
|---|---|
| เพิ่ม transaction | ตาม config |
| Scan slip (OCR) | +25 XP |
| Complete daily quest | ตาม `quest.xp` |
| Unlock achievement | ตาม `achievement.xpReward` |

### 10.3 Quest Types

| Category | พฤติกรรม |
|---|---|
| `daily` | รีเซตรายวัน, กด done รับ XP |
| `habit` | track ต่อเนื่อง, เพิ่ม streak |
| `milestone` | unlock ครั้งเดียวเมื่อถึง target |

### 10.4 Achievement Structure

```ts
type Achievement = {
  id: string;
  titleKey: string;     // i18n key
  descKey: string;      // i18n key
  iconName: string;     // legacy Phosphor name (not rendered); stored icons elsewhere use registry keys
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}
```

### 10.5 Badge Design Rules

- Level badge: jade tone (`jade-soft` bg, `jade-ink` text, `jade` icon)
- Streak badge: amber tone (`amber-soft` bg, `amber-ink` text, `amber` icon)
- Border: `border-[color]/30` เสมอ (ไม่ใช้ solid border)

---

## 11. Accessibility Rules

- Target: **WCAG AA** contrast
- ห้ามใช้ color เป็น indicator เพียงอย่างเดียว — ต้องมี label หรือ icon ประกอบ
- ทุก icon-only button ต้องมี `aria-label`
- Form label ต้องอยู่ **เหนือ** input (ห้าม inline label ลอย)
- Checkbox: `accent-color: var(--primary)` + `:focus-visible` ring
- Font size ขั้นต่ำ: `text-[11px]` สำหรับ UI element ปกติ

---

## 12. View Structure

| View (Tab) | Component | หน้าที่ |
|---|---|---|
| `dashboard` | `views/DashboardOverview.tsx` | Summary cards, recent transactions, XP snapshot |
| `ledger` | `views/TransactionLedger.tsx` | Full transaction table + filter/sort |
| `budget` | `views/BudgetPlanner.tsx` | 50/30/20 allocation, bucket progress |
| `analytics` | `views/AnalyticsHub.tsx` | Charts, category breakdown |
| `quests` | `views/QuestsGrowth.tsx` | Daily quests, achievements, streak |

**Global header:** `HeaderCommandDeck.tsx`
**Modals:** `QuickAddModal.tsx`, `SlipScanModal.tsx`, `DataManagerModal.tsx`

---

## 13. i18n

Languages: Thai (`th`) + English (`en`) — toggle ใน header

```tsx
const { t } = useTranslation()
// ถูก: t("key.path")
// ผิด: hardcode Thai/English string ใน JSX
```

ทุก string ต้องอยู่ใน `src/i18n.ts`

---

## 14. Do's & Don'ts

### Do

- ใช้ `min-h-[100dvh]` แทน `h-screen`
- ใช้ CSS Grid แทน flexbox percentage math
- ใช้ `font-mono` กับตัวเลขทางการเงินทุกตัว
- เพิ่ม `1px` inner highlight ที่ขอบบนของทุก card
- Animate ด้วย `transform` และ `opacity` เท่านั้น
- ใช้ `active:scale-[0.98]` กับทุก interactive element
- ใช้ token ผ่าน `var(--token-name)` ไม่ hardcode hex
- ใช้ `weight="duotone"` (Bulk) กับไอคอนตกแต่ง และ Linear กับไอคอน UI
- ตรวจ `package.json` ก่อน import library ใดก็ตาม
- Wrap animated list ด้วย `<AnimatePresence>`
- ให้ financial table ใช้ `divide-y` แทน card-per-row

### Don't

- ห้ามใช้ Inter font
- ห้ามใช้ emoji ทุกกรณี
- ห้ามใช้ `h-screen`
- ห้ามใช้ `#000000` pure black — ใช้ `--ink` token
- ห้ามใช้ AI purple/neon gradient
- ห้ามใช้ 3 equal-width card layout horizontal
- ห้าม animate `top`, `left`, `width`, `height`
- ห้ามใช้ `window.addEventListener('scroll')`
- ห้ามใช้ `useState` สำหรับ continuous animation
- ห้าม spam `z-50` โดยไม่มีเหตุผล
- ห้ามใช้ rounded demo numbers (50%, 99.99%) — ใช้ organic เช่น 47.3%
- ห้ามสร้าง abstraction สำหรับ single-use code
- ห้ามแก้ code ที่ไม่เกี่ยวกับ task ที่ได้รับ (Karpathy surgical change)

---

*Design doc นี้ reflect state ของ project ณ วันที่สร้าง — update เมื่อ token หรือ pattern เปลี่ยน*
