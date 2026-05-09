import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formats an ISO date string (YYYY-MM-DD) or Date object to DD/MM/YYYY.
 */
export function formatDate(dateInput) {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'string' ? new Date(dateInput + 'T00:00:00') : new Date(dateInput);
  if (isNaN(d)) return String(dateInput);
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  return `${day}/${month}/${year}`;
}
