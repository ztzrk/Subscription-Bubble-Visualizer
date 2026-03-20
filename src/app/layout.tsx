import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SubViz | Subscription Bubble Visualizer",
  description: "An interactive 2D physics playground to visualize your monthly subscription burn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white antialiased overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
