import DrawerNavigator from '@/navigation/DrawerNavigator';
import { menuItemsAgent, menuItemsManager } from 'constants/menu-items';
import { useSession } from 'context/AuthenticationContext';

export default function Layout() {
    const { session } = useSession()
    const isManager = session?.user?.role === 'manager';
    return (
        <DrawerNavigator menuItems={isManager ? menuItemsManager : menuItemsAgent} />
    );
}
