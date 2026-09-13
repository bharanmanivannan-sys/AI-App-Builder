import React, { useState, useRef, useEffect } from "react";
import { Loader2, X, Info } from "lucide-react";

export function Button({ variant = "primary", size = "md", className = "", children, ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand/50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";
  const sizes = { sm: "text-xs px-3 py-1.5", md: "text-sm px-4 py-2.5", lg: "text-base px-5 py-3" };
  const variants = {
    primary: "bg-brand text-white hover:bg-blue-500 shadow-glow",
    secondary: "bg-surface-2 text-tprimary border border-line hover:bg-surfaceHover",
    ghost: "text-tsecondary hover:text-tprimary hover:bg-surfaceHover",
    danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
    outline: "border border-line text-tprimary hover:bg-surfaceHover",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Card({ className = "", children, ...props }) {
  return <div className={`card ${className}`} {...props}>{children}</div>;
}

export function Badge({ tone = "default", className = "", children }) {
  const tones = {
    default: "bg-surface-2 text-tsecondary border-line",
    brand: "bg-brand/15 text-accent border-brand/30",
    success: "bg-success/15 text-success border-success/30",
    warning: "bg-warning/15 text-warning border-warning/30",
    danger: "bg-danger/15 text-danger border-danger/30",
    violet: "bg-violet/15 text-violet border-violet/30",
    info: "bg-info/15 text-info border-info/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Input({ label, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="caption block mb-1.5">{label}</span>}
      <input
        className={`w-full bg-surface-2 border border-line rounded-lg px-3.5 py-2.5 text-sm text-tprimary placeholder:text-tmuted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 transition-colors ${className}`}
        {...props}
      />
    </label>
  );
}

export function Select({ label, className = "", children, ...props }) {
  return (
    <label className="block">
      {label && <span className="caption block mb-1.5">{label}</span>}
      <select
        className={`w-full bg-surface-2 border border-line rounded-lg px-3 py-2.5 text-sm text-tprimary focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 transition-colors ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Spinner({ className = "" }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

export function Modal({ open, onClose, title, children, maxWidth = "max-w-lg", testId }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" data-testid={testId}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} card glass p-6 animate-fade-up max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-tmuted hover:text-tprimary transition-colors" data-testid="modal-close">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Tooltip({ content, children }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span className="absolute z-40 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 text-xs leading-relaxed text-tsecondary bg-surface-2 border border-line rounded-lg shadow-card">
          {content}
        </span>
      )}
    </span>
  );
}

export function InfoDot({ content }) {
  return (
    <Tooltip content={content}>
      <Info size={14} className="text-tmuted hover:text-accent cursor-help" />
    </Tooltip>
  );
}

export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && <div className="mb-4 p-4 rounded-2xl bg-surface-2 border border-line"><Icon size={28} className="text-tmuted" /></div>}
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-tsecondary max-w-md mb-5">{subtitle}</p>}
      {action}
    </div>
  );
}

export function SectionHeader({ label, title, right }) {
  return (
    <div className="flex items-end justify-between mb-5 gap-4 flex-wrap">
      <div>
        {label && <div className="caption mb-1">{label}</div>}
        <h2 className="text-xl sm:text-2xl font-semibold">{title}</h2>
      </div>
      {right}
    </div>
  );
}

export function useDropdownClose(ref, onClose) {
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, onClose]);
}
