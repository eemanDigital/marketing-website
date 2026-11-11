import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
  themeColor: "#0b7a5c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
