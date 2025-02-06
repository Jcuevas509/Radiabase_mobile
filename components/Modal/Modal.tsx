import React from "react";
import { View, Modal, TouchableOpacity, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
interface ModalProps {
    onClose: () => void;
    children: JSX.Element;
    buttons: JSX.Element;
    visible: boolean;
    title: string;
}

export function PlainModal({ visible, onClose, children, title, buttons }: ModalProps) {
    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <SafeAreaView style={styles.container}>
                <View
                    style={styles.content}
                >
                    <View style={styles.top}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.iconContainer}>
                            <Ionicons name="close" size={18} color="black" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.childrenContainer}>
                        {children}
                    </View>
                    <View style={styles.buttonContainer}>
                        {buttons}
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.5)"
    },
    content: {
        width: "100%",
        minHeight: 300,
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
        color: 'black',
        fontSize: 16,
        fontWeight: 600
    },
    top: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    childrenContainer: {
        marginTop: 24,
    },
    iconContainer: {
        alignSelf: "flex-end",
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#D9D9D9',
        borderRadius: 12,
        width: 24,
        height: 24,
    },
    buttonContainer: {
        borderTopColor: '#E9E9E9',
        borderTopWidth: 0.5,
        marginTop: 24,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 63
    }
});
