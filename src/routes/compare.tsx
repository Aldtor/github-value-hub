import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare developers — GitWorth" },
      { name: "description", content: "Stack any two GitHub profiles side-by-side and see who wins each category." },
      { property: "og:title", content: "Compare developers — GitWorth" },
      { property: "og:description", content: "Side-by-side GitHub profile comparison." },
      { property: "og:url", content: "/compare" },
    ],
    links: [{ rel: "canonical", href: "/compare" }],
  }),
  component: ComparePage,
});

function ComparePage() {
  const nav = useNavigate();
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  return (
    <Shell>
      <section className="pt-20 pb-12">
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight">Compare two devs.</h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-xl">
          Head-to-head on followers, stars, repos, score and more.
        </p>
        <form
          onSubmit={(e) => { e.preventDefault(); const u1 = a.trim(), u2 = b.trim(); if (u1 && u2) nav({ to: "/compare/$user1/$user2", params: { user1: u1, user2: u2 } }); }}
          className="mt-10 grid sm:grid-cols-[1fr_auto_1fr_auto] gap-3 items-center max-w-3xl"
        >
          <Input v={a} set={setA} placeholder="torvalds" />
          <span className="font-mono text-muted-foreground text-center">vs</span>
          <Input v={b} set={setB} placeholder="gaearon" />
          <button className="px-6 py-3 text-sm font-medium bg-foreground text-background hover:opacity-90 transition">Compare</button>
        </form>
        <p className="mt-6 text-sm text-muted-foreground">
          <span className="font-mono">popular </span>
          {[["torvalds","gaearon"],["sindresorhus","tj"],["yyx990803","gaearon"]].map(([x,y],i)=>(
            <span key={x+y}>
              {i>0 && <span className="text-muted-foreground/40 mx-1.5">·</span>}
              <button onClick={()=>nav({to:"/compare/$user1/$user2",params:{user1:x,user2:y}})} className="font-mono hover:text-foreground hover:underline underline-offset-4">@{x} vs @{y}</button>
            </span>
          ))}
        </p>
      </section>
    </Shell>
  );
}

function Input({ v, set, placeholder }: { v: string; set: (s:string)=>void; placeholder: string }) {
  return (
    <div className="flex items-center border border-border focus-within:border-foreground transition px-3">
      <span className="text-muted-foreground font-mono">@</span>
      <input value={v} onChange={e => set(e.target.value)} placeholder={placeholder}
        className="flex-1 bg-transparent px-2 py-3 outline-none font-mono text-base placeholder:text-muted-foreground/50" />
    </div>
  );
}
