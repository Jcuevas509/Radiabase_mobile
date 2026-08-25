import { useEffect, useState } from 'react';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
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
    // Two-phase choreography: UIKit animates item POSITIONS (the 5→3
    // collapse) and item CONTENT (labels/icons) as competing transactions
    // when changed together — the content swap lands mid-collapse, cutting
    // the pill's transition and re-snapping icon layout. So: collapse
    // first, untouched labels; swap the text/icons only once the bar is
    // still (pure content change, no layout motion in equal-width slots).
    const [labelsMorphed, setLabelsMorphed] = useState(false);
    useEffect(() => {
        if (!isMorphed) {
            setLabelsMorphed(false);
            return;
        }
        const timer = setTimeout(() => setLabelsMorphed(true), 300);
        return () => clearTimeout(timer);
    }, [isMorphed]);

    useEffect(() => {
        if (!draftActions) {
            (globalThis as Record<string, unknown>).__radiabaseTabPressInterceptor = undefined;
            return;
        }
        // Cancel/Redraw slots are `disabled` triggers: the native bar
        // refuses the switch and emits tabPress, handled per-screen by
        // useDraftTabAction. Only the selected Map tab (= Save) needs the
        // interceptor, since re-tapping it dispatches a same-route jump.
        const actionByRoute: Record<string, () => void> = {
            index: draftActions.isSaving ? () => undefined : draftActions.onSave,
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
            <NativeTabs.Trigger name="dashboard" disabled={isMorphed}>
                <NativeTabs.Trigger.Icon sf={labelsMorphed ? 'xmark' : 'house.fill'} />
                <NativeTabs.Trigger.Label>{labelsMorphed ? 'Cancel' : 'Home'}</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="index">
                <NativeTabs.Trigger.Icon sf={labelsMorphed ? 'checkmark' : 'map.fill'} />
                <NativeTabs.Trigger.Label>{labelsMorphed ? 'Save area' : 'Map'}</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="myLeads" disabled={isMorphed}>
                <NativeTabs.Trigger.Icon sf={labelsMorphed ? 'arrow.triangle.2.circlepath' : 'person.2.fill'} />
                <NativeTabs.Trigger.Label>{labelsMorphed ? 'Redraw' : 'My Leads'}</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="myDeals" hidden={isCompactBar} disabled={isMorphed}>
                <NativeTabs.Trigger.Icon sf="doc.text.fill" />
                <NativeTabs.Trigger.Label>My Deals</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="profile" hidden={isCompactBar}>
                <NativeTabs.Trigger.Icon sf="person.crop.circle.fill" />
                <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}
