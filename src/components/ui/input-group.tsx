import * as React from "react"

import { cn } from "@/lib/utils"

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "flex min-h-11 w-full items-stretch overflow-hidden rounded-md border border-slate-700 bg-slate-800 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/30 has-[[aria-invalid=true]]:border-rose-400 has-[[aria-invalid=true]]:ring-2 has-[[aria-invalid=true]]:ring-rose-400/20",
        className
      )}
      {...props}
    />
  )
}

function InputGroupInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input-group-control"
      className={cn(
        "min-w-0 flex-1 bg-transparent px-3 py-2 font-mono text-base text-white outline-none placeholder:text-slate-500",
        className
      )}
      {...props}
    />
  )
}

function InputGroupTextarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="input-group-control"
      className={cn(
        "min-h-24 min-w-0 flex-1 resize-y bg-transparent px-3 py-2 font-mono text-sm text-white outline-none placeholder:text-slate-500",
        className
      )}
      {...props}
    />
  )
}

function InputGroupAddon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="input-group-addon"
      className={cn("flex shrink-0 items-center border-l border-slate-700 px-3 text-sm text-slate-400", className)}
      {...props}
    />
  )
}

export { InputGroup, InputGroupAddon, InputGroupInput, InputGroupTextarea }
