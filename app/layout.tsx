import type { Metadata } from "next";
import { Merriweather, Merriweather_Sans, Noto_Sans_Mono } from "next/font/google";
import "./document.css";
import "./globals.css";

const merriweatherSans = Merriweather_Sans();
const merriweather = Merriweather();
const notoSansMono = Noto_Sans_Mono();

export const metadata: Metadata = {
  title: "Giovanni Gravili's Portfolio",
  description: "Collection of my work and projects, together with some personal insights and thoughts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="bg-card dark:bg-card"
      >
        {children}
      </body>
    </html>
  );
}
