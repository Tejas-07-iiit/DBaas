"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordInput({ error, ...props }: any) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input 
        type={show ? "text" : "password"} 
        className={`w-full bg-surface border rounded-lg px-4 py-3 h-12 text-text outline-none transition-colors ${error ? "border-red-500 focus:border-red-500" : "border-border focus:border-accent"}`}
        {...props}
      />
      <button 
        type="button" 
        onClick={() => setShow(!show)} 
        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text focus:outline-none"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
