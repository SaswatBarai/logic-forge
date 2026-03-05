"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { PreLoader } from "@/components/PreLoader";

export function PreLoaderWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Only show preloader on the home route
  const isHomePage = pathname === "/";

  const [loaderState, setLoaderState] = useState<
    "pending" | "running" | "done"
  >("pending");

  useEffect(() => {
    // If not home page, skip entirely
    if (!isHomePage) {
      setLoaderState("done");
      return;
    }

    const seen = sessionStorage.getItem("lf_loaded");
    if (seen) {
      setLoaderState("done");
    } else {
      setLoaderState("running");
    }
  }, [isHomePage]);

  const handleComplete = () => {
    sessionStorage.setItem("lf_loaded", "1");
    setLoaderState("done");
  };

  // Pending — show blank bg to prevent flash
  // But ONLY on home page — other pages render instantly
  if (loaderState === "pending" && isHomePage) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "hsl(var(--background))",
          zIndex: 9998,
        }}
      />
    );
  }

  return (
    <>
      {loaderState === "running" && isHomePage && (
        <PreLoader onComplete={handleComplete} />
      )}
      <div
        style={{
          visibility:
            loaderState === "done" || !isHomePage ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </>
  );
}
