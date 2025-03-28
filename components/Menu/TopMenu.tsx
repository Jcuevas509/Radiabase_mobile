import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { DashboardSvg, HomeSvg } from "components/svg";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useRouter, usePathname } from "expo-router";
interface TopMenuProps {
    color?: 'white' | 'black',
    isOnDashboard?: boolean;

}

export const TopMenu: React.FC<TopMenuProps> = ({
    color = 'white',
    isOnDashboard = false,
}) => {
    const router = useRouter()
    const isBlack = color === 'black';
    const navigation = useNavigation();
    const pathname = usePathname();
    const openDrawer = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    const closeDrawer = () => {
        // @ts-ignore
        router.replace(pathname);
    };

    const navigateToDashboard = () => {
        router.navigate('/dashboard');
    };

    const handlePress = () => {
        if (isBlack) {
            navigateToDashboard();
        } else {
            openDrawer();
        }
    };
    return (
        <View style={[
            styles.topMenuContainer,
            isBlack ? styles.topMenuContainerBlack : styles.topMenuContainerWhite
        ]}>
            <TouchableOpacity onPress={handlePress} style={styles.iconLeft}>
                {isBlack ? (
                    isOnDashboard ?
                        <></> :
                        <>
                            <DashboardSvg color={color} />
                            <Text style={[styles.text, { color: color }]}>
                                Back to Dashboard
                            </Text>
                        </>
                ) : (
                    <MaterialIcons name="menu" size={30} color="white" />
                )}
            </TouchableOpacity>
            <View style={styles.iconRight}>
                {isBlack ?
                    <TouchableOpacity onPress={closeDrawer}>
                        <AntDesign name="right" size={24} color="black" />
                    </TouchableOpacity>
                    : <HomeSvg color={color} />
                }
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    topMenuContainerWhite: {
        position: "absolute",
        top: 58,
        left: 0,
        right: 0,
    },
    topMenuContainerBlack: {
        paddingTop: 30,
        height: 120,
        alignItems: 'center',
    },
    topMenuContainer: {

        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingLeft: 26,
        paddingRight: 22,
        zIndex: 10,
    },
    iconLeft: {
        alignItems: "center",
        flexDirection: 'row',
        justifyContent: "center",
    },
    iconRight: {
        alignItems: "flex-end",
    },
    text: {
        fontWeight: 600,
        fontSize: 8,
        color: 'white',
        marginLeft: 4,
    }
});

export default TopMenu;