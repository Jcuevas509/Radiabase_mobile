import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AdminMenuSheet } from 'components/Menu/AdminMenuSheet';

/**
 * Native stack over the tab shell: manager, messages, and settings pages
 * push with the system slide transition and pop back to exactly the
 * previous screen. The admin menu is a bottom sheet (no drawer layer).
 */
export default function Layout() {
    return (
        <>
            {/* Login sets a light status bar for its dark hero; reset to
                dark icons for the app's light screens. */}
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
            </Stack>
            {/* The admin menu presents as a native bottom sheet, not the drawer. */}
            <AdminMenuSheet />
        </>
    );
}
