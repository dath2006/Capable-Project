import { type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Alert({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="alert"
      className={cn(
        "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]",
        className,
      )}
      {...props}
    />
  );
}

export function AlertTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={cn("text-sm text-[var(--muted-foreground)]", className)}
      {...props}
    />
  );
}
