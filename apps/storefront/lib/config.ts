import type { MenuItem } from "@/lib/commerce/types/menu";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

const defaultUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export type SocialPlatform =
  | "facebook"
  | "github"
  | "instagram"
  | "linkedin"
  | "pinterest"
  | "tiktok"
  | "x"
  | "youtube";

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Porulle Starter",
  socialLinks: [] as SocialLink[],
  url: trimTrailingSlash(process.env.NEXT_PUBLIC_BASE_URL || defaultUrl),
} as const;

// AI shopping assistant. Opt-in — set NEXT_PUBLIC_ENABLE_AGENT="1" (and provide
// an AI Gateway key for the agent's LLM calls).
export const agent = {
  enabled: process.env.NEXT_PUBLIC_ENABLE_AGENT === "1",
} as const;

export const navItems: MenuItem[] = [
  {
    id: "default-nav-shop",
    title: "Shop",
    url: "/collections/all",
    type: "HTTP",
    items: [],
  },
  {
    id: "default-nav-about",
    title: "About",
    url: "/about",
    type: "HTTP",
    items: [],
  },
];

export const footerItems: MenuItem[] = [];
