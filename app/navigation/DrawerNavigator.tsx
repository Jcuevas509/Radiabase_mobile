import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useRouter, usePathname } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import TopMenu from 'components/Menu/TopMenu';
import { AgentCard } from 'components/Card/AgentCard';
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
                <AgentCard
                    fromMenu={true}
                    data={{
                        id: Number(session?.user?.id ?? 0),
                        name: session?.user?.firstName ?? '',
                        lastname: session?.user?.lastName ?? '',
                        description: session?.user?.roleLabel ?? session?.user?.role ?? '',
                        salesRole: session?.user?.roleLabel ?? null,
                        officeName: session?.user?.officeName ?? null,
                        structureName: session?.user?.structureName ?? null,
                        color: '#32A0FF',
                    }}
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
    return (
        <Drawer
            screenOptions={{
                headerShown: false,
                drawerType: 'front',
                swipeEnabled: true,
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
            <Drawer.Screen name="index" options={{ drawerLabel: 'Field map' }} />
            <Drawer.Screen name="dashboard" options={{ drawerLabel: 'Home' }} />
            <Drawer.Screen name="myLocation" options={{ drawerLabel: 'My location' }} />
            <Drawer.Screen name="profile" options={{ drawerLabel: 'Profile' }} />
            <Drawer.Screen name="settings" options={{ drawerLabel: 'Settings' }} />
        </Drawer>
    );
};

const styles = StyleSheet.create({
    drawerContent: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    agentContainer: {
        paddingLeft: 20,
        paddingRight: 16,
        paddingTop: 16,
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
        borderRadius: 10,
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
