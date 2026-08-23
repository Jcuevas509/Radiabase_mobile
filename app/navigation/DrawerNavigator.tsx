import React from 'react';
import { Drawer, type DrawerContentComponentProps } from 'expo-router/drawer';
import { useRouter, usePathname } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import TopMenu from 'components/Menu/TopMenu';
import { DrawerHero } from 'components/Card/DrawerHero';
import { MenuItemProps } from 'types/componentsTypes';
import { useSession } from 'context/AuthenticationContext';
import { isActiveMenuRoute } from 'utils/is-active-menu-route';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);

interface DrawerNavigatorProps {
    menuItems: MenuItemProps[];
}

function CustomDrawerContent({
    menuItems,
    navigation,
}: DrawerContentComponentProps & { menuItems: MenuItemProps[] }) {
    const { signOut, session } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const isOnDashboard = pathname === '/dashboard';

    const closeDrawer = () => {
        navigation.closeDrawer();
    };

    const handleNavigate = (route: string) => {
        closeDrawer();
        if (!isActiveMenuRoute(pathname, route)) {
            router.push(route as never);
        }
    };

    return (
        <View style={styles.drawerContent}>
            <TopMenu color="black" isOnDashboard={isOnDashboard} onCloseMenu={closeDrawer} />
            <View style={styles.agentContainer}>
                <DrawerHero
                    firstName={session?.user?.firstName ?? ''}
                    lastName={session?.user?.lastName ?? ''}
                    roleLabel={session?.user?.roleLabel ?? session?.user?.role ?? null}
                    officeName={session?.user?.officeName ?? null}
                />
            </View>
            <View style={styles.menuList}>
                {menuItems.map((item) => {
                    const isActive = isActiveMenuRoute(pathname, item.route);
                    return (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.drawerItem, isActive && styles.drawerItemActive]}
                            onPress={() => handleNavigate(item.route)}
                        >
                            <View style={styles.itemIcon}>
                                {item.icon
                                    ? React.createElement(item.icon, {
                                          color: isActive ? '#18181B' : '#3F3F46',
                                          width: 22,
                                          height: 22,
                                      })
                                    : null}
                            </View>
                            <Text style={[styles.drawerItemText, isActive && styles.drawerItemTextActive]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <View style={styles.footer}>
                <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Log out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const DrawerNavigator = ({ menuItems }: DrawerNavigatorProps) => {
    const { session } = useSession();
    // The drawer is the manager admin-tools menu; standard reps navigate
    // with the bottom tabs and the header Messages button instead.
    const isManager = session?.user?.role === 'manager';
    return (
        <Drawer
            // Back returns to the previously visited screen (e.g. Profile ->
            // settings pages -> back), not the drawer's first route (the map).
            backBehavior="history"
            screenOptions={{
                headerShown: false,
                drawerType: 'front',
                swipeEnabled: isManager,
                drawerStyle: {
                    width: DRAWER_WIDTH,
                    backgroundColor: '#FFFFFF',
                },
                overlayColor: 'rgba(0,0,0,0.4)',
            }}
            drawerContent={(props) => (
                <CustomDrawerContent {...props} menuItems={menuItems} />
            )}
        >
            <Drawer.Screen name="(tabs)" options={{ drawerLabel: 'Home' }} />
            <Drawer.Screen name="myLocation" options={{ drawerLabel: 'My location' }} />
        </Drawer>
    );
};

const styles = StyleSheet.create({
    drawerContent: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    agentContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        borderBottomColor: '#E4E4E7',
        borderBottomWidth: 1,
    },
    menuList: {
        flex: 1,
        paddingTop: 8,
    },
    drawerItem: {
        minHeight: 52,
        marginHorizontal: 12,
        paddingHorizontal: 12,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    drawerItemActive: {
        backgroundColor: '#F4F4F5',
    },
    drawerItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3F3F46',
        marginLeft: 14,
    },
    drawerItemTextActive: {
        color: '#18181B',
    },
    itemIcon: {
        width: 28,
        alignItems: 'center',
    },
    footer: {
        borderTopColor: '#E4E4E7',
        borderTopWidth: 1,
    },
    logoutButton: {
        minHeight: 52,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#B42318',
    },
});

export default DrawerNavigator;
