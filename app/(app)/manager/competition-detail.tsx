import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SettingsShell } from 'components/screens/Settings/SettingsShell';
import { MetaChip, RoundTimeline, StandingsCard } from 'components/Competition/CompetitionPieces';
import { CARD_SHADOW, TEAL_GRADIENT } from 'constants/design';
import { useSession } from 'context/AuthenticationContext';
import { fetchCompetitionEvents } from 'services/manager-api';
import { useCompetitionEventsStore } from 'store/CompetitionEventsStore';
import type { CompetitionEvent, CompetitionMetric } from 'types/manager.types';
import {
    advanceLabel,
    currentRound,
    daysLeft,
    eventStatus,
    formatDateRange,
    roundStatus,
    scopeLabel,
} from 'utils/competition';

function metricIcon(metric: CompetitionMetric): keyof typeof Ionicons.glyphMap {
    if (metric === 'Knocks') return 'hand-left';
    if (metric === 'Appointments') return 'calendar';
    return 'ribbon';
}

export default function CompetitionDetailScreen() {
    const { session } = useSession();
    const params = useLocalSearchParams<{ eventId?: string }>();
    const managerId = Number(session?.user?.id ?? 0);
    const eventId = Number(params.eventId ?? 0);
    const localEvents = useCompetitionEventsStore((state) => state.localEvents);
    const [fetchedEvents, setFetchedEvents] = useState<readonly CompetitionEvent[] | null>(null);
    const [selectedRoundNumber, setSelectedRoundNumber] = useState<number | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetchCompetitionEvents({ managerId, signal: controller.signal })
            .then(setFetchedEvents)
            .catch(() => undefined);
        return () => controller.abort();
    }, [managerId]);

    if (!fetchedEvents) {
        return (
            <SettingsShell title="Competition" glassHeader>
                <ActivityIndicator style={styles.loading} color="#18181B" />
            </SettingsShell>
        );
    }

    const event = [...localEvents, ...fetchedEvents].find((entry) => entry.id === eventId);
    if (!event) {
        return (
            <SettingsShell title="Competition" glassHeader>
                <Text style={styles.missingText}>This competition is no longer available.</Text>
            </SettingsShell>
        );
    }

    const now = new Date();
    const status = eventStatus(event, now);
    const liveRound = currentRound(event, now);
    const selectedRound = event.rounds.find((round) => round.roundNumber === selectedRoundNumber) ?? liveRound;
    const hasRounds = event.rounds.length > 1;

    return (
        <SettingsShell title={event.name} glassHeader>
            <LinearGradient
                colors={[...TEAL_GRADIENT]}
                locations={[0, 0.55, 1]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.heroCard}
            >
                <View style={styles.heroHeader}>
                    <View style={styles.heroTrophy}>
                        <Ionicons name="trophy" size={22} color="#FFFFFF" />
                    </View>
                    <View style={styles.heroTitleBlock}>
                        <Text style={styles.heroName} numberOfLines={1}>{event.name}</Text>
                        <Text style={styles.heroMeta}>
                            {event.participantsCount} reps · {scopeLabel(event)}
                        </Text>
                    </View>
                    {status === 'ended' ? (
                        <View style={styles.statusPill}>
                            <Text style={styles.statusPillText}>Ended</Text>
                        </View>
                    ) : (
                        <View style={styles.statusPill}>
                            <Ionicons name="time-outline" size={13} color="#0A96AC" />
                            <Text style={styles.statusPillText}>{daysLeft(liveRound, now)}d left</Text>
                        </View>
                    )}
                </View>
                <View style={styles.heroChipsRow}>
                    <MetaChip onDark icon={metricIcon(event.metric)} label={event.metric} />
                    <MetaChip onDark icon="people-outline" label={event.divisions.join(' + ')} />
                </View>
                {hasRounds ? (
                    <RoundTimeline event={event} now={now} activeRoundNumber={selectedRound.roundNumber} />
                ) : null}
                <View style={styles.heroPrizeRow}>
                    <Ionicons name="gift-outline" size={15} color="#EAFBFE" />
                    <Text style={styles.heroPrizeText} numberOfLines={1}>{event.grandPrize}</Text>
                </View>
            </LinearGradient>

            {hasRounds ? (
                <View style={styles.roundChips}>
                    {event.rounds.map((round) => {
                        const isSelected = round.roundNumber === selectedRound.roundNumber;
                        return (
                            <TouchableOpacity
                                key={round.roundNumber}
                                style={[styles.roundChip, isSelected && styles.roundChipActive]}
                                onPress={() => setSelectedRoundNumber(round.roundNumber)}
                            >
                                <Text style={[styles.roundChipText, isSelected && styles.roundChipTextActive]}>
                                    {round.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ) : null}

            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, styles.sectionTitleInHeader]}>{selectedRound.label} standings</Text>
                <Text style={styles.sectionMeta}>{formatDateRange(selectedRound.startDate, selectedRound.endDate)}</Text>
            </View>
            <View style={styles.standingsWrap}>
                <StandingsCard round={selectedRound} metricLabel={event.metric.toLowerCase()} />
            </View>
            {roundStatus(selectedRound, now) === 'upcoming' ? (
                <Text style={styles.upcomingNote}>This round hasn't started yet.</Text>
            ) : null}

            <Text style={styles.sectionTitle}>Rules</Text>
            <View style={styles.rulesCard}>
                <View style={styles.ruleRow}>
                    <Ionicons name={metricIcon(event.metric)} size={16} color="#0A96AC" />
                    <Text style={styles.ruleText}>Scored on {event.metric.toLowerCase()}</Text>
                </View>
                <View style={[styles.ruleRow, styles.ruleDivider]}>
                    <Ionicons name="people-outline" size={16} color="#0A96AC" />
                    <Text style={styles.ruleText}>{event.divisions.join(' and ')} divisions · {scopeLabel(event)}</Text>
                </View>
                {event.rounds.map((round) => {
                    const advance = advanceLabel(round);
                    return (
                        <View key={round.roundNumber} style={[styles.ruleRow, styles.ruleDivider]}>
                            <Ionicons
                                name={round.advance ? 'arrow-forward-circle-outline' : 'trophy-outline'}
                                size={16}
                                color="#0A96AC"
                            />
                            <Text style={styles.ruleText}>
                                {round.label} ({formatDateRange(round.startDate, round.endDate)}):{' '}
                                {advance ?? `winner takes ${event.grandPrize.toLowerCase()}`}
                                {round.prize ? ` · round prize: ${round.prize}` : ''}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </SettingsShell>
    );
}

const styles = StyleSheet.create({
    loading: {
        marginTop: 48,
    },
    missingText: {
        marginTop: 48,
        textAlign: 'center',
        fontSize: 15,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#71717A',
    },
    heroCard: {
        borderRadius: 26,
        padding: 16,
    },
    heroHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    heroTrophy: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroTitleBlock: {
        flex: 1,
    },
    heroName: {
        fontSize: 20,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#FFFFFF',
    },
    heroMeta: {
        marginTop: 1,
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#EAFBFE',
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 13,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    statusPillText: {
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#0A96AC',
    },
    heroChipsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    heroPrizeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 14,
        marginLeft: 2,
    },
    heroPrizeText: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#EAFBFE',
    },
    roundChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 16,
    },
    roundChip: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(24, 24, 27, 0.07)',
        boxShadow: CARD_SHADOW,
    },
    roundChipActive: {
        backgroundColor: '#18181B',
        borderColor: '#18181B',
    },
    roundChipText: {
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#52525B',
    },
    roundChipTextActive: {
        color: '#FFFFFF',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginTop: 22,
        marginLeft: 1,
    },
    sectionTitle: {
        fontSize: 21,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
        marginTop: 22,
        marginBottom: 12,
        marginLeft: 1,
        paddingRight: 14,
    },
    sectionTitleInHeader: {
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
    },
    sectionMeta: {
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#71717A',
    },
    standingsWrap: {
        marginTop: -8,
    },
    upcomingNote: {
        marginTop: 10,
        marginLeft: 2,
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#71717A',
    },
    rulesCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(24, 24, 27, 0.07)',
        boxShadow: CARD_SHADOW,
        paddingHorizontal: 14,
        paddingVertical: 4,
    },
    ruleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 11,
    },
    ruleDivider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E4E4E7',
    },
    ruleText: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#18181B',
        lineHeight: 18,
    },
});
