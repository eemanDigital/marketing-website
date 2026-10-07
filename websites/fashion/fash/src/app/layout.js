import StoreProvider from "@/components/StoreProvider";
import Preloader from "@/components/Preloader";
import Cursor from "@/components/Cursor";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BackToTop from "@/components/BackToTop";
import Panels from "@/components/Panels";
import CookieBar from "@/components/CookieBar";
import Reveals from "@/components/Reveals";
import { SITE, buildJsonLd } from "@/lib/site";
import "./globals.css";

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "Nigerian native dress",
    "Aso Oke",
    "Adire",
    "Ankara",
    "agbada",
    "Lagos tailor",
    "made to measure",
    "Nigerian fashion",
  ],
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  formatDetection: { email: false },
  alternates: {
    canonical: SITE.url,
  },
  openGraph: {
    type: "website",
    url: SITE.url,
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.ogDescription,
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
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.ogDescription,
    images: [SITE.ogImage.src],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export function generateViewport() {
  return {
    themeColor: "#14110f",
    width: "device-width",
    initialScale: 1,
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="no-js" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.remove("no-js");`,
          }}
        />
        <div className="grain" aria-hidden="true" />
        <a className="skip-link" href="#main">
          Skip to main content
        </a>
        <StoreProvider>
          <Preloader />
          <Cursor />
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
          <BackToTop />
          <Panels />
          <CookieBar />
          <Reveals />
        </StoreProvider>
        <script
          id="ld-json"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }}
        />
      </body>
    </html>
  );
}