import DrawerNavigator from '@/navigation/DrawerNavigator';
import { menuItemsAgent, menuItemsManager } from 'constants/menu-items';
import { useSession } from 'context/AuthenticationContext';

/** The drawer wraps only the tab shell; every other page lives in the
 * parent Stack so pushes animate natively and back always pops. */
export default function DrawerLayout() {
    const { session } = useSession();
    const isManager = session?.user?.role === 'manager';
    return <DrawerNavigator menuItems={isManager ? menuItemsManager : menuItemsAgent} />;
}
