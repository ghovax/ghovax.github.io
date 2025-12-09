import type { Metadata } from "next";
import {
  Merriweather,
  Merriweather_Sans,
  Noto_Sans,
  Noto_Sans_Mono,
  Noto_Serif,
  STIX_Two_Text,
} from "next/font/google";

import "@/lib/document.css";
import "./globals.css";

const notoSerif = Noto_Serif({
  weight: "variable",
  style: ["italic", "normal"],
  subsets: [
    "cyrillic",
    "cyrillic-ext",
    "greek",
    "greek-ext",
    "latin",
    "latin-ext",
    "math",
    "vietnamese",
  ],
});
const notoSans = Noto_Sans({
  weight: "variable",
  style: ["italic", "normal"],
  subsets: [
    "cyrillic",
    "cyrillic-ext",
    "greek",
    "greek-ext",
    "latin",
    "latin-ext",
    "vietnamese",
  ],
});
const notoSansMono = Noto_Sans_Mono();
const stixTwoText = STIX_Two_Text({
  weight: "variable",
  style: ["italic", "normal"],
  subsets: [
    "cyrillic",
    "cyrillic-ext",
    "greek",
    "latin",
    "latin-ext",
    "vietnamese",
  ],
});

export const metadata: Metadata = {
  title: "Giovanni Gravili's Portfolio",
  description:
    "Collection of my work and projects, together with some personal insights and thoughts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-card dark:bg-card font-sans">{children}</body>
    </html>
  );
}
