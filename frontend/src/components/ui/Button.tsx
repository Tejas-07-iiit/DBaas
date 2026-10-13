import Link from "next/link";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline";
  size?: "md" | "lg";
  href?: string;
}

export function Button({ variant = "primary", size = "md", className = "", href, children, ...props }: ButtonProps) {
  const baseStyle = "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 cursor-pointer text-center";
  
  const variants = {
    primary: "bg-accent text-[#05080F] hover:shadow-[0_0_20px_rgba(25,227,193,0.3)]",
    outline: "border border-border bg-transparent hover:border-text text-text"
  };
  
  const sizes = {
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base"
  };

  const combinedClasses = `${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
}
