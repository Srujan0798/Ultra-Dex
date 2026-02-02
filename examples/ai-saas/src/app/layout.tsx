import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI SaaS Starter - Build AI Apps Faster",
  description:
    "A modern AI SaaS starter template built with Next.js 14, TypeScript, Tailwind CSS, Prisma, and Stripe.",
  keywords: ["AI", "SaaS", "Next.js", "OpenAI", "Stripe", "Template"],
  authors: [{ name: "AI SaaS Starter" }],
  openGraph: {
    title: "AI SaaS Starter",
    description: "Build AI-powered applications faster",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
