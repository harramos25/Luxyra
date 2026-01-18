import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, ...props }, ref) => {
        return (
            <div className="w-full">
                <input
                    type={type}
                    className={cn(
                        "flex h-12 w-full rounded-lg border border-luxyra-gold/20 bg-luxyra-deep/50 px-3 py-2 text-sm text-luxyra-champagne ring-offset-luxyra-plum file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-luxyra-blush/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxyra-gold/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-red-500/50 focus-visible:ring-red-500/50",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
