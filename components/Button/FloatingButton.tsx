import { Pressable, Text, StyleSheet, StyleSheet as RN, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';
import { GlassSurface } from 'components/GlassSurface';

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
 * Map floating button on native Liquid Glass. A `backgroundColor` passed in
 * `buttonStyle` (the existing active-state contract) becomes the glass tint
 * so callers didn't have to change; white/undefined means untinted glass.
 * No opacity press feedback — that breaks the glass material; the native
 * interactive shimmer plus haptics carry the press.
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
    const { backgroundColor, ...restStyle } = RN.flatten([buttonStyle]) as ViewStyle;
    const tintColor = backgroundColor && backgroundColor !== 'white' && backgroundColor !== '#FFFFFF'
        ? String(backgroundColor)
        : undefined;
    return (
        <GlassSurface
            isInteractive
            tintColor={tintColor}
            style={[styles.container, restStyle]}
            fallbackStyle={styles.fallback}
        >
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                accessibilityState={{ disabled: isDisabled }}
                disabled={isDisabled}
                style={styles.press}
                onPress={handlePress}
            >
                {buttonIcon}
                {text && <Text style={[styles.text, textStyle]}>{text}</Text>}
            </Pressable>
        </GlassSurface>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        width: 48,
        height: 48,
        overflow: 'hidden',
    },
    fallback: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
    },
    press: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: 'black'
    },
});
