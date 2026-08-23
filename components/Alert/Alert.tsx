import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Text, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'components/Button/Button';
interface AlertProps {
    type?: 'success' | 'error' | 'warning' | 'confirm';
    message: string;
    subtitle?: string;
    onConfirm?: () => void;
    onDismiss: () => void;
    visible: boolean;
    isLoading?: boolean;
}

export function CustomAlert({
    type = 'success',
    message,
    subtitle,
    onDismiss,
    onConfirm,
    visible,
    isLoading
}: AlertProps) {
    const insets = useSafeAreaInsets();
    const onClose = () => {
        if (onDismiss) {
            onDismiss();
        }
    };
    return (
        <Modal visible={visible} animationType="fade" transparent={true}>
            <View style={styles.modalContainer}>
                <TouchableOpacity onPress={onClose} />
                <View style={[styles.content]}>
                    <View style={styles.top}>
                        <Text style={styles.title}>{message}</Text>
                    </View>
                    {isLoading && (
                        <View style={styles.overlay}>
                            <ActivityIndicator size="large" color="#007AFF" />
                        </View>
                    )}
                    <View style={[styles.buttonContainer, isLoading && styles.hidden]}>
                        {type === 'confirm' &&
                            <Button
                                text='Undo'
                                textStyle={{ color: '#CA0105' }}
                                onPress={onClose}
                            />}
                        <Button
                            onPress={() => { type === 'confirm' && onConfirm ? onConfirm() : onClose() }}
                            text='Okay'
                            textStyle={styles.buttonText}
                            buttonStyle={styles.button}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    content: {
        width: 322,
        minHeight: 120,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
    },
    top: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginVertical: 10,
    },
    iconContainer: {
        padding: 5,
    },
    overlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    childrenContainer: {
        marginBottom: 20,
    },
    buttonContainer: {
        borderTopColor: "#E9E9E9",
        borderTopWidth: 0.5,
        paddingTop: 12,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    hidden: {
        opacity: 0.5,
    },
    buttonText: {
        fontSize: 12,
        fontWeight: 600,
        color: 'white'
    },
    button: {
        minWidth: 150,
        backgroundColor: '#32A0FF'
    }
});
