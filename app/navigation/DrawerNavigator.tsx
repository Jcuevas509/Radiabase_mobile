import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { useRouter, usePathname } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import TopMenu from 'components/Menu/TopMenu';
import { AgentCard } from 'components/Card/AgentCard';
import { FlatList } from 'react-native-gesture-handler';
import { MenuItemProps } from 'types/componentsTypes';
import { menuItemsManager } from 'constants/dataExample';
import LogoImage from 'components/LogoImage/LogoImage';
import { Button } from 'components/Button/Button';
import { useSession } from 'context/AuthenticationContext';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DrawerNavigatorProps {
    menuItems: MenuItemProps[]
}


const CustomDrawerContent = ({
    menuItems
}: DrawerNavigatorProps) => {
    const { signOut } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const isOnDashboard = pathname === '/dashboard';
    const renderItem = ({ item }: { item: MenuItemProps }) => (
        <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => router.push(item.route as any)}
        >
            <View style={styles.itemContainer}>
                <View style={{ width: 30 }}>
                    {item.icon && React.createElement(item.icon)}
                </View>
                <View>
                    <Text style={styles.drawerItemText}>{item.label}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View
            style={styles.drawerContent}>
            <TopMenu color='black' isOnDashboard={isOnDashboard} />
            <View style={styles.agentContainer}>
                <AgentCard
                    fromMenu={true}
                    data={{
                        id: 1,
                        name: "John",
                        lastname: "Doe",
                        description: "Sales Representative",
                        color: "#FF5733",
                    }}
                    onSendCard={() => console.log('send')}
                />
            </View>
            <FlatList
                data={menuItems}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={styles.drawerContentContainer}
            />
            <View style={[styles.agentContainer, styles.logoutContainer]}>
                <Button
                    textStyle={{ color: 'black', fontSize: 18 }}
                    text='Log Out'
                    onPress={signOut}
                    buttonStyle={{ backgroundColor: 'white', marginBottom: 10, height: 'auto' }}
                />
            </View>
            <LogoImage />
        </View>
    );
};

const DrawerNavigator = ({
    menuItems
}: DrawerNavigatorProps) => {
    return (
        <Drawer
            screenOptions={{
                headerShown: false,
                drawerType: 'front',
                swipeEdgeWidth: 400,
                drawerStyle: {
                    width: SCREEN_WIDTH,
                    backgroundColor: 'white',
                },
                overlayColor: 'transparent',
            }}
            drawerContent={() => <CustomDrawerContent
                menuItems={menuItems}
            />}
        >
            {/* <Drawer.Screen name="signIn" options={{ drawerLabel: 'Profile' }} /> */}

            <Drawer.Screen name="index" options={{ drawerLabel: 'Home' }} />
            <Drawer.Screen name="profile" options={{ drawerLabel: 'Profile' }} />
            <Drawer.Screen name="settings" options={{ drawerLabel: 'Settings' }} />
            <Drawer.Screen name="dashboard" />
        </Drawer>
    );
};

const styles = StyleSheet.create({
    drawerContent: {
        flex: 1,
        backgroundColor: 'white',
        width: '100%',
    },
    agentContainer: {
        paddingLeft: 24,
        paddingRight: 10,
        borderBottomColor: '#D9D9D9',
        borderBottomWidth: 1,
    },
    drawerContentContainer: {
        flexGrow: 0
    },
    drawerItem: {
        height: 60,
        paddingHorizontal: 24,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center'
    },
    drawerItemText: {
        fontSize: 18,
        fontWeight: 600,
        color: 'black',
        marginLeft: 24
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    logoutContainer: {
        borderTopColor: '#D9D9D9',
        borderTopWidth: 1,
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 4,
        paddingTop: 6,
        paddingRight: 10,
        borderBottomColor: '#D9D9D9',
        borderBottomWidth: 1,
    }
});

export default DrawerNavigator;