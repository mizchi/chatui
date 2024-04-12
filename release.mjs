// import { $ } from "zx";
await $`pnpm build`;
await $`cp _headers dist/`
await $`pnpm wrangler pages deploy ./dist`