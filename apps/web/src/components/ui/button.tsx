import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-btn text-[14px] leading-[20px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary-600 active:bg-primary-700",
        primary: "bg-primary text-white hover:bg-primary-600 active:bg-primary-700",
        secondary: "bg-transparent border border-border text-text-secondary hover:bg-surface hover:border-border-light",
        outline: "bg-transparent border border-border text-text-secondary hover:bg-surface hover:border-border-light",
        ghost: "bg-transparent text-text-secondary hover:bg-surface",
        destructive: "bg-error text-white hover:bg-error/90 active:bg-error/80",
        link: "text-primary underline-offset-4 hover:underline",
        accent: "bg-accent text-white hover:opacity-90 active:opacity-80",
      },
      size: {
        default: "h-10 px-6 py-3",
        sm: "h-9 rounded-btn px-4 py-2 text-[13px]",
        lg: "h-11 rounded-btn px-8 py-3",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={`${buttonVariants({ variant, size })} ${className || ''}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }











