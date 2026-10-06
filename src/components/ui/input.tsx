import { forwardRef, type InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, id, ...props }, ref) => (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-sm font-medium text-white/80">{label}</span>
      <input
        ref={ref}
        id={id}
        className={`h-14 w-full rounded-xl border border-white/20 bg-transparent px-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#BA3BE7] focus:ring-2 focus:ring-[#BA3BE7]/25 ${className}`}
        {...props}
      />
    </label>
  ),
);

Input.displayName = "Input";
