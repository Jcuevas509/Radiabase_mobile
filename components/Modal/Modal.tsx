import React from "react";
import { View, Modal, TouchableOpacity, StyleSheet, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface ModalProps {
    onClose: () => void;
    customTitle?: JSX.Element;
    children: JSX.Element;
    buttons: JSX.Element;
    visible: boolean;
    title?: string;
    isLoading?: boolean;
    hasCloseButton?: boolean;
    animationType?: "none" | "slide" | "fade";
}

export function PlainModal({ visible, customTitle, onClose, children, title, buttons, isLoading, hasCloseButton = true, animationType = 'slide' }: ModalProps) {
    const insets = useSafeAreaInsets();
    return (
        <Modal visible={visible} animationType={animationType} transparent={true}>
            <View style={styles.modalContainer}>
                <TouchableOpacity style={styles.dismissArea} onPress={onClose} />
                <View style={[styles.content, { paddingBottom: insets.bottom }]}>
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
                    <View style={[styles.buttonContainer, isLoading && styles.hidden]}>
                        {buttons}
                    </View>
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
    overlay: {
        ...StyleSheet.absoluteFillObject,
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