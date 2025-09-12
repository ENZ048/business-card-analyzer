import * as React from "react"
import { cn } from "../../lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-premium-border bg-premium-white px-4 py-3 text-premium-black placeholder:text-premium-gray-light focus:border-premium-orange focus:outline-none focus:ring-2 focus:ring-premium-orange/20 focus:ring-offset-2 focus:ring-offset-premium-white transition-all duration-200",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
