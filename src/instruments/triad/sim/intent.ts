/** User-control signal. The guided ride suppresses it while it writes. */

let suppress = 0;
let listener: () => void = () => {};

export function setUserIntentListener(fn: () => void) {
  listener = fn;
}

export function userIntent() {
  if (suppress === 0) listener();
}

export function withoutUserIntent(fn: () => void) {
  suppress++;
  try {
    fn();
  } finally {
    suppress--;
  }
}
