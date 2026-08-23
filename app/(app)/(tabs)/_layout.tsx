import { useEffect } from 'react';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS, Platform, type ColorValue } from 'react-native';
import { useDraftActionsStore } from 'store/DraftActionsStore';

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
 * itself with Liquid Glass.
 *
 * Nav-morph: while a drawn area is under review, the tab items transition
 * into the draft actions (Cancel / Redraw / Save area) in place — the Map
 * tab stays put, and a patched expo-router hook (patches/expo-router) lets
 * us run the action instead of navigating when a morphed item is tapped.
 */
export default function TabsLayout() {
    const draftActions = useDraftActionsStore((state) => state.actions);
    const isCompactBar = useDraftActionsStore((state) => state.isCompactBar);
    const isMorphed = draftActions !== null;

    useEffect(() => {
        if (!draftActions) {
            (globalThis as Record<string, unknown>).__radiabaseTabPressInterceptor = undefined;
            return;
        }
        const actionByRoute: Record<string, () => void> = {
            dashboard: draftActions.onCancel,
            myLeads: draftActions.onRedraw,
            // The Map tab is the selected item during the morph, so it wears
            // the cyan pill — it becomes the Save action.
            index: draftActions.isSaving ? () => undefined : draftActions.onSave,
            // Inert during the flow (relabel-only experiment keeps them visible).
            myDeals: () => undefined,
            profile: () => undefined,
        };
        (globalThis as Record<string, unknown>).__radiabaseTabPressInterceptor =
            (routeName: string) => {
                const action = actionByRoute[routeName];
                if (action) {
                    action();
                    return true;
                }
                return false;
            };
        return () => {
            (globalThis as Record<string, unknown>).__radiabaseTabPressInterceptor = undefined;
        };
    }, [draftActions]);

    return (
        <NativeTabs
            // Active tab is brand cyan; unselected items are left to the
            // system so Liquid Glass adapts them to the content behind the
            // bar (white over the dark map, dark over light screens).
            tintColor={TAB_CYAN}
            minimizeBehavior="onScrollDown"
        >
            <NativeTabs.Trigger name="dashboard">
                <Icon sf={isMorphed ? 'xmark' : 'house.fill'} />
                <Label>{isMorphed ? 'Cancel' : 'Home'}</Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="index">
                <Icon sf={isMorphed ? 'checkmark' : 'map.fill'} />
                <Label>{isMorphed ? 'Save area' : 'Map'}</Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="myLeads">
                <Icon sf={isMorphed ? 'arrow.counterclockwise' : 'person.2.fill'} />
                <Label>{isMorphed ? 'Redraw' : 'My Leads'}</Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="myDeals" hidden={false}>
                <Icon sf="doc.text.fill" />
                <Label>My Deals</Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="profile" hidden={false}>
                <Icon sf="person.crop.circle.fill" />
                <Label>Profile</Label>
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}
