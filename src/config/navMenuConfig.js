/**
 * Legacy nav sections (reference). Hamburger menu uses `MenuDrawer` + footer actions.
 */

/** @typedef {{ id: string, label: string, description?: string, icon?: string, href?: string, action?: string, disabled?: boolean, badge?: string }} NavMenuItem */
/** @typedef {{ id: string, title: string, subtitle?: string, items: NavMenuItem[] }} NavMenuSection */

/** @type {NavMenuSection[]} */
export const NAV_MENU_SECTIONS = [
  {
    id: 'primary',
    title: 'Quick actions',
    subtitle: 'Maps and app info',
    items: [
      {
        id: 'weather-map',
        label: 'Weather Map',
        description: 'Leaflet map · OWM layers · wind',
        icon: 'map',
        action: 'openWeatherMap',
      },
      {
        id: 'saved-cities',
        label: 'Saved cities',
        description: 'Manage your list (menu → here)',
        icon: 'star',
        action: 'openSettings',
      },
      {
        id: 'about',
        label: 'About',
        description: 'SkyCast Ultra Pro Max',
        icon: 'info',
        action: 'openAbout',
      },
    ],
  },
  {
    id: 'navigate',
    title: 'Dashboard',
    subtitle: 'Jump to a section',
    items: [
      { id: 'home', label: 'Home', description: 'Top of dashboard', icon: 'home', href: '#home' },
      { id: 'forecast', label: 'Forecast', description: '7-day outlook', icon: 'chart', href: '#forecast' },
      { id: 'details', label: 'Weather details', description: 'Humidity, wind, pressure…', icon: 'sliders', href: '#weather-details' },
    ],
  },
];
