// dist/core has no export-map entry, so a consumer cannot deep-import the core
// (05-architecture.md, Package manifest). The rejected import is listed in expected-errors.json.
export { getForm } from 'svelte-final-form-ts/dist/core/context.js';
