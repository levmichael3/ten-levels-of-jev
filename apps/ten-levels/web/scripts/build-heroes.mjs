/**
 * Renders the ten level hero images as SVG in the lab's synthwave palette.
 *
 *   node web/scripts/build-heroes.mjs   -> web/public/heroes/level-N.svg
 *
 * The drawings live in src/lib/hero-scenes.mjs so the run modal animates the same geometry.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { W, H, heroInner, levels } from "../src/lib/hero-scenes.mjs";

const HERE = fileURLToPath(new URL(".", import.meta.url));

for (const n of Object.keys(levels)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Level ${n}">${heroInner(n)}\n</svg>\n`;
  writeFileSync(`${HERE}../public/heroes/level-${n}.svg`, svg);
  console.log(`level-${n}.svg`);
}
