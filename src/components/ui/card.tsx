import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#1A1A1A] shadow-2xl shadow-black/40 transition-[border-color,background-color,box-shadow] duration-200 ${className}`}
      {...props}
    />
  );
}
