import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "dealrec - Put the deal on record",
    template: "%s | dealrec",
  },
  description:
    "Create clear agreements, get everyone to confirm and sign, track payments, and keep a verifiable record of everyday deals.",
  applicationName: "dealrec",
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "dealrec - Put the deal on record",
    description:
      "Agree clearly. Sign securely. Keep the record. For loans, sales, services, deposits and everyday transactions.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#E9E4FF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
