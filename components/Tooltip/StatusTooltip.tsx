import { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
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
        <ScrollView style={styles.tooltipContent} >
            <View style={styles.top}>
                <Text style={styles.title}>Status Overview</Text>
                <TouchableOpacity onPress={onClose} style={styles.iconContainer} >
                    <Ionicons name="close" size={18} color="black" />
                </TouchableOpacity>
            </View>
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
    );
}

const styles = StyleSheet.create({

    tooltipContent: {
        position: 'absolute',
        left: 0,
        bottom: 0,
        width: 306,
        maxHeight: 631,
        backgroundColor: '#1F1F1F',
        paddingVertical: 24,
        paddingHorizontal: 36,
        borderRadius: 24,
        zIndex: 1001,
    },
    tooltipTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    tooltipSubtitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: '500',
        marginBottom: 24,
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
    },
    iconContainer: {
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 12,
        width: 24,
        height: 24,
    },
});
