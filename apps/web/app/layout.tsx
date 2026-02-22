import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as ToastToaster } from "@/components/ui/toaster";
import { Providers } from "@/components/Provider";

export const metadata: Metadata = {
  title: "LogicForge - AI-Proof Technical Evaluation",
  description:
    "The gamified, AI-proof technical evaluation platform built to test engineering intuition, not just memorization.",
  openGraph: {
    title: "LogicForge - AI-Proof Technical Evaluation",
    description:
      "The gamified, AI-proof technical evaluation platform built to test engineering intuition.",
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
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        {/* Wrap the entire application in the authentication provider */}
        <Providers>
          {children}
          <Toaster />
          <ToastToaster />
        </Providers>
      </body>
    </html>
  );
}