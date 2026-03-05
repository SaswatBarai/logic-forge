import type { Metadata } from "next";
import "./globals.css";
import { Toaster }        from "@/components/ui/sonner";
import { Toaster as ToastToaster } from "@/components/ui/toaster";
import { Providers }      from "@/components/Provider";
import { PreLoaderWrapper } from "@/components/PreLoaderWrapper";
import { GlobalClickSound } from "@/components/GlobalClickSound";

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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <Providers>
          {/*
            PreLoaderWrapper must wrap children but sit INSIDE Providers
            so that useSession / auth context is available inside PreLoader
            (needed by HeroSection which calls useSession)
          */}
           <GlobalClickSound />
          <PreLoaderWrapper>
            {children}
          </PreLoaderWrapper>

          {/* Toasters stay outside PreLoaderWrapper — always visible */}
          <Toaster />
          <ToastToaster />
        </Providers>
      </body>
    </html>
  );
}
