import type React from 'react';

export type IconName =
  | 'arrow-right'
  | 'arrow-up-right'
  | 'arrow-down'
  | 'check'
  | 'plus'
  | 'menu'
  | 'close'
  | 'search'
  | 'filter'
  | 'download'
  | 'bell'
  | 'lock'
  | 'user'
  | 'phone'
  | 'mail'
  | 'pin'
  | 'clock'
  | 'shield'
  | 'leaf'
  | 'bolt'
  | 'doc'
  | 'folder'
  | 'logout'
  | 'spark'
  | 'star'
  | 'snow'
  | 'sun'
  | 'wind'
  | 'tools'
  | 'sparkle'
  | 'image'
  | 'edit'
  | 'trash'
  | 'calendar'
  | 'chevron-left'
  | 'chevron-right';

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
  ariaHidden?: boolean;
}

export function Icon({
  name,
  size = 18,
  strokeWidth = 1.5,
  className,
  style,
  ariaHidden = true,
}: IconProps): React.ReactElement | null {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    style,
    'aria-hidden': ariaHidden,
  };
  switch (name) {
    case 'arrow-right':
      return <svg {...props}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case 'arrow-up-right':
      return <svg {...props}><path d="M7 17 17 7M9 7h8v8" /></svg>;
    case 'arrow-down':
      return <svg {...props}><path d="M12 5v14M6 13l6 6 6-6" /></svg>;
    case 'check':
      return <svg {...props}><path d="M4 12l5 5L20 6" /></svg>;
    case 'plus':
      return <svg {...props}><path d="M12 5v14M5 12h14" /></svg>;
    case 'menu':
      return <svg {...props}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
    case 'close':
      return <svg {...props}><path d="M6 6l12 12M18 6l-12 12" /></svg>;
    case 'search':
      return <svg {...props}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.5-4.5" /></svg>;
    case 'filter':
      return <svg {...props}><path d="M3 5h18M6 12h12M10 19h4" /></svg>;
    case 'download':
      return <svg {...props}><path d="M12 4v12M6 10l6 6 6-6M4 20h16" /></svg>;
    case 'bell':
      return <svg {...props}><path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 8H4c0-2 2-3 2-8z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>;
    case 'lock':
      return <svg {...props}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 1 1 8 0v3" /></svg>;
    case 'user':
      return <svg {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>;
    case 'phone':
      return <svg {...props}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>;
    case 'mail':
      return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 7 9-7" /></svg>;
    case 'pin':
      return <svg {...props}><path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></svg>;
    case 'clock':
      return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case 'shield':
      return <svg {...props}><path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z" /></svg>;
    case 'leaf':
      return <svg {...props}><path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z" /><path d="M5 19c4-4 8-6 14-14" /></svg>;
    case 'bolt':
      return <svg {...props}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" /></svg>;
    case 'doc':
      return <svg {...props}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></svg>;
    case 'folder':
      return <svg {...props}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" /></svg>;
    case 'logout':
      return <svg {...props}><path d="M16 17l5-5-5-5M21 12H9M13 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" /></svg>;
    case 'spark':
      return <svg {...props}><path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l4 4M14 14l4 4M18 6l-4 4M10 14l-4 4" /></svg>;
    case 'star':
      return <svg {...props} fill="currentColor"><path d="M12 3l2.5 6 6.5.5-5 4.5 1.5 6.5L12 17l-5.5 3.5L8 14l-5-4.5L9.5 9z" /></svg>;
    case 'snow':
      return <svg {...props}><path d="M12 2v20M4 6l16 12M20 6 4 18M2 12h20" /></svg>;
    case 'sun':
      return <svg {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" /></svg>;
    case 'wind':
      return <svg {...props}><path d="M3 8h12a3 3 0 1 0-3-3M3 12h17a3 3 0 1 1-3 3M3 16h10" /></svg>;
    case 'tools':
      return <svg {...props}><path d="M14 6l4-4 3 3-4 4-3-3zM3 21l8-8M11 13l-2-2 2-2 2 2-2 2zM3 3l5 5" /></svg>;
    case 'sparkle':
      return <svg {...props}><path d="M12 3v6M12 15v6M3 12h6M15 12h6" /></svg>;
    case 'image':
      return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.5" /><path d="M21 16l-5-5-4 4-2-2-5 5" /></svg>;
    case 'edit':
      return <svg {...props}><path d="M4 20h4L18 10l-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" /></svg>;
    case 'trash':
      return <svg {...props}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>;
    case 'calendar':
      return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>;
    case 'chevron-left':
      return <svg {...props}><path d="M14 6l-6 6 6 6" /></svg>;
    case 'chevron-right':
      return <svg {...props}><path d="M10 6l6 6-6 6" /></svg>;
    default:
      return null;
  }
}
