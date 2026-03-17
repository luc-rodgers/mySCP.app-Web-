import * as React from "react"

interface DropdownMenuProps {
  children: React.ReactNode
}

const DropdownMenu = ({ children }: DropdownMenuProps) => {
  return <div className="relative inline-block">{children}</div>
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

const DropdownMenuTrigger = ({ children }: DropdownMenuTriggerProps) => {
  return <>{children}</>
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end"
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, align = "end", ...props }, ref) => {
    const alignClass = align === "start" ? "left-0" : align === "end" ? "right-0" : "left-1/2 -translate-x-1/2"
    
    return (
      <div
        ref={ref}
        className={`absolute ${alignClass} top-full mt-2 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md ${className || ''}`}
        {...props}
      />
    )
  }
)
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className || ''}`}
    {...props}
  />
))
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`-mx-1 my-1 h-px bg-muted ${className || ''}`}
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
}
