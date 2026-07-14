import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Branch name for display. Older accounts stored the main branch as
 * "<Business> - Main" while the UI also renders a MAIN code badge, so "Main"
 * appeared twice. Strip the redundant suffix whenever the branch is the MAIN one.
 */
export function displayBranchName(name: string, branchCodeOrType?: string | null): string {
  const trimmed = (name || '').trim()
  if (!branchCodeOrType || branchCodeOrType.toUpperCase() !== 'MAIN') return trimmed
  const stripped = trimmed.replace(/\s*[-–—]\s*main(\s+branch)?$/i, '').trim()
  return stripped || trimmed
}
