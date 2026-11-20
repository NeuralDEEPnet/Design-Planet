import type React from 'react';
import { useEffect } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg hover:brightness-110 shadow-md shadow-accent/20',
  secondary: 'bg-surface2 text-fg border border-line hover:border-accent/60',
  ghost: 'text-muted hover:text-fg hover:bg-surface2',
  danger: 'bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25',
};

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }> = ({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  ...rest
}) => (
  <button
    className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
      size === 'sm' ? 'px-2.5 py-1.5 text-xs' : size === 'lg' ? 'px-5 py-3 text-base' : 'px-3.5 py-2 text-sm'
    } ${variants[variant]} ${className}`}
    {...rest}
  >
    {children}
  </button>
);

export const Card: React.FC<{ title?: React.ReactNode; actions?: React.ReactNode; className?: string; children: React.ReactNode }> = ({ title, actions, className = '', children }) => (
  <section className={`bg-surface border border-line rounded-xl ${className}`}>
    {(title || actions) && (
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line">
        {title && <h3 className="text-sm font-semibold tracking-wide text-fg">{title}</h3>}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
    )}
    <div className="p-4">{children}</div>
  </section>
);

export const Field: React.FC<{ label: string; hint?: string; count?: string; children: React.ReactNode }> = ({ label, hint, count, children }) => (
  <label className="block">
    <span className="flex items-baseline justify-between text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
      <span>{label}</span>
      {count && <span className="normal-case tracking-normal font-normal">{count}</span>}
    </span>
    {children}
    {hint && <span className="block text-xs text-muted mt-1">{hint}</span>}
  </label>
);

const inputCls = 'w-full bg-surface2 border border-line rounded-lg px-3 py-2 text-sm text-fg placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent/60 focus:border-accent/60';

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...rest }) => <input className={`${inputCls} ${className}`} {...rest} />;
export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...rest }) => (
  <textarea className={`${inputCls} resize-y ${className}`} {...rest} />
);
export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...rest }) => (
  <select className={`${inputCls} ${className}`} {...rest}>
    {children}
  </select>
);

type Tone = 'neutral' | 'good' | 'warn' | 'bad' | 'accent';
const tones: Record<Tone, string> = {
  neutral: 'bg-surface2 text-muted border-line',
  good: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  warn: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  bad: 'bg-red-500/15 text-red-300 border-red-500/30',
  accent: 'bg-accent/15 text-accent border-accent/30',
};
export const Badge: React.FC<{ tone?: Tone; className?: string; children: React.ReactNode }> = ({ tone = 'neutral', className = '', children }) => (
  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tones[tone]} ${className}`}>{children}</span>
);

export const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }> = ({ title, onClose, children, footer, wide }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-surface border border-line rounded-2xl shadow-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-4 border-b border-line flex items-center justify-between">
          <h2 className="font-display text-sm tracking-widest uppercase text-accent">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-fg text-xl leading-none">
            ×
          </button>
        </header>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <footer className="px-5 py-4 border-t border-line flex justify-end gap-2">{footer}</footer>}
      </div>
    </div>
  );
};

export const EmptyState: React.FC<{ icon?: React.ReactNode; title: string; text: string; action?: React.ReactNode }> = ({ icon, title, text, action }) => (
  <div className="flex flex-col items-center justify-center text-center h-full min-h-[40vh] p-8 text-muted">
    {icon && <div className="mb-4 rave-pulse">{icon}</div>}
    <p className="text-lg font-semibold text-fg">{title}</p>
    <p className="text-sm max-w-md mt-1">{text}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const Swatch: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <span className="w-8 h-8 rounded-lg border border-line shadow-inner" style={{ background: color }} aria-hidden="true" />
    <div className="leading-tight">
      <div className="text-xs font-semibold text-fg capitalize">{label}</div>
      <div className="text-[11px] font-mono text-muted">{color}</div>
    </div>
  </div>
);
