import DrawerNavigator from '@/navigation/DrawerNavigator';
import { StatusBar } from 'expo-status-bar';
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
        </>
    );
}
