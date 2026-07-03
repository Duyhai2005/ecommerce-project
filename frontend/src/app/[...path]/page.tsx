import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AppShell />
    </Suspense>
  );
}
