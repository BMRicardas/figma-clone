"use client";

import { Live } from "@/components/live";
import { Navbar } from "@/components/navbar";
import { LeftSidebar } from "@/components/left-sidebar";
import { RightSidebar } from "@/components/right-sidebar";

export default function Page() {
  return (
    <main className="h-screen overflow-hidden">
      <Navbar />
      <section className="flex h-full flex-row">
        <LeftSidebar />
        <Live />
        <RightSidebar />
      </section>
    </main>
  );
}
