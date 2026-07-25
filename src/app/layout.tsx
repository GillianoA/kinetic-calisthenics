import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://calisthenics.gillianoagard.com",
  ),
  title: {
    default: "Kinetic — Calisthenics progress, together",
    template: "%s · Kinetic",
  },
  description:
    "A private, shared calisthenics training space for workouts, skills, measurements, goals, and friendly accountability.",
  applicationName: "Kinetic",
  icons: {
    icon: [{ url: "/icon", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/icon", type: "image/png", sizes: "512x512" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kinetic",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Kinetic",
    title: "Kinetic — Calisthenics progress, together",
    description:
      "Track workouts, master skills, and stay consistent with your accountability partner.",
    images: [
      {
        url: "/kinetic-social.png",
        width: 1697,
        height: 901,
        alt: "Two crystalline progress rings beside a glass pull-up bar and rising training graph",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kinetic — Calisthenics progress, together",
    description:
      "Track workouts, master skills, and stay consistent with your accountability partner.",
    images: ["/kinetic-social.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eaf5ff" },
    { media: "(prefers-color-scheme: dark)", color: "#06101f" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'document.documentElement.dataset.theme=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";',
          }}
        />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
