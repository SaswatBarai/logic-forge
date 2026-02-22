"use client";

import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (status === "unauthenticated") {
    return <p>You need to log in to access the dashboard.</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Welcome to the Dashboard</h1>
      <p className="mt-4">Hello, {session?.user?.name || "User"}!</p>
    </div>
  );
}