import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ButtonProps {
    onPress: () => void;
    text?: string;
    buttonStyle?: object;
    textStyle?: object;
    endIcon?: JSX.Element;
    startIcon?: JSX.Element;
    buttonIcon?: JSX.Element;
    isDisabled?: boolean;
}

/**
 * @description A button component that can be used as general button 
 */

export function Button({
    onPress,
    text,
    buttonStyle,
    textStyle,
    isDisabled = false,
    endIcon,
    startIcon
}: ButtonProps) {
    function handlePress() {
        Haptics.selectionAsync().catch(() => null);
        onPress();
    }
    return (
        <TouchableOpacity
            disabled={isDisabled}
            style={[styles.container, buttonStyle]}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            {startIcon !== null && startIcon}
            {text && <Text style={[styles.text, textStyle]}>{text}</Text>}
            {endIcon !== null && endIcon}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        minWidth: 100,
        height: 38
    },
    text: {
        color: 'black',
        fontSize: 12,
        fontWeight: 600
    },
});
