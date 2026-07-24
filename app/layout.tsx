import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const socialImage = `${protocol}://${host}/alexandria-social.png`;

  return {
    title: "Alexandria — Content Intelligence",
    description: "A content intelligence platform that watches what changed and keeps every page alive, accurate, and authoritative.",
    openGraph: {
      title: "Alexandria — Content Intelligence",
      description: "Every website has become its own Alexandria.",
      type: "website",
      images: [{ url: socialImage, width: 1731, height: 909, alt: "Alexandria — A living library for a changing world." }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Alexandria — Content Intelligence",
      description: "Every website has become its own Alexandria.",
      images: [socialImage],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
