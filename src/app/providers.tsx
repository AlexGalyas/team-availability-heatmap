"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { Provider } from "react-redux";
import { type AppStore, makeStore } from "./store";

export function Providers({ children }: { children: ReactNode }) {
  // Create the store once per client mount.
  const storeRef = useRef<AppStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = makeStore();
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
