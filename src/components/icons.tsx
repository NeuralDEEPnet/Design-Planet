import type React from 'react';

type IconProps = { className?: string };

export const PlanetIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
    <defs>
      <radialGradient id="planetGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#f59e0b" />
      </radialGradient>
    </defs>
    <circle cx="100" cy="100" r="60" fill="url(#planetGrad)" />
    <ellipse cx="100" cy="100" rx="90" ry="30" fill="none" stroke="#fde047" strokeWidth="8" transform="rotate(-20 100 100)" />
  </svg>
);

export const LogoIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#7e22ce" />
      </linearGradient>
    </defs>
    <path d="M100 20 L180 100 L100 180 L20 100 Z" fill="url(#logoGrad)" />
    <circle cx="100" cy="100" r="30" fill="none" stroke="#f1f5f9" strokeWidth="10" />
  </svg>
);

export const IllustrationIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="nebGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f472b6" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
    <path d="M50 150 C 20 100, 100 20, 150 50 S 180 100, 150 150 Z" fill="url(#nebGrad)" />
    <circle cx="80" cy="120" r="10" fill="#fff" opacity="0.8" />
  </svg>
);

export const UIIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
    <rect x="25" y="45" width="150" height="110" rx="14" fill="#38bdf8" />
    <rect x="25" y="45" width="150" height="26" rx="14" fill="#0ea5e9" />
    <rect x="45" y="90" width="60" height="12" rx="6" fill="#0b1020" opacity="0.6" />
    <rect x="45" y="115" width="110" height="12" rx="6" fill="#0b1020" opacity="0.4" />
  </svg>
);

export const SegmentationIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
    <path d="M30 70 L100 170 L170 70 Z" fill="#34d399" opacity="0.6" />
    <path d="M30 130 L100 30 L170 130 Z" fill="#10b981" />
  </svg>
);

export const CruiseIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
    <circle cx="100" cy="100" r="70" fill="none" stroke="#fbbf24" strokeWidth="14" strokeDasharray="330 110" strokeLinecap="round" transform="rotate(135 100 100)" />
    <path d="M100 100 L135 60" stroke="#fde68a" strokeWidth="12" strokeLinecap="round" />
    <circle cx="100" cy="100" r="12" fill="#fde68a" />
  </svg>
);

export const StudioMark: React.FC<IconProps> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
    <circle cx="100" cy="100" r="58" fill="#38bdf8" />
    <ellipse cx="100" cy="100" rx="92" ry="30" fill="none" stroke="#fde047" strokeWidth="10" transform="rotate(-20 100 100)" />
    <circle cx="150" cy="70" r="10" fill="#c084fc" />
  </svg>
);

const stroke = (d: string, extra = '') =>
  ({ className = 'w-5 h-5' }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
      {extra && <path d={extra} />}
    </svg>
  );

export const SendIcon = stroke('M22 2 11 13', 'M22 2 15 22 11 13 2 9z');
export const PaperclipIcon = stroke('m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48');
export const BookmarkIcon = stroke('m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z');
export const EditIcon = stroke('M12 20h9', 'M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z');
export const DownloadIcon = stroke('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5M12 15V3');
export const SettingsIcon = stroke('M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z');
export const PlusIcon = stroke('M12 5v14', 'M5 12h14');
export const TrashIcon = stroke('M3 6h18', 'M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6h12');
export const CheckIcon = stroke('M20 6 9 17l-5-5');
export const AlertIcon = stroke('M12 9v4', 'M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z');
export const SparkIcon = stroke('m12 3 1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z');
export const SunIcon = stroke('M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z', 'M12 1v2m0 18v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M1 12h2m18 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4');
export const MoonIcon = stroke('M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z');
export const RefreshIcon = stroke('M21 12a9 9 0 1 1-2.6-6.4', 'M21 3v6h-6');
export const ChevronIcon = stroke('m9 18 6-6-6-6');
export const ExternalIcon = stroke('M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6', 'M15 3h6v6M10 14 21 3');
export const MenuIcon = stroke('M4 6h16', 'M4 12h16M4 18h16');

export const Spinner: React.FC = () => (
  <div className="flex space-x-1" role="status" aria-label="Working">
    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
  </div>
);
