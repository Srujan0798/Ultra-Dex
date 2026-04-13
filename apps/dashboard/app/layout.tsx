import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ultra-Dex | AI Orchestration Control Plane",
  description: "Route any AI task to any provider with persistent memory",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-void text-text-primary font-body">
        {children}
      </body>
    </html>
  );
}
