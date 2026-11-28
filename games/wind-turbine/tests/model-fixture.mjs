import './importmap.mjs';
const { createWindTurbineModel } = await import('../wt-model.js?v=0.2.0');

export function build() {
  const previous = globalThis.document;
  globalThis.document = { createElement: () => ({ getContext: () => ({
    fillRect() {}, createLinearGradient() { return { addColorStop() {} }; }
  }) }) };
  try { return createWindTurbineModel(); } finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
}
