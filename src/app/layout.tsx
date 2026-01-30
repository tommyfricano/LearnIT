import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import FullStoryProvider from "@/components/FullStoryProvider";

/*
 * =======================================================================
 * TODO [FullStory]: INITIALIZE FULLSTORY SNIPPET HERE
 * =======================================================================
 * Insert the FullStory recording snippet in this root layout so it loads
 * on every page. Use next/script with strategy="afterInteractive".
 *
 * Example:
 *   import Script from 'next/script';
 *   <Script id="fullstory-snippet" strategy="afterInteractive">
 *     {`window['_fs_host'] = 'fullstory.com';
 *       window['_fs_script'] = 'edge.fullstory.com/s/fs.js';
 *       window['_fs_org'] = 'YOUR_ORG_ID';
 *       ...`}
 *   </Script>
 *
 * Alternatively, use the @fullstory/browser npm package:
 *   import * as FullStory from '@fullstory/browser';
 *   FullStory.init({ orgId: 'YOUR_ORG_ID' });
 * =======================================================================
 */

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "LearnIT - E-Learning Platform",
  description:
    "A simplified e-learning platform POC with FullStory integration points.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <FullStoryProvider />
        {children}
      </body>
    </html>
  );
}
