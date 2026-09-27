import { ref, watch } from "vue";

/**
 * Which levels this tab has opened. Session-scoped so a fresh tab starts hidden. A hard refresh
 * (shift reload) starts hidden too: the server marks the page when the browser asked for it with
 * Cache-Control: no-cache, and the mark clears the list.
 */
const KEY = "jev10.revealed";

declare global {
  interface Window {
    __JEV_HARD_RELOAD__?: boolean;
  }
}

function load(): number[] {
  if (window.__JEV_HARD_RELOAD__) {
    sessionStorage.removeItem(KEY);
    return [];
  }
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export const revealed = ref<number[]>(load());

export function reveal(n: number): void {
  if (!revealed.value.includes(n)) {
    revealed.value = [...revealed.value, n];
    sessionStorage.setItem(KEY, JSON.stringify(revealed.value));
  }
}

/**
 * How far the index line was scrolled sideways. Leaving a level lands back on the same card
 * instead of the start of the ladder. Session-scoped, like the reveal list.
 */
const SCROLL_KEY = "jev10.indexScroll";
export const indexScroll = ref<number>(Number(sessionStorage.getItem(SCROLL_KEY)) || 0);

export function setIndexScroll(x: number): void {
  indexScroll.value = x;
  sessionStorage.setItem(SCROLL_KEY, String(x));
}

/** Visual mode: Run live opens the animated run modal. On by default, remembered per browser. */
const VISUAL_KEY = "jev10.visual";
export const visual = ref<boolean>(localStorage.getItem(VISUAL_KEY) !== "off");
watch(visual, (v) => localStorage.setItem(VISUAL_KEY, v ? "on" : "off"));
