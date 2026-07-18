# Storefront

A Next.js 16 storefront for a [porulle](https://github.com/asyncdotengineering/porulle)
headless-commerce backend, built with React 19, Tailwind CSS 4, and the typed
`@porulle/sdk`. Payments run through Stripe.

## Getting started

This app is part of the `porulle-starter` monorepo — see the [root README](../../README.md)
for the full setup (database, backend, API key). In short:

```sh
cp .env.example .env.local
# set PORULLE_API_URL, PORULLE_STOREFRONT_API_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
pnpm dev            # needs the porulle backend running on PORULLE_API_URL
```

The storefront reads the catalog anonymously and proxies cart/checkout writes with
a server-side porulle API key. See [`.env.example`](./.env.example) for every variable.

## Features

- **Next.js 16 App Router** with React 19, React Compiler, and Cache Components
- **porulle data layer** (`lib/commerce/*`) via the typed `@porulle/sdk`, behind the
  provider-agnostic `lib/types.ts` contract
- **Custom Stripe checkout** with the Stripe Payment Element (`/checkout`)
- **AI shopping assistant** — floating chat with catalog + cart tools over porulle,
  opt-in via `NEXT_PUBLIC_ENABLE_AGENT`
- **Tailwind CSS 4** and shadcn/ui components
- **Internationalization-ready** with next-intl
- **SEO** with structured data, sitemap, `llms.txt`, and markdown content negotiation

## Architecture

```
Request → Page → Operation (lib/commerce) → @porulle/sdk → porulle REST API → Transform → Domain type (lib/types) → Component
```

See [`AGENTS.md`](./AGENTS.md) for the data-flow contract, conventions, and the
Stripe checkout flow.

## License

MIT
