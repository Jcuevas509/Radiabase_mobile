import { isActiveMenuRoute } from './is-active-menu-route';

describe('isActiveMenuRoute', () => {
  it('treats / and /index as the field map', () => {
    expect(isActiveMenuRoute('/', '/')).toBe(true);
    expect(isActiveMenuRoute('/index', '/')).toBe(true);
    expect(isActiveMenuRoute('/dashboard', '/')).toBe(false);
  });

  it('matches an exact dashboard path', () => {
    expect(isActiveMenuRoute('/dashboard', '/dashboard')).toBe(true);
    expect(isActiveMenuRoute('/', '/dashboard')).toBe(false);
  });
});
