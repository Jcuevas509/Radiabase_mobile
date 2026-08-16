/**
 * Returns true when the drawer item should show as the current screen.
 */
export function isActiveMenuRoute(pathname: string, route: string): boolean {
  if (route === '/') {
    return pathname === '/' || pathname === '/index';
  }
  return pathname === route;
}
