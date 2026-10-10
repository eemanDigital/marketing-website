import Collection from "@/components/Collection";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "The Collection",
  description:
    "Shop every FASH piece — hand-finished kaftans, safari suits and tunics, cut and finished by our Lagos tailors.",
  alternates: {
    canonical: "/collection",
  },
  openGraph: {
    type: "website",
    url: "/collection",
    siteName: SITE.name,
    title: `The Collection — ${SITE.short}`,
    description:
      "Hand-finished kaftans, safari suits and tunics from the FASH atelier in Lagos.",
    locale: "en_NG",
    images: [
      {
        url: SITE.ogImage.src,
        width: SITE.ogImage.width,
        height: SITE.ogImage.height,
        alt: "FASH — Nigerian native dresses",
      },
    ],
  },
};

export default function CollectionPage() {
  return <Collection />;
}
