const FALLBACK_URL = "http://localhost:3000";

function resolveSiteUrl() {
  const env = typeof process !== "undefined" ? process.env : {};
  const explicit = env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return FALLBACK_URL;
}

export const SITE = {
  name: "Fash Clothings",
  short: "FASH",
  url: resolveSiteUrl(),
  title: "FASH — Nigerian Native Dresses | Kaftans & Safari Suits",
  description:
    "FASH — Premium Nigerian native dresses. Hand-finished kaftans, safari suits and contemporary Nigerian fashion for every occasion.",
  ogDescription:
    "Hand-finished kaftans, safari suits and tunics, cut and finished by our Lagos tailors. Festive 2025 collection, alterations included.",
  email: "hello@fash.example.com",
  phone: "+234-700-328-4277",
  phoneHref: "tel:+2347003284277",
  priceRange: "₦₦",
  founded: "2013",
  address: {
    street: "14 Adeola Odeku Street, Victoria Island",
    city: "Lagos",
    region: "Lagos",
    country: "NG",
  },
  geo: { lat: 6.4281, lng: 3.4219 },
  socials: {
    instagram: "https://instagram.com/fashclothings",
    x: "https://x.com/fashclothings",
    pinterest: "https://pinterest.com/fashclothings",
  },
  ogImage: { src: "/images/royal-blue-safari-suite.png", width: 1024, height: 1024 },
};

export const NAV_LINKS = [
  { label: "Lookbook", href: "#lookbook" },
  { label: "Shop", href: "/collection" },
  { label: "Brand", href: "#story" },
  { label: "Featured", href: "#featured" },
  { label: "Contact", href: "#care" },
];

export const MENU_LINKS = [
  { label: "Lookbook", href: "#lookbook" },
  { label: "Shop", href: "/collection" },
  { label: "Brand", href: "#story" },
  { label: "Featured", href: "#featured" },
  { label: "Reviews", href: "#reviews" },
  { label: "Contact", href: "#care" },
];

export const MARQUEE_ITEMS = [
  "Free Delivery Nationwide",
  "Complimentary Returns",
  "Book a Personal Styling Session",
  "Hand-Finished in Lagos",
  "Alterations Included",
];

export const PRESS = [
  "Vogue",
  "GQ",
  "Esquire",
  "Forbes",
  "Hypebeast",
  "Financial Times",
];

export const SIZE_GUIDE = {
  caption: "Measurements in inches — chest / waist",
  head: ["Size", "Chest", "Waist", "Sleeve"],
  rows: [
    ["S", "36–38", "30–32", "23.5"],
    ["M", "39–41", "33–35", "24"],
    ["L", "42–44", "36–38", "24.5"],
    ["XL", "45–47", "39–41", "25"],
    ["XXL", "48–50", "42–44", "25.5"],
  ],
  note: "Every FASH order includes one complimentary alteration. Send your measurements after ordering and we will cut to fit.",
};

export function buildJsonLd() {
  const orgId = `${SITE.url}/#org`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: SITE.name,
        url: SITE.url,
        logo: `${SITE.url}/icon.svg`,
        image: `${SITE.url}${SITE.ogImage.src}`,
        description:
          "Lagos atelier making premium Nigerian native dress: kaftans, safari suits and tunics, with alterations included.",
        email: SITE.email,
        telephone: SITE.phone,
        priceRange: SITE.priceRange,
        foundingDate: SITE.founded,
        areaServed: "NG",
        address: {
          "@type": "PostalAddress",
          streetAddress: SITE.address.street,
          addressLocality: SITE.address.city,
          addressRegion: SITE.address.region,
          addressCountry: SITE.address.country,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: SITE.geo.lat,
          longitude: SITE.geo.lng,
        },
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ],
          opens: "09:00",
          closes: "19:00",
        },
        sameAs: [SITE.socials.instagram, SITE.socials.x, SITE.socials.pinterest],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.title,
        publisher: { "@id": orgId },
        inLanguage: "en-NG",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE.url}/?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Store",
        "@id": `${SITE.url}/#store`,
        name: SITE.name,
        image: `${SITE.url}${SITE.ogImage.src}`,
        priceRange: SITE.priceRange,
        currenciesAccepted: "NGN",
        paymentAccepted: "Cash, Card, Bank Transfer, POS",
        address: {
          "@type": "PostalAddress",
          streetAddress: SITE.address.street,
          addressLocality: SITE.address.city,
          addressCountry: SITE.address.country,
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          reviewCount: "268",
          bestRating: "5",
        },
      },
    ],
  };
}
