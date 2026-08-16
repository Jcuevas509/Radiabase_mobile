import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { HomeSvg } from 'components/svg';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TopMenuProps {
    color?: 'white' | 'black';
    isOnDashboard?: boolean;
    onCloseMenu?: () => void;
}

/**
 * Overlay bar on the map, or the header inside the drawer.
 */
export function TopMenu({
    color = 'white',
    isOnDashboard = false,
    onCloseMenu,
}: TopMenuProps) {
    const router = useRouter();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const isDrawerHeader = color === 'black';
    const iconColor = isDrawerHeader ? '#18181B' : '#FFFFFF';

    const openDrawer = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    const closeDrawer = () => {
        if (onCloseMenu) {
            onCloseMenu();
            return;
        }
        navigation.dispatch(DrawerActions.closeDrawer());
    };

    return (
        <View
            style={[
                styles.bar,
                isDrawerHeader ? styles.drawerBar : styles.mapBar,
                { paddingTop: isDrawerHeader ? insets.top + 8 : insets.top + 6 },
            ]}
        >
            {isDrawerHeader ? (
                <>
                    <Text style={styles.drawerTitle}>Menu</Text>
                    <TouchableOpacity onPress={closeDrawer} hitSlop={12} style={styles.iconHit}>
                        <Ionicons name="close" size={28} color={iconColor} />
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <TouchableOpacity onPress={openDrawer} hitSlop={12} style={styles.iconHit}>
                        <MaterialIcons name="menu" size={30} color={iconColor} />
                    </TouchableOpacity>
                    <View style={styles.mapActions}>
                        {!isOnDashboard ? (
                            <TouchableOpacity
                                onPress={() => router.navigate('/dashboard')}
                                hitSlop={12}
                                style={styles.homeHit}
                            >
                                <HomeSvg color={iconColor} />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 20,
        paddingRight: 18,
        zIndex: 10,
    },
    mapBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingBottom: 8,
    },
    drawerBar: {
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E4E4E7',
    },
    drawerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#18181B',
    },
    iconHit: {
        minWidth: 44,
        minHeight: 44,
        justifyContent: 'center',
    },
    homeHit: {
        minWidth: 44,
        minHeight: 44,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    mapActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default TopMenu;
