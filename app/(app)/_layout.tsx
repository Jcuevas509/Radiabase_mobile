import DrawerNavigator from '@/navigation/DrawerNavigator';
import { menuItemsAgent, menuItemsManager } from 'constants/menu-items';
import { useSession } from 'context/AuthenticationContext';
import { BottomNavigation } from 'components/Menu/BottomNavigation';
import { StyleSheet, View } from 'react-native';

export default function Layout() {
    const { session } = useSession()
    const isManager = session?.user?.role === 'manager';
    return (
        <View style={styles.container}>
            <View style={styles.navigator}>
                <DrawerNavigator menuItems={isManager ? menuItemsManager : menuItemsAgent} />
            </View>
            <BottomNavigation />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    navigator: {
        flex: 1,
    },
});
