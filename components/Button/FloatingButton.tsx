import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';

interface MyButtonProps {
    onPress: () => void;
    text?: string;
    buttonStyle?: object;
    textStyle?: object;
    buttonIcon?: ReactElement;
    isDisabled?: boolean;
    accessibilityLabel?: string;
}

/**
 * @description A button component that can be used as map floating button 
 */

export function FloatingButton({
    onPress,
    text,
    buttonStyle,
    buttonIcon,
    textStyle,
    isDisabled = false,
    accessibilityLabel,
}: MyButtonProps) {
    function handlePress() {
        Haptics.selectionAsync().catch(() => null);
        onPress();
    }
    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ disabled: isDisabled }}
            disabled={isDisabled}
            style={[styles.container, buttonStyle]}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            {buttonIcon}
            {text && <Text style={[styles.text, textStyle]}>{text}</Text>}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 24,
        width: 48,
        height: 48
    },
    text: {
        color: 'black'
    },
});
