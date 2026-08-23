import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SettingsCard, SettingsShell } from 'components/screens/Settings/SettingsShell';
import { fetchGearCatalog } from 'services/manager-api';
import type { GearItem } from 'types/manager.types';

const CATEGORY_ORDER: ReadonlyArray<GearItem['category']> = ['Apparel', 'Field kit', 'Print'];

const CATEGORY_ICONS: Record<GearItem['category'], keyof typeof Ionicons.glyphMap> = {
    Apparel: 'shirt-outline',
    'Field kit': 'briefcase-outline',
    Print: 'print-outline',
};

export default function ShopGearScreen() {
    const [items, setItems] = useState<readonly GearItem[] | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetchGearCatalog({ signal: controller.signal })
            .then(setItems)
            .catch(() => undefined);
        return () => controller.abort();
    }, []);

    const handleOrder = (item: GearItem) => {
        // Seam: POST /gear/orders (or an external store link) when real.
        Alert.alert('Order gear', `${item.name} — ordering opens with the backend hookup.`);
    };

    if (!items) {
        return (
            <SettingsShell title="Shop Gear">
                <ActivityIndicator style={styles.loading} color="#18181B" />
            </SettingsShell>
        );
    }

    return (
        <SettingsShell title="Shop Gear">
            {CATEGORY_ORDER.map((category) => {
                const categoryItems = items.filter((item) => item.category === category);
                if (categoryItems.length === 0) {
                    return null;
                }
                return (
                    <SettingsCard key={category} header={category}>
                        {categoryItems.map((item, index) => (
                            <Pressable
                                key={item.id}
                                accessibilityRole="button"
                                accessibilityLabel={`Order ${item.name}`}
                                disabled={!item.inStock}
                                onPress={() => handleOrder(item)}
                                style={({ pressed }) => [styles.row, index > 0 && styles.divider, pressed && styles.pressed]}
                            >
                                <View style={styles.itemIcon}>
                                    <Ionicons name={CATEGORY_ICONS[category]} size={17} color="#18181B" />
                                </View>
                                <View style={styles.body}>
                                    <Text style={styles.name}>{item.name}</Text>
                                    {!item.inStock ? (
                                        <Text style={styles.outOfStock}>Out of stock</Text>
                                    ) : null}
                                </View>
                                <Text style={[styles.price, !item.inStock && styles.priceMuted]}>
                                    ${item.priceUsd}
                                </Text>
                            </Pressable>
                        ))}
                    </SettingsCard>
                );
            })}
        </SettingsShell>
    );
}

const styles = StyleSheet.create({
    loading: {
        marginTop: 48,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 11,
    },
    divider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E4E4E7',
    },
    pressed: {
        opacity: 0.6,
    },
    itemIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F4F4F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: {
        flex: 1,
        gap: 1,
    },
    name: {
        fontSize: 15,
        fontWeight: '600',
        color: '#18181B',
    },
    outOfStock: {
        fontSize: 11,
        fontWeight: '700',
        color: '#DC2626',
    },
    price: {
        fontSize: 15,
        fontWeight: '800',
        color: '#18181B',
    },
    priceMuted: {
        color: '#A1A1AA',
    },
});
