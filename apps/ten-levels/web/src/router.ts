import { createRouter, createWebHistory } from "vue-router";
import IndexView from "./views/IndexView.vue";
import LevelView from "./views/LevelView.vue";
import { indexScroll } from "./lib/store";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: IndexView },
    { path: "/level/:n(\\d+)", component: LevelView, props: (r) => ({ n: Number(r.params.n) }) },
  ],
  // The index scrolls sideways, so returning to it restores the spot in the line.
  scrollBehavior: (to) => (to.path === "/" ? { top: 0, left: indexScroll.value } : { top: 0, left: 0 }),
});
