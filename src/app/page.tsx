import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-luxyra-plum text-center relative overflow-hidden">

      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-luxyra-gold/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-xl space-y-8 animate-in fade-in zoom-in duration-1000">
        <h1 className="text-6xl font-serif text-luxyra-gold tracking-tighter drop-shadow-lg">
          Luxyra
        </h1>

        <p className="text-xl text-luxyra-blush/80 font-light leading-relaxed">
          The sanctuary for <span className="text-luxyra-gold">verified</span> connections.
          <br />
          Mysterious. Exclusive. Safe.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
          <Link href="/login">
            <Button className="btn-gold text-lg px-8 py-6">
              Enter Sanctuary
            </Button>
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 text-luxyra-blush/20 text-xs">
        © {new Date().getFullYear()} Luxyra. All rights reserved.
      </div>
    </main>
  );
}
