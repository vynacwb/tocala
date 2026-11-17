import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "outline" | "ghost";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-[#6C1EE7] text-white shadow-lg shadow-[#6C1EE7]/25 hover:bg-[#BA3BE7] hover:shadow-[#BA3BE7]/25",
  outline: "border border-white/20 text-white hover:border-[#BA3BE7] hover:bg-[#6C1EE7]/20",
  ghost: "border border-white/10 bg-white/5 text-white/75 hover:border-[#BA3BE7] hover:bg-white/[0.08] hover:text-white",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={`tap-target inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BA3BE7] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100 ${variants[variant]} ${className}`}
      {...props}
    />
  ),
);

Button.displayName = "Button";
