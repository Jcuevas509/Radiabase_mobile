import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ButtonProps {
    onPress: () => Promise<void> | void;
    text?: string;
    buttonStyle?: object;
    textStyle?: object;
    endIcon?: JSX.Element;
    startIcon?: JSX.Element;
    buttonIcon?: JSX.Element;
    isDisabled?: boolean;
    loadingColor?: string;
    isLoading?: boolean;
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
    startIcon,
    loadingColor = 'white',
    isLoading = false,
}: ButtonProps) {

    async function handlePress() {
        Haptics.selectionAsync().catch(() => null);
        onPress();
    }

    return (
        <TouchableOpacity
            disabled={isDisabled || isLoading}
            style={[styles.container, buttonStyle, isDisabled && styles.disabledButton]}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            {startIcon !== null && startIcon}
            {text && <Text style={[styles.text, textStyle]}>{text}</Text>}
            {endIcon !== null && endIcon}
            {isLoading && <ActivityIndicator size='small' color={loadingColor} style={{ marginLeft: 8 }} />}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
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
    disabledButton: {
        opacity: 0.3
    }
});
