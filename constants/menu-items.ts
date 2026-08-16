import { MenuItemProps } from 'types/componentsTypes';
import { DashboardSvg, MapSvg, MyLocationSvg } from 'components/svg';

export const menuItemsManager: MenuItemProps[] = [
  { id: 0, label: 'Home', route: '/dashboard', icon: DashboardSvg },
  { id: 1, label: 'Field map', route: '/', icon: MapSvg },
  { id: 2, label: 'My location', route: '/myLocation', icon: MyLocationSvg },
];

export const menuItemsAgent: MenuItemProps[] = [
  { id: 0, label: 'Home', route: '/dashboard', icon: DashboardSvg },
  { id: 1, label: 'Field map', route: '/', icon: MapSvg },
  { id: 2, label: 'My location', route: '/myLocation', icon: MyLocationSvg },
];
