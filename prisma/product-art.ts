/**
 * Generated product illustrations for the demo catalogue.
 *
 * These are flat-vector drawings, not photographs. They exist so the seeded
 * shop looks like a real shop when it is demonstrated, without borrowing
 * anyone's copyrighted product photography for a commercial site. The client
 * replaces them with real photos through Admin → Products → Images.
 *
 * Each product gets three views so the gallery has something to show:
 *   0  studio    the product, centred, on a tinted ground
 *   1  angled    same product, rotated and on a deeper ground
 *   2  detail    zoomed in, for the thumbnail strip
 */

const INK = "#2f3336";
const INK_2 = "#464c51";
const INK_3 = "#5d646a";
const STEEL = "#c3c9ce";
const STEEL_2 = "#9aa2a9";
const LIGHT = "#e9ecee";
const WHITE = "#ffffff";

type Ctx = {
  /** Category hue, so a product sits in its category's colour world. */
  hue: number;
  accent: string;
  accentSoft: string;
  accentDeep: string;
};

function ctxFor(hue: number): Ctx {
  return {
    hue,
    accent: `hsl(${hue} 52% 46%)`,
    accentSoft: `hsl(${hue} 58% 80%)`,
    accentDeep: `hsl(${hue} 48% 30%)`,
  };
}

/** Wraps a drawing in a lit ground with a contact shadow. */
function scene(hue: number, variant: number, body: string): string {
  const bgA = `hsl(${hue} ${variant === 1 ? 42 : 55}% ${variant === 1 ? 84 : 93}%)`;
  const bgB = `hsl(${(hue + 34) % 360} ${variant === 1 ? 38 : 45}% ${variant === 1 ? 72 : 84}%)`;

  // The angled view rotates the product; the detail view scales into it.
  const transform =
    variant === 1
      ? "rotate(-9 400 400) translate(0 6)"
      : variant === 2
        ? "translate(400 400) scale(1.42) translate(-400 -400)"
        : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0%" stop-color="${bgA}"/>
      <stop offset="100%" stop-color="${bgB}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.62">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="shade" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#2b2f33" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="#2b2f33" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="frame"><rect width="800" height="800"/></clipPath>
  </defs>

  <g clip-path="url(#frame)">
    <rect width="800" height="800" fill="url(#bg)"/>
    <rect width="800" height="800" fill="url(#glow)"/>
    <ellipse cx="400" cy="646" rx="205" ry="34" fill="url(#shade)"/>
    <g transform="${transform}">
${body}
    </g>
  </g>
</svg>
`;
}

// ---------------------------------------------------------------------------
// Per-product drawings. Coordinates assume the 800×800 scene above, with the
// product occupying roughly x/y 240–560 and standing on the shadow at y≈640.
// ---------------------------------------------------------------------------

const ART: Record<string, (c: Ctx) => string> = {
  // ---- Electronics --------------------------------------------------------

  "solar-home-kit-30w": (c) => `
      <circle cx="628" cy="196" r="52" fill="${c.accentSoft}" opacity="0.85"/>
      <g stroke="${c.accentSoft}" stroke-width="9" stroke-linecap="round" opacity="0.8">
        <path d="M628 116v-26M628 302v26M708 196h26M522 196h26M690 134l18-18M566 258l-18 18"/>
      </g>
      <g transform="rotate(-13 400 380)">
        <rect x="212" y="266" width="376" height="228" rx="10" fill="${INK_2}"/>
        <rect x="226" y="280" width="348" height="200" rx="6" fill="${c.accentDeep}"/>
        <g fill="${c.accent}" opacity="0.92">
          ${[0, 1, 2, 3].map((col) => [0, 1, 2].map((row) => `<rect x="${238 + col * 84}" y="${292 + row * 64}" width="72" height="52" rx="3"/>`).join("")).join("")}
        </g>
        <g stroke="${INK}" stroke-width="4" opacity="0.55">
          <path d="M400 280v200M226 380h348"/>
        </g>
      </g>
      <path d="M400 490l0 92" stroke="${INK_2}" stroke-width="14" stroke-linecap="round"/>
      <path d="M330 640h140l-24-62h-92z" fill="${INK}"/>
      <rect x="470" y="546" width="118" height="96" rx="12" fill="${INK_2}"/>
      <rect x="484" y="562" width="90" height="30" rx="5" fill="${c.accent}"/>
      <circle cx="502" cy="616" r="9" fill="${STEEL}"/>
      <circle cx="530" cy="616" r="9" fill="${STEEL}"/>
      <circle cx="558" cy="616" r="9" fill="${STEEL}"/>`,

  "smart-tv-55-inch": (c) => `
      <rect x="150" y="216" width="500" height="304" rx="14" fill="${INK}"/>
      <rect x="166" y="232" width="468" height="262" rx="7" fill="${c.accentDeep}"/>
      <path d="M166 494 L634 232 L634 494 Z" fill="${c.accent}" opacity="0.5"/>
      <circle cx="300" cy="362" r="46" fill="${WHITE}" opacity="0.16"/>
      <rect x="166" y="232" width="468" height="86" fill="${WHITE}" opacity="0.07"/>
      <rect x="370" y="520" width="60" height="52" fill="${INK_2}"/>
      <rect x="286" y="566" width="228" height="20" rx="9" fill="${INK}"/>
      <circle cx="400" cy="508" r="4" fill="${c.accentSoft}"/>`,

  "bluetooth-speaker-portable": (c) => `
      <rect x="252" y="298" width="296" height="252" rx="60" fill="${INK}"/>
      <rect x="270" y="316" width="260" height="216" rx="46" fill="${INK_2}"/>
      <g fill="${INK}" opacity="0.85">
        ${Array.from({ length: 6 }, (_, r) => Array.from({ length: 7 }, (_, k) => `<circle cx="${300 + k * 33}" cy="${346 + r * 31}" r="7"/>`).join("")).join("")}
      </g>
      <rect x="252" y="298" width="296" height="16" rx="8" fill="${c.accent}"/>
      <circle cx="316" cy="576" r="15" fill="${INK_2}"/>
      <circle cx="484" cy="576" r="15" fill="${INK_2}"/>
      <rect x="352" y="562" width="96" height="28" rx="14" fill="${INK_2}"/>
      <circle cx="376" cy="576" r="7" fill="${c.accent}"/>
      <circle cx="400" cy="576" r="7" fill="${STEEL_2}"/>
      <circle cx="424" cy="576" r="7" fill="${STEEL_2}"/>`,

  "rechargeable-led-torch": (c) => `
      <path d="M300 250h116l16 42H284z" fill="${STEEL}"/>
      <rect x="284" y="292" width="148" height="34" rx="8" fill="${INK_2}"/>
      <rect x="300" y="326" width="116" height="292" rx="26" fill="${INK}"/>
      <rect x="316" y="352" width="84" height="176" rx="10" fill="${c.accentDeep}" opacity="0.55"/>
      <rect x="330" y="548" width="56" height="18" rx="9" fill="${c.accent}"/>
      <circle cx="358" cy="270" r="30" fill="${c.accentSoft}"/>
      <circle cx="358" cy="270" r="16" fill="${WHITE}" opacity="0.9"/>
      <path d="M358 232 L214 96 L502 96 Z" fill="${c.accentSoft}" opacity="0.4"/>
      <rect x="452" y="404" width="102" height="214" rx="22" fill="${INK_2}"/>
      <rect x="466" y="428" width="74" height="120" rx="8" fill="${c.accentSoft}" opacity="0.75"/>`,

  // ---- Phones & accessories ----------------------------------------------

  "smartphone-128gb": (c) => `
      <rect x="288" y="182" width="224" height="440" rx="34" fill="${INK}"/>
      <rect x="300" y="194" width="200" height="416" rx="26" fill="${c.accentDeep}"/>
      <path d="M300 610 L500 194 L500 610 Z" fill="${c.accent}" opacity="0.42"/>
      <rect x="360" y="200" width="80" height="16" rx="8" fill="${INK}"/>
      <rect x="322" y="216" width="156" height="10" rx="5" fill="${WHITE}" opacity="0.28"/>
      <g fill="${WHITE}" opacity="0.2">
        <rect x="322" y="252" width="156" height="74" rx="8"/>
        <rect x="322" y="342" width="72" height="72" rx="8"/>
        <rect x="406" y="342" width="72" height="72" rx="8"/>
      </g>
      <rect x="316" y="196" width="86" height="82" rx="18" fill="${INK}" opacity="0.001"/>
      <rect x="512" y="252" width="6" height="52" rx="3" fill="${INK_2}"/>
      <rect x="512" y="322" width="6" height="34" rx="3" fill="${INK_2}"/>
      <g transform="translate(548 214)">
        <rect x="0" y="0" width="92" height="112" rx="20" fill="${INK_2}"/>
        <circle cx="30" cy="32" r="17" fill="${INK}"/><circle cx="30" cy="32" r="8" fill="${c.accent}"/>
        <circle cx="30" cy="80" r="17" fill="${INK}"/><circle cx="30" cy="80" r="8" fill="${c.accent}"/>
        <circle cx="66" cy="56" r="10" fill="${INK}"/>
      </g>`,

  "power-bank-20000mah": (c) => `
      <rect x="278" y="228" width="244" height="386" rx="30" fill="${INK}"/>
      <rect x="294" y="244" width="212" height="354" rx="22" fill="${INK_2}"/>
      <rect x="326" y="286" width="148" height="88" rx="10" fill="${INK}"/>
      <text x="400" y="346" text-anchor="middle" font-family="'Segoe UI',Arial,sans-serif" font-size="44" font-weight="700" fill="${c.accent}">78%</text>
      <g fill="${c.accent}">
        <rect x="326" y="404" width="30" height="14" rx="7"/>
        <rect x="366" y="404" width="30" height="14" rx="7"/>
        <rect x="406" y="404" width="30" height="14" rx="7"/>
      </g>
      <rect x="446" y="404" width="30" height="14" rx="7" fill="${STEEL_2}"/>
      <rect x="330" y="460" width="60" height="26" rx="5" fill="${INK}"/>
      <rect x="338" y="468" width="44" height="10" rx="3" fill="${STEEL}"/>
      <rect x="412" y="460" width="60" height="26" rx="5" fill="${INK}"/>
      <rect x="420" y="468" width="44" height="10" rx="3" fill="${STEEL}"/>
      <rect x="352" y="530" width="96" height="10" rx="5" fill="${INK}" opacity="0.6"/>`,

  "fast-charger-33w": (c) => `
      <rect x="292" y="252" width="216" height="216" rx="34" fill="${WHITE}"/>
      <rect x="292" y="252" width="216" height="216" rx="34" fill="${INK}" opacity="0.06"/>
      <rect x="316" y="276" width="168" height="168" rx="22" fill="${LIGHT}"/>
      <text x="400" y="378" text-anchor="middle" font-family="'Segoe UI',Arial,sans-serif" font-size="52" font-weight="700" fill="${c.accentDeep}">33W</text>
      <g fill="${STEEL_2}">
        <rect x="336" y="204" width="22" height="52" rx="5"/>
        <rect x="442" y="204" width="22" height="52" rx="5"/>
        <rect x="389" y="196" width="22" height="60" rx="5"/>
      </g>
      <rect x="374" y="468" width="52" height="22" rx="6" fill="${INK_2}"/>
      <path d="M400 490c0 60-118 42-118 100s150 44 150-2"
            fill="none" stroke="${INK}" stroke-width="20" stroke-linecap="round"/>
      <rect x="418" y="574" width="34" height="22" rx="5" fill="${c.accent}"/>`,

  // A single bud, drawn stem-down so it reads as hardware rather than a face.
  "wireless-earbuds": (c) => {
    const bud = (tilt: number) => `
        <g transform="rotate(${tilt})">
          <rect x="-27" y="-34" width="54" height="70" rx="26" fill="${WHITE}"/>
          <rect x="-27" y="-34" width="54" height="70" rx="26" fill="${INK}" opacity="0.05"/>
          <ellipse cx="0" cy="-10" rx="17" ry="15" fill="${STEEL}"/>
          <ellipse cx="0" cy="-10" rx="7" ry="6" fill="${INK_3}"/>
          <path d="M-12 30 h24 l-4 78 a8 8 0 0 1 -16 0 z" fill="${WHITE}"/>
          <path d="M-12 30 h24 l-4 78 a8 8 0 0 1 -16 0 z" fill="${INK}" opacity="0.05"/>
          <rect x="-7" y="92" width="14" height="5" rx="2" fill="${c.accent}"/>
        </g>`;

    return `
      <g transform="translate(316 300)">${bud(-16)}</g>
      <g transform="translate(484 300)">${bud(16)}</g>
      <path d="M276 470h248a26 26 0 0 1 26 26v70a52 52 0 0 1-52 52H302a52 52 0 0 1-52-52v-70a26 26 0 0 1 26-26z" fill="${WHITE}"/>
      <path d="M276 470h248a26 26 0 0 1 26 26v70a52 52 0 0 1-52 52H302a52 52 0 0 1-52-52v-70a26 26 0 0 1 26-26z" fill="${INK}" opacity="0.05"/>
      <path d="M250 506h300" stroke="${INK}" stroke-opacity="0.14" stroke-width="5"/>
      <rect x="330" y="470" width="60" height="20" rx="10" fill="${INK}" opacity="0.13"/>
      <rect x="410" y="470" width="60" height="20" rx="10" fill="${INK}" opacity="0.13"/>
      <circle cx="400" cy="566" r="10" fill="${c.accent}"/>`;
  },

  // ---- Fashion ------------------------------------------------------------

  "kitenge-two-piece-set": (c) => `
      <defs>
        <pattern id="kit" width="56" height="56" patternUnits="userSpaceOnUse">
          <rect width="56" height="56" fill="${c.accent}"/>
          <circle cx="14" cy="14" r="9" fill="${c.accentSoft}"/>
          <circle cx="42" cy="42" r="9" fill="${c.accentSoft}"/>
          <path d="M0 42 q14-14 28 0 t28 0" fill="none" stroke="${c.accentDeep}" stroke-width="4"/>
          <path d="M0 14 q14-14 28 0 t28 0" fill="none" stroke="${c.accentDeep}" stroke-width="4"/>
        </pattern>
      </defs>
      <path d="M318 208 L400 236 L482 208 L540 250 L508 314 L486 300 L486 424 L314 424 L314 300 L292 314 L260 250 Z"
            fill="url(#kit)"/>
      <path d="M318 208 L400 236 L482 208 L466 218 L400 252 L334 218 Z" fill="${INK}" opacity="0.22"/>
      <path d="M310 448 L490 448 L536 636 L264 636 Z" fill="url(#kit)"/>
      <path d="M310 448 L490 448 L487 474 L313 474 Z" fill="${INK}" opacity="0.2"/>
      <g stroke="${c.accentDeep}" stroke-width="3" opacity="0.55">
        <path d="M340 480 L318 630M400 480 L400 632M460 480 L482 630"/>
      </g>`,

  "leather-sandals-mens": (c) => `
      <g transform="translate(0 -14)">
        <path d="M232 336 q56-32 116-6 q34 16 34 74 v152 q0 60-56 60 h-40 q-58 0-58-62 v-152 q0-46 4-66z" fill="${c.accentDeep}"/>
        <path d="M236 352 q52-28 108-4 q28 14 28 66 v146 q0 46-46 46 h-38 q-48 0-48-48 v-146 q0-42 -4-60z" fill="${c.accent}"/>
        <path d="M244 384 q60 26 122 4" fill="none" stroke="${c.accentDeep}" stroke-width="22" stroke-linecap="round"/>
        <path d="M240 452 q62 24 128 2" fill="none" stroke="${c.accentDeep}" stroke-width="22" stroke-linecap="round"/>
        <path d="M228 546 h150" stroke="${INK}" stroke-opacity="0.25" stroke-width="8"/>
      </g>
      <g transform="translate(196 -14)">
        <path d="M232 336 q56-32 116-6 q34 16 34 74 v152 q0 60-56 60 h-40 q-58 0-58-62 v-152 q0-46 4-66z" fill="${c.accentDeep}"/>
        <path d="M236 352 q52-28 108-4 q28 14 28 66 v146 q0 46-46 46 h-38 q-48 0-48-48 v-146 q0-42 -4-60z" fill="${c.accent}"/>
        <path d="M244 384 q60 26 122 4" fill="none" stroke="${c.accentDeep}" stroke-width="22" stroke-linecap="round"/>
        <path d="M240 452 q62 24 128 2" fill="none" stroke="${c.accentDeep}" stroke-width="22" stroke-linecap="round"/>
        <path d="M228 546 h150" stroke="${INK}" stroke-opacity="0.25" stroke-width="8"/>
      </g>`,

  // The only drawing that ignores the category hue: a Maasai shuka is red and
  // black, and recolouring it to match the Fashion palette would be wrong.
  "maasai-shuka-blanket": () => `
      <defs>
        <pattern id="shuka" width="64" height="64" patternUnits="userSpaceOnUse">
          <rect width="64" height="64" fill="#b3241f"/>
          <rect x="0" y="0" width="64" height="10" fill="#1d1d1d"/>
          <rect x="0" y="0" width="10" height="64" fill="#1d1d1d"/>
          <rect x="32" y="0" width="4" height="64" fill="#1d1d1d" opacity="0.6"/>
          <rect x="0" y="32" width="64" height="4" fill="#1d1d1d" opacity="0.6"/>
        </pattern>
      </defs>
      <g>
        <path d="M212 468 h376 v58 q-188 34 -376 0z" fill="url(#shuka)"/>
        <path d="M212 468 h376 v14 H212z" fill="${INK}" opacity="0.28"/>
        <path d="M222 384 h356 v58 q-178 32 -356 0z" fill="url(#shuka)"/>
        <path d="M222 384 h356 v14 H222z" fill="${INK}" opacity="0.28"/>
        <path d="M236 300 h328 v58 q-164 30 -328 0z" fill="url(#shuka)"/>
        <path d="M236 300 h328 v14 H236z" fill="${INK}" opacity="0.28"/>
        <path d="M212 526 q188 34 376 0 v56 q-188 34 -376 0z" fill="url(#shuka)"/>
        <path d="M212 582 q188 34 376 0 v22 q-188 34 -376 0z" fill="${INK}" opacity="0.18"/>
      </g>`,

  "cotton-kanga-pair": (c) => `
      <g transform="rotate(-4 400 430)">
        <rect x="206" y="322" width="330" height="230" rx="6" fill="${c.accentSoft}"/>
        <rect x="206" y="322" width="330" height="230" rx="6" fill="none" stroke="${c.accentDeep}" stroke-width="16"/>
        <rect x="242" y="358" width="258" height="158" fill="none" stroke="${c.accent}" stroke-width="8"/>
        <circle cx="371" cy="422" r="34" fill="${c.accent}"/>
        <circle cx="371" cy="422" r="16" fill="${c.accentSoft}"/>
        <text x="371" y="500" text-anchor="middle" font-family="'Segoe UI',Arial,sans-serif" font-size="21" font-weight="600" fill="${c.accentDeep}">HERI NA BARAKA</text>
      </g>
      <g transform="rotate(6 400 430) translate(72 44)">
        <rect x="206" y="322" width="330" height="230" rx="6" fill="${WHITE}"/>
        <rect x="206" y="322" width="330" height="230" rx="6" fill="none" stroke="${c.accent}" stroke-width="16"/>
        <rect x="242" y="358" width="258" height="158" fill="none" stroke="${c.accentDeep}" stroke-width="8"/>
        <circle cx="371" cy="422" r="34" fill="${c.accentDeep}"/>
        <circle cx="371" cy="422" r="16" fill="${WHITE}"/>
        <text x="371" y="500" text-anchor="middle" font-family="'Segoe UI',Arial,sans-serif" font-size="21" font-weight="600" fill="${c.accentDeep}">UPENDO NI KILA KITU</text>
      </g>`,

  // ---- Home & kitchen -----------------------------------------------------

  "nonstick-cookware-set-7pc": (c) => `
      <ellipse cx="400" cy="300" rx="150" ry="30" fill="${STEEL}"/>
      <path d="M250 300 h300 l-16 78 q-134 26 -268 0z" fill="${STEEL_2}"/>
      <circle cx="400" cy="292" r="20" fill="${INK_2}"/>
      <path d="M232 400 h336 v128 q0 40-46 46 q-122 14 -244 0 q-46-6 -46-46z" fill="${INK}"/>
      <path d="M244 400 h312 v22 q-156 24 -312 0z" fill="${INK_2}"/>
      <rect x="140" y="424" width="104" height="26" rx="13" fill="${INK_2}"/>
      <rect x="556" y="424" width="104" height="26" rx="13" fill="${INK_2}"/>
      <path d="M268 566 h264 v56 q0 26-32 30 q-100 10 -200 0 q-32-4 -32-30z" fill="${c.accentDeep}"/>
      <path d="M276 566 h248 v16 q-124 18 -248 0z" fill="${c.accent}"/>
      <g stroke="${WHITE}" stroke-opacity="0.35" stroke-width="6" stroke-linecap="round">
        <path d="M300 440 v58M330 446 v46"/>
      </g>`,

  "improved-charcoal-jiko": (c) => `
      <path d="M258 352 h284 l-34 176 q-6 30 -40 30 h-136 q-34 0-40-30z" fill="${INK_2}"/>
      <ellipse cx="400" cy="352" rx="142" ry="34" fill="${STEEL_2}"/>
      <ellipse cx="400" cy="352" rx="112" ry="26" fill="${c.accentDeep}"/>
      <g fill="${c.accent}">
        <ellipse cx="366" cy="350" rx="26" ry="11"/>
        <ellipse cx="428" cy="356" rx="22" ry="9"/>
        <ellipse cx="400" cy="342" rx="18" ry="8"/>
      </g>
      <path d="M280 462 h240 l-8 40 H288z" fill="${INK}" opacity="0.35"/>
      <g fill="${INK}">
        <rect x="322" y="474" width="46" height="20" rx="6"/>
        <rect x="386" y="474" width="46" height="20" rx="6"/>
        <rect x="450" y="474" width="30" height="20" rx="6"/>
      </g>
      <path d="M244 558 h312 v40 q0 22-26 22 h-260 q-26 0-26-22z" fill="${INK}"/>
      <rect x="196" y="392" width="70" height="22" rx="11" fill="${INK}"/>
      <rect x="534" y="392" width="70" height="22" rx="11" fill="${INK}"/>`,

  "water-filter-20l": (c) => `
      <ellipse cx="400" cy="232" rx="118" ry="26" fill="${STEEL}"/>
      <path d="M282 232 h236 v34 q-118 22 -236 0z" fill="${STEEL_2}"/>
      <path d="M292 266 h216 v130 q-108 20 -216 0z" fill="${LIGHT}" opacity="0.94"/>
      <path d="M292 266 h216 v130 q-108 20 -216 0z" fill="${c.accentSoft}" opacity="0.45"/>
      <rect x="284" y="396" width="232" height="20" rx="6" fill="${INK_2}"/>
      <path d="M292 416 h216 v168 q0 30-34 34 q-74 8 -148 0 q-34-4 -34-34z" fill="${WHITE}" opacity="0.9"/>
      <path d="M300 470 h200 v110 q0 22-28 26 q-72 8 -144 0 q-28-4 -28-26z" fill="${c.accent}" opacity="0.55"/>
      <rect x="356" y="288" width="30" height="96" rx="15" fill="${WHITE}"/>
      <rect x="414" y="288" width="30" height="96" rx="15" fill="${WHITE}"/>
      <g fill="${INK_2}">
        <rect x="474" y="512" width="62" height="20" rx="7"/>
        <rect x="514" y="512" width="22" height="54" rx="7"/>
      </g>
      <path d="M252 618 h296 v22 H252z" fill="${INK_2}"/>`,

  "thermos-flask-1900ml": (c) => `
      <rect x="326" y="196" width="148" height="52" rx="16" fill="${c.accentDeep}"/>
      <rect x="338" y="248" width="124" height="34" rx="10" fill="${STEEL_2}"/>
      <path d="M310 282 h180 v300 q0 46-42 52 q-48 6 -96 0 q-42-6 -42-52z" fill="${STEEL}"/>
      <path d="M330 282 h44 v340 q-24-2 -44-8z" fill="${WHITE}" opacity="0.55"/>
      <path d="M310 356 h180 v96 H310z" fill="${c.accent}"/>
      <text x="400" y="418" text-anchor="middle" font-family="'Segoe UI',Arial,sans-serif" font-size="34" font-weight="700" fill="${WHITE}">1.9L</text>
      <path d="M490 322 q86 6 86 78 t-86 78" fill="none" stroke="${INK_2}" stroke-width="26" stroke-linecap="round"/>`,

  // ---- Beauty & health ----------------------------------------------------

  "shea-butter-cream-500ml": (c) => `
      <ellipse cx="400" cy="286" rx="136" ry="30" fill="${c.accentSoft}"/>
      <path d="M264 286 h272 v70 q-136 26 -272 0z" fill="${c.accent}"/>
      <path d="M272 356 h256 v206 q0 40-40 46 q-88 10 -176 0 q-40-6 -40-46z" fill="${WHITE}"/>
      <path d="M272 356 h256 v206 q0 40-40 46 q-88 10 -176 0 q-40-6 -40-46z" fill="${c.accentSoft}" opacity="0.35"/>
      <path d="M292 372 h40 v212 q-22-4 -40-10z" fill="${WHITE}" opacity="0.7"/>
      <rect x="300" y="424" width="200" height="106" rx="8" fill="${c.accentDeep}" opacity="0.9"/>
      <text x="400" y="470" text-anchor="middle" font-family="'Segoe UI',Arial,sans-serif" font-size="30" font-weight="700" fill="${WHITE}">SHEA</text>
      <text x="400" y="506" text-anchor="middle" font-family="'Segoe UI',Arial,sans-serif" font-size="22" fill="${WHITE}" opacity="0.85">500 ml</text>
      <ellipse cx="400" cy="286" rx="96" ry="20" fill="${c.accentDeep}" opacity="0.25"/>`,

  "coconut-hair-oil-250ml": (c) => `
      <rect x="368" y="176" width="64" height="52" rx="10" fill="${INK_2}"/>
      <rect x="356" y="228" width="88" height="34" rx="8" fill="${c.accentDeep}"/>
      <path d="M368 262 h64 v46 h-64z" fill="${c.accentSoft}" opacity="0.7"/>
      <path d="M310 308 q90-34 180 0 v246 q0 46-44 52 q-46 6 -92 0 q-44-6 -44-52z" fill="${c.accentSoft}" opacity="0.85"/>
      <path d="M330 330 q30-12 42-14 v230 q-24-4 -42-10z" fill="${WHITE}" opacity="0.55"/>
      <path d="M318 396 h164 v152 q0 34-34 40 q-48 6 -96 0 q-34-6 -34-40z" fill="${c.accent}" opacity="0.55"/>
      <rect x="326" y="404" width="148" height="120" rx="8" fill="${WHITE}" opacity="0.92"/>
      <circle cx="400" cy="442" r="20" fill="${c.accentDeep}"/>
      <path d="M386 442 q14-18 28 0 q-14 18 -28 0z" fill="${WHITE}"/>
      <text x="400" y="492" text-anchor="middle" font-family="'Segoe UI',Arial,sans-serif" font-size="20" font-weight="600" fill="${c.accentDeep}">COCONUT</text>
      <text x="400" y="514" text-anchor="middle" font-family="'Segoe UI',Arial,sans-serif" font-size="16" fill="${INK_3}">250 ml</text>`,

  "blood-pressure-monitor": (c) => `
      <rect x="252" y="286" width="296" height="212" rx="26" fill="${WHITE}"/>
      <rect x="252" y="286" width="296" height="212" rx="26" fill="${INK}" opacity="0.05"/>
      <rect x="282" y="316" width="236" height="122" rx="10" fill="${c.accentDeep}"/>
      <text x="310" y="380" font-family="'Segoe UI',Arial,sans-serif" font-size="52" font-weight="700" fill="${WHITE}">128</text>
      <text x="310" y="422" font-family="'Segoe UI',Arial,sans-serif" font-size="34" font-weight="600" fill="${c.accentSoft}">82</text>
      <path d="M420 396 l16-26 12 44 14-58 12 40 h24" fill="none" stroke="${c.accentSoft}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="470" cy="336" r="9" fill="${c.accentSoft}"/>
      <circle cx="330" cy="468" r="19" fill="${c.accent}"/>
      <rect x="368" y="458" width="52" height="20" rx="10" fill="${LIGHT}"/>
      <rect x="436" y="458" width="52" height="20" rx="10" fill="${LIGHT}"/>
      <path d="M400 498 q0 34 -66 46" fill="none" stroke="${INK_3}" stroke-width="12" stroke-linecap="round"/>
      <path d="M206 540 q84-32 168 0 v54 q-84 30 -168 0z" fill="${c.accent}"/>
      <path d="M206 540 q84-32 168 0 v14 q-84 30 -168 0z" fill="${WHITE}" opacity="0.3"/>
      <rect x="196" y="552" width="20" height="34" rx="6" fill="${INK_2}"/>`,

  // ---- Groceries ----------------------------------------------------------

  "rice-kilombero-25kg": (c) => `
      <path d="M296 268 q104-38 208 0 l-14 34 q-90-28 -180 0z" fill="${c.accentDeep}"/>
      <path d="M282 302 q118-34 236 0 v246 q0 62-52 70 q-66 8 -132 0 q-52-8 -52-70z" fill="${c.accentSoft}"/>
      <path d="M304 322 q40-10 56-12 v290 q-34-4 -56-10z" fill="${WHITE}" opacity="0.42"/>
      <rect x="308" y="376" width="184" height="152" rx="10" fill="${WHITE}" opacity="0.9"/>
      <text x="400" y="424" text-anchor="middle" font-family="'Segoe UI',Arial,sans-serif" font-size="30" font-weight="700" fill="${c.accentDeep}">KILOMBERO</text>
      <g fill="${c.accent}">
        <ellipse cx="366" cy="458" rx="9" ry="17" transform="rotate(-22 366 458)"/>
        <ellipse cx="400" cy="452" rx="9" ry="17"/>
        <ellipse cx="434" cy="458" rx="9" ry="17" transform="rotate(22 434 458)"/>
      </g>
      <text x="400" y="510" text-anchor="middle" font-family="'Segoe UI',Arial,sans-serif" font-size="26" font-weight="700" fill="${INK_2}">25 kg</text>
      <path d="M296 268 q104-38 208 0" fill="none" stroke="${INK}" stroke-opacity="0.2" stroke-width="6"/>`,

  "sunflower-oil-5l": (c) => `
      <rect x="366" y="176" width="68" height="46" rx="8" fill="${c.accentDeep}"/>
      <path d="M300 222 h200 v56 H300z" fill="${c.accent}" opacity="0.4"/>
      <path d="M286 278 h228 v292 q0 44-40 50 q-74 8 -148 0 q-40-6 -40-50z" fill="${c.accentSoft}" opacity="0.9"/>
      <path d="M296 330 h208 v230 q0 34-34 40 q-70 8 -140 0 q-34-6 -34-40z" fill="${c.accent}" opacity="0.75"/>
      <path d="M306 296 h34 v290 q-20-4 -34-10z" fill="${WHITE}" opacity="0.5"/>
      <rect x="306" y="368" width="188" height="146" rx="10" fill="${WHITE}" opacity="0.94"/>
      <circle cx="400" cy="416" r="26" fill="${c.accentDeep}"/>
      <g fill="${c.accent}">
        ${Array.from({ length: 10 }, (_, i) => {
          const a = (i * 36 * Math.PI) / 180;
          return `<ellipse cx="${(400 + Math.cos(a) * 38).toFixed(1)}" cy="${(416 + Math.sin(a) * 38).toFixed(1)}" rx="13" ry="7" transform="rotate(${i * 36} ${(400 + Math.cos(a) * 38).toFixed(1)} ${(416 + Math.sin(a) * 38).toFixed(1)})"/>`;
        }).join("")}
      </g>
      <text x="400" y="492" text-anchor="middle" font-family="'Segoe UI',Arial,sans-serif" font-size="28" font-weight="700" fill="${INK_2}">5 LITA</text>
      <path d="M514 316 q56 10 56 60 t-56 60" fill="none" stroke="${c.accentSoft}" stroke-width="26" stroke-linecap="round" opacity="0.9"/>`,

  "wheat-flour-10kg": (c) => `
      <path d="M292 262 h216 l-10 30 H302z" fill="${c.accentDeep}" opacity="0.5"/>
      <path d="M286 292 h228 v268 q0 46-42 52 q-72 8 -144 0 q-42-6 -42-52z" fill="${WHITE}"/>
      <path d="M286 292 h228 v268 q0 46-42 52 q-72 8 -144 0 q-42-6 -42-52z" fill="${c.accentSoft}" opacity="0.3"/>
      <path d="M306 292 h40 v308 q-24-4 -40-10z" fill="${WHITE}" opacity="0.75"/>
      <path d="M286 340 h228 v40 H286z" fill="${c.accent}"/>
      <text x="400" y="440" text-anchor="middle" font-family="'Segoe UI',Arial,sans-serif" font-size="34" font-weight="700" fill="${c.accentDeep}">UNGA</text>
      <text x="400" y="474" text-anchor="middle" font-family="'Segoe UI',Arial,sans-serif" font-size="22" fill="${INK_3}">wa ngano</text>
      <g stroke="${c.accentDeep}" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.85">
        <path d="M400 500 v56"/>
        <path d="M400 512 q-18-10 -22-26 q20 2 22 20"/>
        <path d="M400 512 q18-10 22-26 q-20 2 -22 20"/>
        <path d="M400 538 q-18-10 -22-26 q20 2 22 20"/>
        <path d="M400 538 q18-10 22-26 q-20 2 -22 20"/>
      </g>
      <text x="400" y="590" text-anchor="middle" font-family="'Segoe UI',Arial,sans-serif" font-size="24" font-weight="700" fill="${INK_2}">10 kg</text>`,
};

/** Category hue per product, matching the category tiles. */
const HUE: Record<string, number> = {
  "solar-home-kit-30w": 215,
  "smart-tv-55-inch": 215,
  "bluetooth-speaker-portable": 215,
  "rechargeable-led-torch": 215,
  "smartphone-128gb": 265,
  "power-bank-20000mah": 265,
  "fast-charger-33w": 265,
  "wireless-earbuds": 265,
  "kitenge-two-piece-set": 340,
  "leather-sandals-mens": 340,
  "maasai-shuka-blanket": 340,
  "cotton-kanga-pair": 340,
  "nonstick-cookware-set-7pc": 25,
  "improved-charcoal-jiko": 25,
  "water-filter-20l": 25,
  "thermos-flask-1900ml": 25,
  "shea-butter-cream-500ml": 160,
  "coconut-hair-oil-250ml": 160,
  "blood-pressure-monitor": 160,
  "rice-kilombero-25kg": 95,
  "sunflower-oil-5l": 95,
  "wheat-flour-10kg": 95,
};

export const VIEWS = ["studio", "angled", "detail"] as const;

export function hasArt(slug: string): boolean {
  return slug in ART;
}

/** Renders one of the three views for a product, or null if undrawn. */
export function renderProductArt(slug: string, variant: number): string | null {
  const draw = ART[slug];
  if (!draw) return null;

  const hue = HUE[slug] ?? 215;
  return scene(hue, variant, draw(ctxFor(hue)));
}

export const ART_SLUGS = Object.keys(ART);
