import { useState } from 'react';
import { Keyboard, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GlassSurface } from 'components/GlassSurface';

type MapSearchBarProps = {
    /** Resolves the query and moves the map; return true to collapse the bar. */
    readonly onSearch: (query: string) => Promise<boolean>;
};

/**
 * Top-right glass search control, vertically aligned with the compass.
 * Renders as a circular search button that expands into a full-width
 * glass bar when pressed.
 */
export function MapSearchBar({ onSearch }: MapSearchBarProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const collapse = () => {
        setIsExpanded(false);
        setQuery('');
        Keyboard.dismiss();
    };

    const submit = async () => {
        const trimmed = query.trim();
        if (!trimmed || isSearching) {
            return;
        }
        setIsSearching(true);
        try {
            if (await onSearch(trimmed)) {
                collapse();
            }
        } finally {
            setIsSearching(false);
        }
    };

    if (!isExpanded) {
        return (
            <GlassSurface isInteractive style={styles.circle} fallbackStyle={styles.fallback}>
                <TouchableOpacity
                    style={styles.circlePress}
                    onPress={() => {
                        Haptics.selectionAsync().catch(() => null);
                        setIsExpanded(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Search for an address"
                >
                    <FontAwesome6 name="magnifying-glass" size={19} color="#FFFFFF" />
                </TouchableOpacity>
            </GlassSurface>
        );
    }

    return (
        <GlassSurface style={styles.bar} fallbackStyle={styles.fallback}>
            <FontAwesome6 name="magnifying-glass" size={16} color="#FFFFFF" style={styles.barIcon} />
            <TextInput
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                placeholder="Search address or place"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                selectionColor="#FFFFFF"
                autoFocus
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={() => void submit()}
                accessibilityLabel="Address search input"
            />
            <TouchableOpacity
                onPress={collapse}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close search"
            >
                <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
        </GlassSurface>
    );
}

// Compass sits at top 112 with a 58pt diameter; center this 48pt control
// on the same axis: 112 + 29 - 24 = 117.
const SEARCH_TOP = 117;

const styles = StyleSheet.create({
    circle: {
        position: 'absolute',
        top: SEARCH_TOP,
        right: 18,
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
        zIndex: 30,
    },
    circlePress: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bar: {
        position: 'absolute',
        top: SEARCH_TOP,
        left: 18,
        right: 18,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        zIndex: 30,
    },
    barIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#FFFFFF',
        paddingVertical: 0,
    },
    fallback: {
        backgroundColor: 'rgba(24, 24, 27, 0.6)',
    },
});
