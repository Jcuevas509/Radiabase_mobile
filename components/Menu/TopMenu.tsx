import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { DashboardSvg, HomeSvg } from "components/svg";

interface TopMenuProps { }

export function TopMenu() {
    return (
        <View style={styles.topMenuContainer}>
            <View style={styles.iconLeft}>
                <DashboardSvg />
                <Text style={styles.text}>
                    Back to Dashboard
                </Text>
            </View>
            <View style={styles.iconRight}>
                <HomeSvg />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    topMenuContainer: {
        position: "absolute",  // Postavlja preko mape
        top: 58,               // Razmak od vrha ekrana
        left: 0,
        right: 0,
        flexDirection: "row",  // Postavlja ikone u red
        justifyContent: "space-between", // Razmješta ih u lijevi i desni ugao
        alignItems: "center",
        paddingLeft: 26, // Padding sa lijeve i desne strane
        paddingRight: 22,
        zIndex: 10,            // Osigurava da je iznad mape
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