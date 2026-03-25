import {
  Home,
  Search,
  Map,
  BarChart3,
  SlidersHorizontal,
  Bell,
  LayoutGrid,
  Star,
  Settings,
  Info,
} from 'lucide-react';

/** @typedef {'home' | 'search' | 'map' | 'chart' | 'sliders' | 'bell' | 'grid' | 'star' | 'settings' | 'info'} NavIconId */

const ICON_STROKE = 2;
const common = 'h-5 w-5 flex-shrink-0';

export function NavMenuIcon({ id, className = '' }) {
  const c = `${common} ${className}`.trim();
  const p = { className: c, strokeWidth: ICON_STROKE, 'aria-hidden': true };
  switch (id) {
    case 'home':
      return <Home {...p} />;
    case 'search':
      return <Search {...p} />;
    case 'map':
      return <Map {...p} />;
    case 'chart':
      return <BarChart3 {...p} />;
    case 'sliders':
      return <SlidersHorizontal {...p} />;
    case 'bell':
      return <Bell {...p} />;
    case 'grid':
      return <LayoutGrid {...p} />;
    case 'star':
      return <Star {...p} />;
    case 'settings':
      return <Settings {...p} />;
    case 'info':
      return <Info {...p} />;
    default:
      return <Info {...p} />;
  }
}
