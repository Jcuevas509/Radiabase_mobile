import DrawerNavigator from '@/navigation/DrawerNavigator';
import { StatusBar } from 'expo-status-bar';
import { AdminMenuSheet } from 'components/Menu/AdminMenuSheet';
import { menuItemsAgent, menuItemsManager } from 'constants/menu-items';
import { useSession } from 'context/AuthenticationContext';

export default function Layout() {
    const { session } = useSession()
    const isManager = session?.user?.role === 'manager';
    return (
        <>
            {/* Login sets a light status bar for its dark hero; reset to
                dark icons for the app's light screens. */}
            <StatusBar style="dark" />
            <DrawerNavigator menuItems={isManager ? menuItemsManager : menuItemsAgent} />
            {/* The admin menu presents as a native bottom sheet, not the drawer. */}
            <AdminMenuSheet />
        </>
    );
}
