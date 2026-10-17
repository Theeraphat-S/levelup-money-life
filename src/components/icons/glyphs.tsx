import React, { forwardRef } from "react";
import type { Icon as IconsaxIcon, IconProps as IconsaxProps } from "iconsax-react";

type Variant = NonNullable<IconsaxProps["variant"]>;
type Draw = (color: string) => React.ReactNode;

/**
 * Hand-drawn glyphs for shapes Iconsax does not ship (plain check, plain X, fire, shirt…).
 * They follow Iconsax's grid and stroke (24px, 1.5px, round caps) and take the same props,
 * so the icon wrapper treats them exactly like an Iconsax import.
 */
function glyph(name: string, draw: { linear: Draw; bold?: Draw; bulk?: Draw }): IconsaxIcon {
  const Glyph = forwardRef<SVGSVGElement, IconsaxProps>(({ variant, color = "currentColor", size = 24, ...rest }, ref) => {
    const v: Variant = variant ?? "Linear";
    const body = v === "Bold" ? (draw.bold ?? draw.linear) : v === "Bulk" || v === "TwoTone" ? (draw.bulk ?? draw.linear) : draw.linear;
    return (
      <svg {...rest} ref={ref} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
        {body(color)}
      </svg>
    );
  });
  Glyph.displayName = name;
  return Glyph as unknown as IconsaxIcon;
}

const line = (d: string, color: string, width = 1.5) => (
  <path d={d} stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
);

const CHECK = "M5 12.5 9.5 17 19 7.5";
export const CheckGlyph = glyph("Check", {
  linear: (c) => line(CHECK, c),
  bold: (c) => line(CHECK, c, 2.25),
});

const CROSS = "M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5";
export const CrossGlyph = glyph("Cross", {
  linear: (c) => line(CROSS, c),
  bold: (c) => line(CROSS, c, 2.25),
});

export const CircleGlyph = glyph("Circle", {
  linear: (c) => <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.5" />,
  bold: (c) => <circle cx="12" cy="12" r="9.75" fill={c} />,
  bulk: (c) => (
    <>
      <circle cx="12" cy="12" r="9.75" fill={c} opacity=".4" />
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.5" />
    </>
  ),
});

const FLAME =
  "M12 21.5c3.87 0 7-2.74 7-6.86 0-3.04-1.69-5.33-3.35-6.86-.36-.33-.94-.06-.95.43-.04 1.38-.55 2.52-1.7 3.04.03-3.5-1.5-6.3-4.06-8.06-.42-.29-.98.05-.95.56.2 3.21-1.58 5.04-3.04 6.62C5.6 11.88 5 13.12 5 14.64c0 4.12 3.13 6.86 7 6.86Z";
const FLAME_CORE =
  "M12 21.5c-1.66 0-3-1.2-3-2.95 0-1.5 1.1-2.6 2.08-3.6.33-.34.9-.18.98.29.15.83.6 1.4 1.24 1.6.13-.5.43-.93.82-1.2.33-.22.77-.02.84.37.03.24.04.5.04.78 0 2.6-1.34 4.71-3 4.71Z";
export const FireGlyph = glyph("Fire", {
  linear: (c) => (
    <>
      {line(FLAME, c)}
      {line(FLAME_CORE, c)}
    </>
  ),
  bold: (c) => <path d={FLAME} fill={c} />,
  bulk: (c) => (
    <>
      <path d={FLAME} fill={c} opacity=".4" />
      <path d={FLAME_CORE} fill={c} />
    </>
  ),
});

const SHIRT = "M8.5 3.5 4 5.5 2.5 10.5l3 1.1v8.9h13v-8.9l3-1.1L20 5.5l-4.5-2c-.6 1.5-2 2.5-3.5 2.5S9.1 5 8.5 3.5Z";
export const ShirtGlyph = glyph("Shirt", {
  linear: (c) => line(SHIRT, c),
  bold: (c) => <path d={SHIRT} fill={c} />,
  bulk: (c) => (
    <>
      <path d={SHIRT} fill={c} opacity=".4" />
      {line(SHIRT, c)}
    </>
  ),
});
