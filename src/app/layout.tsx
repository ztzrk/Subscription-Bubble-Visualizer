import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Messy | Visualize the Beautiful Mess",
  description: "An interactive zero-gravity physics playground to visualize the beautiful mess of your monthly subscription burn.",
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
