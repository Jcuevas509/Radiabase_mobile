import type { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

const hasLiquidGlass = isLiquidGlassAvailable();
if (__DEV__) {
    console.log(`[GlassSurface] isLiquidGlassAvailable=${hasLiquidGlass}`);
}

/**
 * True native Liquid Glass (UIGlassEffect, iOS 26+) with a frosted-blur
 * fallback for Android and older iOS. Pass the shape/layout in `style`
 * with no background; `fallbackStyle` adds the wash the blur path needs
 * because it has no material of its own.
 */
export function GlassSurface({
    style,
    fallbackStyle,
    isInteractive = false,
    tintColor,
    colorScheme = 'auto',
    glassEffectStyle = 'regular',
    children,
}: {
    readonly style?: StyleProp<ViewStyle>;
    readonly fallbackStyle?: StyleProp<ViewStyle>;
    readonly isInteractive?: boolean;
    /** Hue for the glass (kept translucent); the fallback paints it as a wash. */
    readonly tintColor?: string;
    /** Force the light/dark glass variant — 'light' keeps a panel luminous
     * over dark content, matching how system bars render. */
    readonly colorScheme?: 'auto' | 'light' | 'dark';
    /** 'clear' is the highly translucent variant system bars use. */
    readonly glassEffectStyle?: 'regular' | 'clear';
    readonly children?: ReactNode;
}) {
    if (hasLiquidGlass) {
        return (
            <GlassView
                glassEffectStyle={glassEffectStyle}
                isInteractive={isInteractive}
                tintColor={tintColor}
                colorScheme={colorScheme}
                style={style}
            >
                {children}
            </GlassView>
        );
    }
    return (
        <BlurView
            intensity={85}
            tint="extraLight"
            style={[style, fallbackStyle, tintColor ? { backgroundColor: tintColor } : null]}
        >
            {children}
        </BlurView>
    );
}

export default GlassSurface;
