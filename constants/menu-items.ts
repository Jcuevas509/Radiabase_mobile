import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { MenuItemProps } from 'types/componentsTypes';

type IconGlyph = keyof typeof Ionicons.glyphMap;

/** Adapts an Ionicons glyph to the drawer's SVG icon contract
 * ({ color, width, height }). */
function drawerIcon(name: IconGlyph) {
  return function DrawerIcon({ color, width }: { color: string; width: number }) {
    return React.createElement(Ionicons, { name, size: width, color });
  };
}

/** Managers: the drawer is the admin-tools menu. Day-to-day navigation
 * lives in the bottom tab bar for every role. */
export const menuItemsManager: MenuItemProps[] = [
  { id: 0, label: 'Analytics', route: '/manager/analytics', icon: drawerIcon('stats-chart-outline') },
  { id: 1, label: 'Offices', route: '/manager/offices', icon: drawerIcon('business-outline') },
  { id: 2, label: 'Teams', route: '/manager/team', icon: drawerIcon('people-outline') },
  { id: 3, label: 'Competitions', route: '/manager/competitions', icon: drawerIcon('trophy-outline') },
  { id: 4, label: 'Shop Gear', route: '/manager/shop-gear', icon: drawerIcon('shirt-outline') },
  { id: 5, label: 'Area management', route: '/manager/area-management', icon: drawerIcon('map-outline') },
  { id: 6, label: 'Onboarding', route: '/manager/onboarding', icon: drawerIcon('person-add-outline') },
];

/** Standard reps have no drawer — the header button opens Messages instead
 * (see HeaderMenuButton). Kept for the shared DrawerNavigator contract. */
export const menuItemsAgent: MenuItemProps[] = [];
