import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Note: Ensure @radix-ui/react-slot and class-variance-authority are installed
// If not, I'll fallback to simple button
// For MVP speed and avoiding npm issues, I'll write a versatile standard button without complex deps if possible.
// Actually, simple is better given the npm context.

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxyra-gold disabled:pointer-events-none disabled:opacity-50"

        const variants = {
            primary: "bg-luxyra-gold text-luxyra-plum hover:bg-luxyra-champagne shadow-[0_0_15px_rgba(212,175,55,0.3)]",
            secondary: "bg-luxyra-deep text-luxyra-blush border border-luxyra-blush/20 hover:bg-luxyra-deep/80",
            ghost: "hover:bg-luxyra-blush/10 text-luxyra-blush",
            outline: "border border-luxyra-gold/50 text-luxyra-gold hover:bg-luxyra-gold/10",
            danger: "bg-red-900/50 text-red-200 border border-red-500/50 hover:bg-red-900/80"
        }

        const sizes = {
            sm: "h-8 px-4 text-xs",
            md: "h-10 px-6 text-sm",
            lg: "h-12 px-8 text-base"
        }

        return (
            <button
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {children}
            </button>
        )
    }
)
Button.displayName = "Button"

export { Button }
