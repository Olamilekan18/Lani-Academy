/// <reference types="vite/client" />

// CDN (esm.sh) modules loaded on demand via dynamic import() — e.g. the PDF
// libraries used by the certificate download. Typed loosely as they have no
// local type declarations.
declare module "https://esm.sh/*";
