import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strip HTML tags and limit length for plain-text form inputs.
 * Prevents storage of markup in fields that are only ever rendered as text.
 */
export function sanitizeInput(value: string, maxLength = 300): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}
