import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GoodbyePage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-luxyra-plum text-center relative overflow-hidden">

            <div className="relative z-10 max-w-md space-y-8 animate-in fade-in zoom-in duration-1000">
                <h1 className="text-4xl font-serif text-luxyra-gold tracking-tighter">
                    Farewell.
                </h1>

                <p className="text-lg text-luxyra-blush/80 font-light leading-relaxed">
                    Your account has been deleted permanently.
                    <br />
                    The sanctuary doors remain open, should you ever wish to return.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
                    <Link href="/login">
                        <Button className="btn-gold text-lg px-8 py-6">
                            Return to Login
                        </Button>
                    </Link>
                </div>
            </div>
        </main>
    );
}
