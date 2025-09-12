import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-premium-black text-premium-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 border-0 hover:bg-premium-orange hover:text-premium-white",
        secondary: "bg-premium-beige text-premium-black border border-premium-border shadow-sm hover:bg-premium-beige-light hover:border-premium-border-dark hover:shadow-md",
        outline: "border border-premium-border bg-transparent text-premium-black hover:bg-premium-orange hover:text-premium-white hover:border-premium-orange",
        ghost: "hover:bg-premium-orange text-premium-black hover:text-premium-white",
        destructive: "bg-premium-orange-dark text-premium-white hover:bg-premium-orange",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 px-4 py-2",
        lg: "h-12 px-8 py-4",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
