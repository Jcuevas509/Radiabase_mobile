import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS, Platform, type ColorValue } from 'react-native';

/**
 * iOS 26's Liquid Glass re-tints tab items adaptively during scroll/pull
 * interactions and resolves dynamic colors with the wrong variant while it
 * does (expo/expo#39930). A DynamicColorIOS whose light AND dark variants
 * are the same brand cyan makes every resolution land on cyan — the flash
 * has nowhere to go. Plain hex elsewhere.
 */
const TAB_CYAN: ColorValue = Platform.OS === 'ios'
    ? DynamicColorIOS({ light: '#00D1EA', dark: '#00D1EA' })
    : '#00D1EA';

/**
 * True native UITabBarController tabs. On iOS 26 the system draws the bar
 * itself with Liquid Glass — floating capsule, scroll-under refraction, and
 * the scroll edge effect all come from the OS, not from our styling.
 */
export default function TabsLayout() {
    return (
        <NativeTabs
            // Active tab is brand cyan; unselected items are left to the
            // system so Liquid Glass adapts them to the content behind the
            // bar (white over the dark map, dark over light screens).
            tintColor={TAB_CYAN}
            minimizeBehavior="onScrollDown"
        >
            <NativeTabs.Trigger name="dashboard">
                <Icon sf="house.fill" />
                <Label>Home</Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="index">
                <Icon sf="map.fill" />
                <Label>Map</Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="myLeads">
                <Icon sf="person.2.fill" />
                <Label>My Leads</Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="myDeals">
                <Icon sf="doc.text.fill" />
                <Label>My Deals</Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="profile">
                <Icon sf="person.crop.circle.fill" />
                <Label>Profile</Label>
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}
