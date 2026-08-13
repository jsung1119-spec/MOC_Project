declare module "cloudflare:workers" {
  // Vercel typechecking intentionally excludes the full Cloudflare runtime declarations.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const env: { DB: any };
}
