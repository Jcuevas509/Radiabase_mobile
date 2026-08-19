import React from 'react';
import { ScrollView, View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { PlainModal } from 'components/Modal/Modal';
import { Button } from '../Button/Button';
import { AgentCard } from '../Card/AgentCard';
import type { BuildingProps } from 'types/componentsTypes';
import { buildAreaProgressSummary } from 'utils/build-area-progress-summary';

const STATUS_PRESENTATION: Record<string, { label: string; color: string }> = {
    interested: { label: 'Interested / Go Back', color: '#1A75C6' },
    not_interested: { label: 'Not Interested', color: '#F90114' },
    not_home: { label: 'Not Home', color: '#F9B20F' },
    custom: { label: 'Call Back', color: '#A300FF' },
    knocked: { label: 'Knocked', color: '#71717A' },
};

function formatUnknownStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

type ManagedArea = {
    readonly assignee?: any;
    readonly buildingMarkers?: BuildingProps[];
};

interface ManageAreaModalProps {
    visible: boolean;
    onClose: () => void;
    selectedArea: ManagedArea | null;
    canManage: boolean;
    onDeleteArea: () => void;
    onReassignArea: () => void;
}

export const ManageAreaModal: React.FC<ManageAreaModalProps> = ({
    visible,
    onClose,
    selectedArea,
    canManage,
    onDeleteArea,
    onReassignArea,
}) => {
    const { height } = useWindowDimensions();
    const isAssigned = Boolean(selectedArea?.assignee);
    const summary = buildAreaProgressSummary(selectedArea?.buildingMarkers ?? []);
    return (
        <PlainModal
            visible={visible}
            onClose={onClose}
            title={isAssigned
                ? `Assigned to ${`${selectedArea?.assignee?.name ?? ''} ${selectedArea?.assignee?.lastname ?? ''}`.trim() || 'user'}`
                : 'Manage Area'
            }
            buttons={
                canManage ? <>
                    <Button
                        text='Delete Area'
                        textStyle={{ color: '#CA0105' }}
                        onPress={onDeleteArea}
                    />
                    <Button
                        text={isAssigned ? 'Reassign' : 'Assign'}
                        buttonStyle={{ backgroundColor: 'black', width: 149 }}
                        textStyle={{ color: 'white' }}
                        onPress={onReassignArea}
                    />
                </> : <Button
                    text="Close"
                    buttonStyle={styles.closeButton}
                    textStyle={{ color: 'white' }}
                    onPress={onClose}
                />
            }
        >
            <ScrollView
                style={{ maxHeight: Math.max(280, Math.round(height * 0.58)) }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator
            >
            {isAssigned ? (
                <AgentCard
                    data={selectedArea?.assignee}
                    isAssigned={true}
                />
            ) : (
                <View style={styles.textContainer}>
                    <Text style={styles.notAssignedText}>
                        This Area is not assigned yet.
                    </Text>
                </View>
            )}
            <View style={styles.summarySection}>
                <View style={styles.summaryHeader}>
                    <Text style={styles.summaryTitle}>Saved-door progress</Text>
                    <Text style={styles.summaryPercent}>{summary.completionPercent}%</Text>
                </View>
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${summary.completionPercent}%` }]} />
                </View>
                <Text style={styles.progressCaption}>
                    {summary.savedDoors === 0
                        ? 'No saved doors yet. Tap a roof to start working this turf.'
                        : `${summary.workedDoors} of ${summary.savedDoors} saved doors worked`}
                </Text>
                <View style={styles.metricRow}>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricValue}>{summary.savedDoors}</Text>
                        <Text style={styles.metricLabel}>Saved doors</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricValue}>{summary.unworkedDoors}</Text>
                        <Text style={styles.metricLabel}>Unworked</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricValue}>{summary.leads}</Text>
                        <Text style={styles.metricLabel}>Leads</Text>
                    </View>
                </View>
                {summary.statusCounts.length > 0 ? (
                    <View style={styles.statusList}>
                        {summary.statusCounts.map(({ status, count }) => {
                            const presentation = STATUS_PRESENTATION[status] ?? {
                                label: formatUnknownStatus(status),
                                color: '#71717A',
                            };
                            return (
                                <View key={status} style={styles.statusRow}>
                                    <View style={[styles.statusDot, { backgroundColor: presentation.color }]} />
                                    <Text style={styles.statusName}>{presentation.label}</Text>
                                    <Text style={styles.statusCount}>{count}</Text>
                                </View>
                            );
                        })}
                    </View>
                ) : null}
            </View>
            </ScrollView>
        </PlainModal>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 8,
    },
    textContainer: {
        paddingVertical: 16
    },
    notAssignedText: {
        fontSize: 14,
        fontWeight: '500'
    },
    summarySection: {
        marginTop: 18,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#18181B',
    },
    summaryPercent: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1687E8',
    },
    progressTrack: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E4E4E7',
        overflow: 'hidden',
        marginTop: 10,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
        backgroundColor: '#1687E8',
    },
    progressCaption: {
        color: '#71717A',
        fontSize: 11,
        marginTop: 7,
    },
    metricRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 14,
    },
    metricCard: {
        flex: 1,
        minHeight: 62,
        borderRadius: 10,
        padding: 10,
        backgroundColor: '#F4F4F5',
    },
    metricValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#18181B',
    },
    metricLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#71717A',
        marginTop: 2,
    },
    statusList: {
        marginTop: 14,
        gap: 8,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 24,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    statusName: {
        flex: 1,
        fontSize: 12,
        color: '#3F3F46',
    },
    statusCount: {
        fontSize: 12,
        fontWeight: '700',
        color: '#18181B',
    },
    closeButton: {
        width: '100%',
        backgroundColor: '#18181B',
    },
});
