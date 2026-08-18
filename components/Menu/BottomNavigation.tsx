import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react-native';
import Agreement01Icon from '@hugeicons/core-free-icons/Agreement01Icon';
import Home03Icon from '@hugeicons/core-free-icons/Home03Icon';
import MapsIcon from '@hugeicons/core-free-icons/MapsIcon';
import UserGroupIcon from '@hugeicons/core-free-icons/UserGroupIcon';
import UserIcon from '@hugeicons/core-free-icons/UserIcon';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NavigationItem = {
  readonly label: string;
  readonly route: '/' | '/dashboard' | '/myLeads' | '/myDeals' | '/profile';
  readonly icon: IconSvgElement;
};

const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { label: 'Home', route: '/dashboard', icon: Home03Icon },
  { label: 'Map', route: '/', icon: MapsIcon },
  { label: 'My Leads', route: '/myLeads', icon: UserGroupIcon },
  { label: 'My Deals', route: '/myDeals', icon: Agreement01Icon },
  { label: 'Profile', route: '/profile', icon: UserIcon },
];

function isActiveRoute(
  pathname: string,
  route: NavigationItem['route'],
): boolean {
  if (route === '/') {
    return pathname === '/';
  }
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}
    >
      {NAVIGATION_ITEMS.map((item) => {
        const isActive = isActiveRoute(pathname, item.route);
        const color = isActive ? '#1687E8' : '#71717A';
        return (
          <Pressable
            key={item.route}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: isActive }}
            hitSlop={4}
            onPress={() => {
              if (!isActive) {
                router.navigate(item.route);
              }
            }}
            style={({ pressed }) => [
              styles.item,
              pressed && styles.itemPressed,
            ]}
          >
            <HugeiconsIcon
              icon={item.icon}
              size={24}
              color={color}
              strokeWidth={isActive ? 2 : 1.7}
            />
            <Text
              numberOfLines={1}
              style={[styles.label, { color }, isActive && styles.activeLabel]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        minHeight: 66,
        flexShrink: 0,
        flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D4D4D8',
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
        elevation: 12,
  },
  item: {
    flex: 1,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  itemPressed: {
    opacity: 0.62,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
  activeLabel: {
    fontWeight: '700',
  },
});
