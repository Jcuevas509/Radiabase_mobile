import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from 'components/Button/Button';
import { FloatingButton } from 'components/Button/FloatingButton';
import { Ionicons } from '@expo/vector-icons';
import { DrawSvg } from 'components/svg';
interface ButtonConfig {
    icon: React.ReactElement;
    onPress: () => void;
    style?: object;
    accessibilityLabel: string;
}

interface FloatingButtonsProps {
    buttons: ButtonConfig[];
    canFinishArea?: boolean;
    onFinish?: () => void;
    activeDrawing?: boolean;
    onToggleDrawing?: () => void;
    isManager: boolean;
}

const FloatingButtons: React.FC<FloatingButtonsProps> = ({
    buttons,
    canFinishArea = false,
    onFinish,
    activeDrawing = false,
    onToggleDrawing,
    isManager,
}) => {
    return (
        <>
            <View style={styles.floatingButtonsContainer} pointerEvents="box-none">
                {canFinishArea && isManager && onFinish && (
                    <Button
                        text='Complete'
                        onPress={onFinish}
                        buttonStyle={styles.completeButtonStyle}
                        textStyle={styles.buttonTextStyle}
                        startIcon={<Ionicons name="checkmark-circle-outline" size={24} color="black" />}
                    />
                )}
                {isManager && onToggleDrawing && <View style={styles.buttonContainer}>
                    <FloatingButton
                        buttonStyle={{ backgroundColor: '#00D1EA' }}
                        onPress={onToggleDrawing}
                        buttonIcon={<DrawSvg color="white" />}
                        accessibilityLabel={activeDrawing ? 'Cancel area painting' : 'Paint a new area'}
                    />
                </View>}
                {buttons?.map((btn, index) => (
                    <View style={styles.buttonContainer} key={index}>
                        <FloatingButton
                            onPress={btn.onPress}
                            buttonIcon={btn.icon}
                            buttonStyle={btn.style}
                            accessibilityLabel={btn.accessibilityLabel}
                        />
                    </View>
                ))}
            </View>
        </>
    );
};
const styles = StyleSheet.create({
    button: {
        backgroundColor: '#7243FF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    buttonText: {
        color: 'white',
        fontWeight: '500',
    },

    completeButtonStyle: {
        backgroundColor: 'white',
        borderRadius: 16,
        paddingVertical: 6,
        height: 34,
        width: 113,
        marginBottom: 24
    },
    buttonTextStyle: {
        marginLeft: 4
    },
    floatingButtonsContainer: {
        flexDirection: 'column',
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 20,
        zIndex: 10,
        alignItems: 'flex-end',
        // Vertically centered on the right edge, clear of the tab bar.
        justifyContent: 'center',
    },
    buttonContainer: {
        marginBottom: 18,
        alignItems: 'flex-end',
    },
});

export default FloatingButtons;
