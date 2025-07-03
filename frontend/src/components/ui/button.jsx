import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary-600 hover:bg-primary-500 text-white focus:ring-primary-500 shadow-lg hover:shadow-xl",
        primary: "bg-primary-600 hover:bg-primary-500 text-white focus:ring-primary-500 shadow-lg hover:shadow-xl",
        secondary: "bg-accent-500 hover:bg-accent-400 text-neutral-100 focus:ring-accent-500",
        success: "bg-success-500 hover:bg-success-600 text-white focus:ring-success-500",
        danger: "bg-danger-500 hover:bg-danger-600 text-white focus:ring-danger-500",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-2 border-accent-500 hover:border-accent-400 hover:bg-accent-500 text-accent-300 hover:text-white bg-transparent focus:ring-accent-500",
        ghost: "bg-transparent hover:bg-secondary-700 text-neutral-300 hover:text-neutral-100 focus:ring-accent-500",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 text-base",
        sm: "h-9 px-3 py-1.5 text-sm",
        md: "h-10 px-4 py-2 text-base",
        lg: "h-11 px-6 py-3 text-lg",
        icon: "h-10 w-10",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  }
)

const Button = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  fullWidth = false,
  loading = false,
  disabled = false,
  asChild = false, 
  children,
  ...props 
}, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
      disabled={disabled || loading}
      ref={ref}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </Comp>
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
