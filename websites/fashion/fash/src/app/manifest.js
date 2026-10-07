import { SITE } from "@/lib/site";

export default function manifest() {
  return {
    name: SITE.name,
    short_name: SITE.short,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#14110f",
    theme_color: "#14110f",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}