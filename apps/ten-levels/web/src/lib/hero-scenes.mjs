/**
 * The ten level hero scenes: one shared frame (defs, palette, primitives), one draw
 * function per level, and the animation anchors the run modal uses on top of them.
 * Browser-safe: no node imports. scripts/build-heroes.mjs writes the static SVGs from this.
 */
export const W = 1600, H = 900;

/**
 * Static heroes show an example pick lit. The run modal draws the same hero with LIT off so
 * nothing is highlighted until Jev answers.
 */
let LIT = true;

export const C = {
  line: "#b9a9c9",
  box: "rgba(128,255,228,0.32)",
  boxFill: "rgba(255,255,255,0.05)",
  accent: "#80ffe4",
  accentFill: "rgba(128,255,228,0.16)",
  magenta: "#f935f8",
  magentaFill: "rgba(249,53,248,0.16)",
  ok: "#5ef07a", okFill: "rgba(94,240,122,0.18)",
  bad: "#fc5f4a", badFill: "rgba(252,95,74,0.18)",
  warn: "#f2e85a", warnFill: "rgba(242,232,90,0.18)",
  dim: "rgba(185,169,201,0.35)",
};
const SW = 5;

export const defs = `
  <defs>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="glow-m" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="10" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <!-- Lines: a straight line has a zero-height bounding box, which clips a bbox-relative filter
         to nothing. This one is measured in canvas units so horizontal and vertical lines keep their glow. -->
    <filter id="glow-line" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
      <feGaussianBlur stdDeviation="8" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="bar" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="${C.magenta}"/><stop offset="1" stop-color="${C.accent}"/>
    </linearGradient>
    <marker id="arrow" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M0 0 L12 6 L0 12 z" fill="${C.line}"/>
    </marker>
    <marker id="arrow-a" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M0 0 L12 6 L0 12 z" fill="${C.accent}"/>
    </marker>
    <marker id="arrow-m" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M0 0 L12 6 L0 12 z" fill="${C.magenta}"/>
    </marker>
  </defs>`;

/* ---- primitives ---- */
const box = (x, y, w, h, o = {}) => {
  const stroke = o.stroke ?? C.box, fill = o.fill ?? C.boxFill, sw = o.sw ?? SW, rx = o.rx ?? 18;
  const f = o.glow ? ` filter="url(#${o.glow})"` : "";
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${f}/>`;
};
const line = (d, o = {}) => {
  const stroke = o.stroke ?? C.line, sw = o.sw ?? SW;
  const m = o.arrow ? ` marker-end="url(#${o.arrow})"` : "";
  const dash = o.dash ? ` stroke-dasharray="${o.dash}"` : "";
  const f = o.glow ? ` filter="url(#glow-line)"` : "";
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"${m}${dash}${f}/>`;
};
const pill = (x, y, w, h = 28, fill = C.dim) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}"/>`;
const hexagon = (cx, cy, r, o = {}) => {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = Math.PI / 3 * i;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
  const f = o.glow ? ` filter="url(#${o.glow})"` : "";
  return `<polygon points="${pts}" fill="${o.fill ?? C.accentFill}" stroke="${o.stroke ?? C.accent}" stroke-width="${o.sw ?? SW}" stroke-linejoin="round"${f}/>`;
};
const textLines = (x, y, widths, gap = 44) => widths.map((w, i) => pill(x, y + i * gap, w)).join("");

/* ---- levels ---- */
export const levels = {
  1: () => `
    ${box(130, 270, 340, 340)}
    <rect x="180" y="330" width="90" height="70" rx="12" fill="${C.dim}"/>
    ${textLines(180, 436, [230, 250, 200], 48)}
    ${line("M470 440 H660", { arrow: "arrow" })}
    <g transform="translate(800 440) rotate(45)">${box(-110, -110, 220, 220, { stroke: C.accent, fill: C.accentFill, rx: 20, glow: "glow" })}</g>
    ${line("M960 440 H1020 V290 H1120", { arrow: "arrow" })}
    ${line("M1020 440 V610 H1120", { arrow: "arrow" })}
    ${box(1130, 220, 340, 150, LIT ? { stroke: C.ok, fill: C.okFill, glow: "glow" } : {})}
    ${box(1130, 540, 340, 150)}
  `,

  2: () => {
    const row = (y, n, litIdx) => Array.from({ length: n }, (_, i) =>
      box(800 + i * 200, y, 180, 110, LIT && i === litIdx ? { stroke: C.accent, fill: C.accentFill, glow: "glow" } : {})).join("");
    return `
      ${box(130, 330, 340, 240)}
      <rect x="180" y="380" width="90" height="60" rx="12" fill="${C.dim}"/>
      ${textLines(180, 470, [230, 200], 44)}
      ${line("M470 450 H705", {})}
      <circle cx="720" cy="450" r="16" fill="${C.accent}" filter="url(#glow)"/>
      ${line("M720 450 V255 H790", { arrow: "arrow" })}
      ${line("M720 450 V645 H790", { arrow: "arrow" })}
      ${row(200, 4, 0)}
      ${row(590, 3, 1)}
    `;
  },

  3: () => {
    const rows = [[220, 0.82], [400, 0.5], [580, 0.24]];
    const R = 200, cx = 1290, cy = 450, pct = 0.72;
    const a = -Math.PI / 2 + Math.PI * 2 * pct;
    const ex = cx + R * Math.cos(a), ey = cy + R * Math.sin(a);
    return `
      ${rows.map(([y, p]) => `
        ${box(140, y, 520, 110)}
        <rect x="170" y="${y + 30}" width="460" height="50" rx="12" fill="rgba(255,255,255,0.08)"/>
        <rect x="170" y="${y + 30}" width="${460 * p}" height="50" rx="12" fill="url(#bar)"/>
        ${line(`M660 ${y + 55} H700`, {})}
        ${box(700, y + 15, 80, 80, { rx: 14 })}
        ${line(`M780 ${y + 55} H950 V450`, {})}
      `).join("")}
      ${line("M950 450 H1050", { arrow: "arrow" })}
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="42"/>
      <path d="M${cx} ${cy - R} A${R} ${R} 0 ${pct > 0.5 ? 1 : 0} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="${C.accent}" stroke-width="42" stroke-linecap="round" filter="url(#glow)"/>
    `;
  },

  4: () => `
    <rect x="100" y="400" width="480" height="110" rx="16" fill="${C.badFill}"/>
    <rect x="580" y="400" width="500" height="110" fill="${C.warnFill}"/>
    <rect x="1080" y="400" width="420" height="110" rx="16" fill="${C.okFill}"/>
    ${box(100, 400, 1400, 110, { fill: "none", rx: 16 })}
    ${line("M580 380 V530", { stroke: C.line, dash: "10 12", sw: 4 })}
    ${line("M1080 380 V530", { stroke: C.line, dash: "10 12", sw: 4 })}
    ${line("M830 400 V510", { stroke: C.accent, sw: 8, glow: "glow" })}
    <circle cx="830" cy="380" r="26" fill="${C.accent}" filter="url(#glow)"/>
  `,

  5: () => {
    const ys = [170, 380, 590];
    return `
      ${hexagon(280, 450, 130, { glow: "glow", fill: C.accent, stroke: C.accent })}
      ${ys.map((y, i) => {
        const lit = LIT && i === 1;
        const d = i === 1 ? `M410 450 H640` : i === 0 ? `M400 400 H480 V${y + 65} H640` : `M400 500 H480 V${y + 65} H640`;
        return line(d, lit ? { stroke: C.accent, arrow: "arrow-a", glow: "glow" } : { arrow: "arrow" })
          + box(650, y, 800, 130, lit ? { stroke: C.accent, fill: C.accentFill, glow: "glow" } : {});
      }).join("")}
    `;
  },

  6: () => `
    ${box(130, 320, 300, 260)}
    <rect x="180" y="370" width="200" height="34" rx="8" fill="${C.dim}"/>
    ${textLines(180, 430, [170, 200, 140], 40)}
    ${line("M430 450 H620", { arrow: "arrow" })}
    <rect x="640" y="405" width="220" height="90" rx="14" fill="${C.boxFill}" stroke="${C.line}" stroke-width="${SW}"/>
    ${pill(670, 438, 160)}
    ${line("M860 450 H960", { arrow: "arrow" })}
    ${hexagon(1080, 450, 110, { glow: "glow" })}
    ${line("M1190 450 H1260 V300 H1330", { arrow: "arrow" })}
    ${line("M1260 450 V600 H1330", { arrow: "arrow" })}
    ${box(1340, 240, 200, 120, { stroke: C.ok, fill: C.okFill })}
    ${box(1340, 540, 200, 120, { stroke: C.bad, fill: C.badFill })}
  `,

  7: () => `
    ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${180 + i * 110}" cy="450" r="26" fill="${i === 4 ? C.accent : C.dim}"${i === 4 ? ' filter="url(#glow)"' : ""}/>`).join("")}
    ${line("M206 450 H654", { stroke: C.dim, sw: 4 })}
    ${line("M660 450 H760", { arrow: "arrow" })}
    <g transform="translate(870 450) rotate(45)">${box(-90, -90, 180, 180, { stroke: C.accent, fill: C.accentFill, rx: 18, glow: "glow" })}</g>
    ${line("M990 450 H1060 V150 H1130", { arrow: "arrow" })}
    ${line("M1060 450 V350 H1130", { arrow: "arrow" })}
    ${line("M1060 450 V550 H1130", { arrow: "arrow" })}
    ${line("M1060 450 V750 H1130", { arrow: "arrow" })}
    ${box(1140, 100, 330, 100, { stroke: C.dim })}
    ${box(1140, 300, 330, 100)}
    ${box(1140, 500, 330, 100, { stroke: C.warn, fill: C.warnFill })}
    ${box(1140, 700, 330, 100, { stroke: C.bad, fill: C.badFill })}
  `,

  8: () => `
    ${box(130, 300, 300, 300)}
    <rect x="180" y="350" width="200" height="34" rx="8" fill="${C.dim}"/>
    ${textLines(180, 410, [170, 200, 140], 40)}
    ${[0, 1, 2].map((i) => box(520, 300 + i * 110, 220, 80, i === 0 ? { stroke: C.accent, fill: C.accentFill, glow: "glow" } : {})).join("")}
    ${line("M430 450 H510", { arrow: "arrow" })}
    ${line("M740 340 H830 V450 H900", { arrow: "arrow" })}
    <path d="M910 380 H1010 L1050 420 V560 H910 Z" fill="${C.boxFill}" stroke="${C.line}" stroke-width="${SW}" stroke-linejoin="round"/>
    ${textLines(935, 440, [70, 90, 60], 30)}
    ${line("M1060 470 H1150", { arrow: "arrow" })}
    <g transform="translate(1260 470) rotate(45)">${box(-80, -80, 160, 160, { stroke: C.accent, fill: C.accentFill, rx: 16, glow: "glow" })}</g>
    ${line("M1260 580 V700 H640 V400", { arrow: "arrow-a", stroke: C.accent, dash: "14 12" })}
  `,

  9: () => {
    const files = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
      const x = 130 + c * 120, y = 160 + r * 150;
      files.push(`<path d="M${x} ${y} H${x + 60} L${x + 85} ${y + 25} V${y + 100} H${x} Z" fill="${C.boxFill}" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/>`);
    }
    return `
      ${files.join("")}
      ${[0, 1, 2, 3].map((r) => line(`M745 ${210 + r * 150} H880 V450 H960`, { stroke: C.line, sw: 3, arrow: r === 1 ? "arrow" : undefined })).join("")}
      <g transform="translate(1080 450) rotate(45)">${box(-90, -90, 180, 180, { stroke: C.accent, fill: C.accentFill, rx: 18, glow: "glow" })}</g>
      ${line("M1200 450 H1280", { arrow: "arrow-a", stroke: C.accent })}
      ${[0, 1, 2, 3, 4].map((i) => pill(1300, 340 + i * 50, i % 2 ? 160 : 210, 26, i === 0 ? C.accent : C.dim)).join("")}
    `;
  },

  10: () => `
    ${box(130, 250, 340, 400)}
    <rect x="180" y="300" width="240" height="34" rx="8" fill="${C.dim}"/>
    ${textLines(180, 360, [260, 200, 240, 180, 220], 44)}
    ${line("M470 450 H580", { arrow: "arrow" })}
    <path d="M600 330 Q740 260 880 340 Q960 450 880 560 Q740 640 600 560 Q540 450 600 330 Z" fill="${C.magentaFill}" stroke="${C.magenta}" stroke-width="${SW}" filter="url(#glow-m)"/>
    ${textLines(660, 400, [160, 200, 140], 40)}
    ${line("M960 450 H1060", { arrow: "arrow" })}
    <g transform="translate(1180 450) rotate(45)">${box(-90, -90, 180, 180, { stroke: C.accent, fill: C.accentFill, rx: 18, glow: "glow" })}</g>
    ${line("M1180 570 V720 H300 V660", { arrow: "arrow-a", stroke: C.accent, dash: "14 12" })}
    ${pill(1300, 420, 180, 60, C.accent)}
  `,
};

/* ---- animation anchors for the run modal, in hero coordinates ----
 * jev       where the model sits: pulses while the call is in flight
 * request   the path the state travels along to reach jev
 * responses one path per outcome, jev to that outcome
 * outcomes  regions that light up, in the same order as responses
 * pick      which outcome a returned value lights (index into outcomes)
 */
const firstBool = (o) => (o && typeof o === "object" ? Object.values(o).find((v) => typeof v === "boolean") : undefined);
export const ANIM = {
  1: {
    jev: { x: 800, y: 440, r: 150 },
    request: "M470 440 H690",
    responses: ["M910 440 H1020 V295 H1120", "M910 440 H1020 V615 H1120"],
    outcomes: [{ x: 1130, y: 220, w: 340, h: 150 }, { x: 1130, y: 540, w: 340, h: 150 }],
    pick: (o) => (firstBool(o) === undefined ? 0 : firstBool(o) ? 0 : 1),
  },
  2: {
    jev: { x: 720, y: 450, r: 60 },
    request: "M470 450 H705",
    responses: ["M720 450 V255 H790", "M720 450 V645 H790"],
    outcomes: [
      ...[0, 1, 2, 3].map((i) => ({ x: 800 + i * 200, y: 200, w: 180, h: 110 })),
      ...[0, 1, 2].map((i) => ({ x: 800 + i * 200, y: 590, w: 180, h: 110 })),
    ],
    /** One row of option boxes per question. Each answer lights the box of the option it picked. */
    rows: [[0, 1, 2, 3], [4, 5, 6]],
    pick: () => undefined,
  },
  3: {
    jev: { x: 1290, y: 450, r: 230 },
    request: "M780 450 H1050",
    responses: [],
    outcomes: [{ x: 1070, y: 230, w: 440, h: 440, round: true }],
    pick: () => 0,
  },
  4: {
    jev: { x: 830, y: 380, r: 60 },
    request: "M830 200 V340",
    responses: [],
    outcomes: [{ x: 100, y: 400, w: 480, h: 110 }, { x: 580, y: 400, w: 500, h: 110 }, { x: 1080, y: 400, w: 420, h: 110 }],
    pick: (o, a) => { const c = a?.confidence ?? Math.abs((a?.noul ?? 0.5) - 0.5) * 2; return c < 0.5 ? 0 : c < 0.9 ? 1 : 2; },
    gauge: (a) => 100 + (a?.confidence ?? Math.abs((a?.noul ?? 0.5) - 0.5) * 2) * 1400,
    // The hero's static needle is replaced by the animated one in the modal.
    strip: ['d="M830 400 V510"', 'cx="830" cy="380"'],
  },
  5: {
    jev: { x: 280, y: 450, r: 150 },
    request: "M120 450 H250",
    responses: ["M400 400 H480 V235 H640", "M410 450 H640", "M400 500 H480 V655 H640"],
    outcomes: [170, 380, 590].map((y) => ({ x: 650, y, w: 800, h: 130 })),
    pick: (o) => {
      const v = o?.handler ?? o?.model ?? o?.profile ?? "";
      if (["lookup", "fast", "deterministic_script", "fast_agent"].includes(v)) return 0;
      if (["human"].includes(v)) return 2;
      return 1;
    },
  },

};

/** The inner markup of a level's hero: defs plus the drawing. Wrap in an <svg viewBox="0 0 1600 900">. */
export const heroInner = (n, { lit = true } = {}) => {
  LIT = lit;
  try {
    return defs + "\n" + levels[n]().trim();
  } finally {
    LIT = true;
  }
};
