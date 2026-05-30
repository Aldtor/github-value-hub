import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Shell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col text-foreground">
      <Header />
      <main className={`flex-1 ${wide ? "max-w-6xl" : "max-w-5xl"} w-full mx-auto px-6 pb-16`}>{children}</main>
      <Footer />
    </div>
  );
}
