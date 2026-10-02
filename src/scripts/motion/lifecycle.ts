type Cleanup = () => void;
type Init = () => Cleanup | void;

const inits: Init[] = [];
let cleanups: Cleanup[] = [];
let loaded = false;
let started = false;

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function runCleanups() {
  for (const c of cleanups.splice(0)) c();
}
function runInit(init: Init) {
  const c = init();
  if (c) cleanups.push(c);
}

/** Register page-scoped setup. Runs now if the page already loaded, and again after every navigation. */
export function onPage(init: Init) {
  inits.push(init);
  if (loaded) runInit(init);
}

export function startLifecycle(afterLoad?: () => void) {
  if (started) return;
  started = true;
  document.addEventListener('astro:page-load', () => {
    runCleanups();
    loaded = true;
    for (const i of inits) runInit(i);
    afterLoad?.();
  });
  document.addEventListener('astro:before-swap', runCleanups);
}
