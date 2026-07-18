import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "Weavr | AI Talent Matching Engine",
  description: "Immersive Real-Time AI Talent Matching Engine for Students and Companies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white">
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}