"use client";

import { ClientSideSuspense } from "@liveblocks/react";

import { CommentsOverlay } from "@/components/comments/comments-overlay";
import Loader from "../loader";
import { ReactNode } from "react";

export function Comments(): ReactNode {
  return (
    <ClientSideSuspense fallback={<Loader />}>
      {() => <CommentsOverlay />}
    </ClientSideSuspense>
  );
};
