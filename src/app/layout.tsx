// File: src/app/layout.tsx

// @ts-expect-error - CSS import
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
import { TrackContextMenuProvider } from "@/contexts/TrackContextMenuContext";
import { PlaylistContextMenuProvider } from "@/contexts/PlaylistContextMenuContext";
import { TRPCReactProvider } from "@/trpc/react";
import { getBaseUrl } from "@/utils/getBaseUrl";
import { TrackContextMenu } from "@/components/TrackContextMenu";
import { PlaylistContextMenu } from "@/components/PlaylistContextMenu";
import { RegisterServiceWorker } from "./register-sw";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: "darkfloor.art",
  description:
    "Modern music streaming and discovery platform with advanced audio features and visual patterns",
  applicationName: "darkfloor.art",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "darkfloor.art",
    description:
      "Modern music streaming and discovery platform with advanced audio features and visual patterns",
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
      "Modern music streaming and discovery platform with advanced audio features and visual patterns",
    images: [`${baseUrl}/api/og`],
  },
  other: {
    "format-detection": "telephone=no",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "darkfloor.art",
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
        {}
        <link rel="preconnect" href="https://cdn-images.dzcdn.net" />
        <link rel="dns-prefetch" href="https://api.deezer.com" />
      </head>
      <body>
        <SuppressExtensionErrors />
        <ElectronStorageInit />
        <RegisterServiceWorker />
        <ErrorBoundary>
          <SessionProvider>
            <TRPCReactProvider>
              <ToastProvider>
                <AudioPlayerProvider>
                  {}
                  <DynamicTitle />
                  <MenuProvider>
                    <TrackContextMenuProvider>
                      <PlaylistContextMenuProvider>
                        {}
                        <UIWrapper>
                          {}
                          <Header />
                          {}
                          <MobileHeader />
                          {}
                          <HamburgerMenu />
                          {}
                          <MobileContentWrapper>
                            {}
                            <div className="pt-16 pb-24 md:pt-0 md:pb-24">
                              {children}
                            </div>
                          </MobileContentWrapper>
                        </UIWrapper>
                        {}
                        <PersistentPlayer />
                        {}
                        <TrackContextMenu />
                        {}
                        <PlaylistContextMenu />
                      </PlaylistContextMenuProvider>
                    </TrackContextMenuProvider>
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
