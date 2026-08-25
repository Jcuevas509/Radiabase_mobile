import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { GlassSurface } from 'components/GlassSurface';

/**
 * Circular header button on bare native glass — the nav-bar recipe: clear
 * adaptive material, no background or shadow painted on the glass node.
 */
export function GlassCircleButton({
    icon,
    accessibilityLabel,
    onPress,
    size = 40,
    iconSize = 22,
}: {
    readonly icon: keyof typeof Ionicons.glyphMap;
    readonly accessibilityLabel: string;
    readonly onPress: () => void;
    readonly size?: number;
    readonly iconSize?: number;
}) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            hitSlop={8}
            onPress={onPress}
            style={({ pressed }) => [pressed && styles.pressed]}
        >
            <GlassSurface
                glassEffectStyle="clear"
                isInteractive
                style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
                fallbackStyle={styles.fallback}
            >
                <Ionicons name={icon} size={iconSize} color="#18181B" />
            </GlassSurface>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    pressed: {
        opacity: 0.7,
    },
    circle: {
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fallback: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
});
