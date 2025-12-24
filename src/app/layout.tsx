// File: src/app/layout.tsx

import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { type ReactNode } from "react";

import { DynamicTitle } from "@/components/DynamicTitle";
import { ElectronStorageInit } from "@/components/ElectronStorageInit";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import HamburgerMenu from "@/components/HamburgerMenu";
import Header from "@/components/Header";
import MobileContentWrapper from "@/components/MobileContentWrapper";
import MobileHeader from "@/components/MobileHeader";
import PersistentPlayer from "@/components/PersistentPlayer";
import { SessionProvider } from "@/components/SessionProvider";
import { UIWrapper } from "@/components/UIWrapper";
import SuppressExtensionErrors from "@/components/SuppressExtensionErrors";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { MenuProvider } from "@/contexts/MenuContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { TRPCReactProvider } from "@/trpc/react";
import { getBaseUrl } from "@/utils/getBaseUrl";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: "darkfloor.art",
  description:
    "Modern music streaming and discovery platform with smart recommendations",
  applicationName: "darkfloor.art",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    title: "darkfloor.art",
    description:
      "Modern music streaming and discovery platform with smart recommendations",
    type: "website",
    url: baseUrl,
    siteName: "darkfloor.art",
    images: [
      {
        url: `${baseUrl}/api/og`,
        width: 1200,
        height: 630,
        alt: "darkfloor.art - Modern music streaming platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "darkfloor.art",
    description:
      "Modern music streaming and discovery platform with smart recommendations",
    images: [`${baseUrl}/api/og`],
  },
  other: {
    // Enhanced mobile meta tags
    "format-detection": "telephone=no", // Prevent auto-linking phone numbers
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <head>
        {/* Preconnect to external resources for faster loading */}
        <link rel="preconnect" href="https://cdn-images.dzcdn.net" />
        <link rel="dns-prefetch" href="https://api.deezer.com" />
      </head>
      <body>
        <SuppressExtensionErrors />
        <ElectronStorageInit />
        <ErrorBoundary>
          <SessionProvider>
            <TRPCReactProvider>
              <ToastProvider>
                <AudioPlayerProvider>
                  {/* Dynamic window title based on playback state */}
                  <DynamicTitle />
                  <MenuProvider>
                    {/* UI elements that can be hidden on desktop */}
                    <UIWrapper>
                      {/* Desktop header (hidden on mobile) */}
                      <Header />
                      {/* Mobile header with hamburger and search (hidden on desktop) */}
                      <MobileHeader />
                      {/* Hamburger menu drawer */}
                      <HamburgerMenu />
                      {/* Mobile content wrapper */}
                      <MobileContentWrapper>
                        {/* Main content with padding for mobile header and player */}
                        <div className="pt-16 pb-24 md:pt-0 md:pb-24">
                          {children}
                        </div>
                      </MobileContentWrapper>
                    </UIWrapper>
                    {/* Persistent player - stays on all pages */}
                    <PersistentPlayer />
                  </MenuProvider>
                </AudioPlayerProvider>
              </ToastProvider>
            </TRPCReactProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
