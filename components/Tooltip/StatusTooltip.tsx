import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { customerStatuses, leadStatuses } from 'constants/leadStatuses';

interface TooltipProps {
    onClose: () => void;
}

/**
 * @description A component that shows tooltip with status details
 */
export function StatusTooltip({
    onClose
}: TooltipProps) {
    return (
        <View style={styles.overlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss status overview" />
            <View style={styles.tooltipContent}>
                <View style={styles.top}>
                    <Text style={styles.title}>Status Overview</Text>
                    <TouchableOpacity onPress={onClose} style={styles.iconContainer} hitSlop={12} accessibilityLabel="Close status overview">
                        <Ionicons name="close" size={22} color="black" />
                    </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.tooltipSubtitle}>Lead Status</Text>
                    {leadStatuses.map((status) => (
                        <View key={status.shortName} style={styles.tooltipItem}>
                            <View style={[styles.tooltipIcon, { backgroundColor: status.color }]}>
                                <status.icon color="white" />
                            </View>
                            <Text style={styles.tooltipText}>{status.shortName}: {status.fullName}</Text>
                        </View>
                    ))}
                    <Text style={[styles.tooltipSubtitle, { marginTop: 16 }]}>Customer Status</Text>
                    {customerStatuses.map((status) => (
                        <View key={status.shortName} style={styles.tooltipItem}>
                            <View style={[styles.tooltipIcon, { backgroundColor: status.color }]}>
                                <status.icon color="white" />
                            </View>
                            <Text style={styles.tooltipText}>{status.shortName}: {status.fullName}</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        justifyContent: 'flex-end',
        zIndex: 1001,
    },
    tooltipContent: {
        width: '100%',
        maxHeight: 480,
        backgroundColor: '#1F1F1F',
        paddingVertical: 24,
        paddingHorizontal: 24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    tooltipSubtitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '500',
        marginBottom: 16,
        marginTop: 18
    },
    tooltipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    tooltipIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    tooltipText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 12,
    },
    title: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    top: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    iconContainer: {
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 18,
        width: 36,
        height: 36,
    },
});
