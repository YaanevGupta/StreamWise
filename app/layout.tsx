import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StreamWise | Global Movie & Series Intel",
  description: "Search millions of movies and series. Real-time updates from TMDB & IMDB archives.",
  keywords: ["StreamWise", "Movie Search", "Streaming Guide", "IMDB search", "TMDB"],
  openGraph: {
    title: "StreamWise",
    description: "The ultimate movie intelligence portal.",
    url: "https://streamwise-rho.vercel.app",
    siteName: "StreamWise",
    images: [
      {
        url: "https://streamwise-rho.vercel.app/og-image.jpg", // You can add a logo here later
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}