import React, { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import {
    Animated,
    Easing,
    Modal,
    PanResponder,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerHero } from 'components/Card/DrawerHero';
import { menuItemsAgent, menuItemsManager } from 'constants/menu-items';
import { useSession } from 'context/AuthenticationContext';
import { useMenuSheetStore } from 'store/MenuSheetStore';
import { isActiveMenuRoute } from 'utils/is-active-menu-route';

/**
 * The admin-tools menu as a short bottom sheet. Its top ridge stops below
 * the Home header's white content-sheet ridge so the layers stack: teal
 * band, white sheet curve, then this sheet's curve. Slide-up spring in,
 * drag-down or scrim tap to dismiss.
 */

/** Exactly the Home content sheet's ridge: band paddingTop (insets.top + 6)
 * + 44pt identity row + 40pt band paddingBottom − 26pt sheet overlap. The
 * menu's 26pt ridge lands on the same line, blending into the same curve. */
const SHEET_TOP_BELOW_INSET = 64;

export function AdminMenuSheet() {
    const isOpen = useMenuSheetStore((state) => state.isOpen);
    const close = useMenuSheetStore((state) => state.close);
    const { signOut, session } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const { height: windowHeight } = useWindowDimensions();
    const isManager = session?.user?.role === 'manager';
    const menuItems = isManager ? menuItemsManager : menuItemsAgent;

    const sheetHeight = windowHeight - (insets.top + SHEET_TOP_BELOW_INSET);
    const [isMounted, setIsMounted] = useState(false);
    const progress = useRef(new Animated.Value(0)).current;
    const dragY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            dragY.setValue(0);
            Animated.spring(progress, {
                toValue: 1,
                useNativeDriver: true,
                friction: 10,
                tension: 70,
            }).start();
        } else {
            Animated.timing(progress, {
                toValue: 0,
                duration: 230,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished) {
                    setIsMounted(false);
                }
            });
        }
    }, [isOpen, progress, dragY]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_event, gesture) =>
                gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
            onPanResponderMove: (_event, gesture) => {
                dragY.setValue(Math.max(0, gesture.dy));
            },
            onPanResponderRelease: (_event, gesture) => {
                if (gesture.dy > 120 || gesture.vy > 0.8) {
                    useMenuSheetStore.getState().close();
                } else {
                    Animated.spring(dragY, { toValue: 0, useNativeDriver: true, friction: 9 }).start();
                }
            },
        }),
    ).current;

    const translateY = Animated.add(
        progress.interpolate({ inputRange: [0, 1], outputRange: [sheetHeight, 0] }),
        dragY.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolateLeft: 'clamp' }),
    );

    const handleNavigate = (route: string) => {
        close();
        if (!isActiveMenuRoute(pathname, route)) {
            router.push(route as never);
        }
    };

    const handleSignOut = () => {
        close();
        signOut();
    };

    if (!isMounted) {
        return null;
    }

    return (
        <Modal
            visible
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={close}
        >
            <Animated.View style={[styles.scrim, { opacity: progress }]}>
                <Pressable accessibilityLabel="Close menu" style={StyleSheet.absoluteFill} onPress={close} />
            </Animated.View>
            <Animated.View
                style={[
                    styles.sheet,
                    { height: sheetHeight, transform: [{ translateY }] },
                ]}
            >
                <View {...panResponder.panHandlers}>
                    <View style={styles.grabber} />
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Menu</Text>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Close menu"
                            hitSlop={10}
                            onPress={close}
                            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
                        >
                            <Ionicons name="close" size={20} color="#18181B" />
                        </Pressable>
                    </View>
                </View>
                <ScrollView contentContainerStyle={styles.content} bounces={false}>
                    <View style={styles.heroBlock}>
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
                                    style={[styles.menuItem, isActive && styles.menuItemActive]}
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
                                    <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>
                <View style={[styles.footer, { paddingBottom: insets.bottom + 6 }]}>
                    <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
                        <Text style={styles.logoutText}>Log out</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    scrim: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        overflow: 'hidden',
    },
    grabber: {
        alignSelf: 'center',
        width: 38,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#D9D9DE',
        marginTop: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 22,
        paddingRight: 16,
        paddingTop: 8,
        paddingBottom: 6,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F4F4F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pressed: {
        opacity: 0.7,
    },
    content: {
        paddingBottom: 12,
    },
    heroBlock: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 16,
        borderBottomColor: '#E4E4E7',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    menuList: {
        paddingTop: 8,
    },
    menuItem: {
        minHeight: 52,
        marginHorizontal: 12,
        paddingHorizontal: 12,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemActive: {
        backgroundColor: '#F4F4F5',
    },
    itemIcon: {
        width: 28,
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3F3F46',
        marginLeft: 14,
    },
    menuItemTextActive: {
        color: '#18181B',
    },
    footer: {
        borderTopColor: '#E4E4E7',
        borderTopWidth: StyleSheet.hairlineWidth,
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
