import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  // `.open-next` is the OpenNext/Workers build output (gitignored) — bundling
  // it into lint would flag minified vendor code.
  globalIgnores([".next/**", ".open-next/**", "generated/**", "node_modules/**"]),
  ...nextVitals,
]);
