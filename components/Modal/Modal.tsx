import React, { useEffect, useRef } from "react";
import { View, Modal, TouchableOpacity, StyleSheet, Text, ActivityIndicator, Animated, Easing, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface ModalProps {
    onClose: () => void;
    onDismiss?: () => void;
    customTitle?: React.ReactElement;
    children: React.ReactElement;
    buttons?: React.ReactElement;
    visible: boolean;
    title?: string;
    isLoading?: boolean;
    hasCloseButton?: boolean;
    hasButtonDivider?: boolean;
    /** Animated light-flow band along the sheet's top edge, matching the
     * home leaderboard's border sweep. */
    topAccent?: boolean;
    /** Trims the safe-area dead space under the buttons. */
    compactBottom?: boolean;
    animationType?: "none" | "slide" | "fade";
}

/** The leaderboard border sweep, flattened into the sheet's top edge: a
 * light highlight travelling along a near-black band. */
function TopFlowAccent() {
    const { width } = useWindowDimensions();
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const loop = Animated.loop(Animated.timing(anim, {
            toValue: 1,
            duration: 4500,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
        }));
        loop.start();
        return () => loop.stop();
    }, [anim]);
    const translateX = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [-180, width + 180],
    });
    return (
        <View style={styles.topAccent} pointerEvents="none">
            <Animated.View style={[styles.topAccentStreak, { transform: [{ translateX }] }]}>
                <LinearGradient
                    colors={["rgba(220, 220, 223, 0)", "#DCDCDF", "rgba(220, 220, 223, 0)"]}
                    locations={[0, 0.5, 1]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
}

export function PlainModal({ visible, customTitle, onClose, onDismiss, children, title, buttons, isLoading, hasCloseButton = true, hasButtonDivider = true, topAccent = false, compactBottom = false, animationType = 'slide' }: ModalProps) {
    const insets = useSafeAreaInsets();
    return (
        <Modal visible={visible} animationType={animationType} transparent={true} onDismiss={onDismiss}>
            <View style={styles.modalContainer}>
                <TouchableOpacity style={styles.dismissArea} onPress={onClose} />
                <View style={[styles.content, { paddingBottom: compactBottom ? 12 : insets.bottom }]}>
                    {topAccent && <TopFlowAccent />}
                    {/* Top Section */}
                    <View style={styles.top}>
                        {customTitle || <Text style={styles.title}>{title}</Text>}
                        {hasCloseButton && <TouchableOpacity onPress={onClose} style={styles.iconContainer} disabled={isLoading} hitSlop={8}>
                            <Ionicons name="close" size={20} color="black" />
                        </TouchableOpacity>}
                    </View>

                    {/* Overlay and Loading Indicator */}
                    {isLoading && (
                        <View style={styles.overlay}>
                            <ActivityIndicator size="large" color="#007AFF" />
                        </View>
                    )}

                    {/* Children Section */}
                    <View style={[styles.childrenContainer, isLoading && styles.hidden]}>
                        {children}
                    </View>

                    {/* Buttons Section */}
                    {buttons ? (
                        <View style={[styles.buttonContainer, !hasButtonDivider && styles.noDivider, isLoading && styles.hidden]}>
                            {buttons}
                        </View>
                    ) : null}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    dismissArea: {
        flex: 1,
    },
    content: {
        backgroundColor: "white",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: -2 },
        elevation: 5,
    },
    title: {
        color: "black",
        fontSize: 16,
        fontWeight: "600",
    },
    top: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    childrenContainer: {
        marginTop: 24,
        position: "relative",
    },
    iconContainer: {
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#D9D9D9",
        borderRadius: 16,
        width: 32,
        height: 32,
    },
    buttonContainer: {
        borderTopColor: "#E9E9E9",
        borderTopWidth: 0.5,
        // marginTop: 24,
        paddingTop: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        height: 63,
    },
    noDivider: {
        borderTopWidth: 0,
    },
    topAccent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#141416',
        zIndex: 40,
    },
    topAccentStreak: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 180,
    },
    overlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
        borderRadius: 12,
    },
    hidden: {
        opacity: 0.5,
    },
});
