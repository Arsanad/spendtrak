// Polyfill for import.meta.env which isn't supported in Metro
if (typeof global !== 'undefined') {
  // @ts-ignore
  global.importMeta = { env: { MODE: 'production', DEV: false, PROD: true } };
}
