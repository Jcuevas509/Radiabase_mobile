import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SettingsShell } from 'components/screens/Settings/SettingsShell';
import { GlassCircleButton } from 'components/Button/GlassCircleButton';
import { CompetitionBuilderSheet } from 'components/Competition/CompetitionBuilderSheet';
import { MetaChip, RoundTimeline, StandingsCard } from 'components/Competition/CompetitionPieces';
import { CARD_SHADOW, TEAL_GRADIENT } from 'constants/design';
import { useSession } from 'context/AuthenticationContext';
import { fetchCompetitionEvents, fetchOffices } from 'services/manager-api';
import { useCompetitionEventsStore } from 'store/CompetitionEventsStore';
import type { CompetitionEvent, CompetitionMetric, OfficeSummary } from 'types/manager.types';
import {
    advanceLabel,
    currentRound,
    daysLeft,
    eventStatus,
    formatDateRange,
    scopeLabel,
} from 'utils/competition';

function metricIcon(metric: CompetitionMetric): keyof typeof Ionicons.glyphMap {
    if (metric === 'Knocks') return 'hand-left';
    if (metric === 'Appointments') return 'calendar';
    return 'ribbon';
}

/** The main event: gradient hero with the rounds timeline and the live
 * round's standings. */
function MainEventCard({ event, now, onPress }: {
    readonly event: CompetitionEvent;
    readonly now: Date;
    readonly onPress: () => void;
}) {
    const round = currentRound(event, now);
    const advance = advanceLabel(round);
    return (
        <TouchableOpacity activeOpacity={0.92} onPress={onPress}>
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
                        <Text style={styles.heroParticipants}>
                            {event.participantsCount} reps · {scopeLabel(event)}
                        </Text>
                    </View>
                    <View style={styles.endsPill}>
                        <Ionicons name="time-outline" size={13} color="#0A96AC" />
                        <Text style={styles.endsPillText}>{daysLeft(round, now)}d left</Text>
                    </View>
                </View>
                <View style={styles.heroChipsRow}>
                    <MetaChip onDark icon={metricIcon(event.metric)} label={event.metric} />
                    <MetaChip onDark icon="people-outline" label={event.divisions.join(' + ')} />
                </View>
                <RoundTimeline event={event} now={now} />
                <View style={styles.roundInfoRow}>
                    <Text style={styles.roundInfoTitle}>{round.label}</Text>
                    <Text style={styles.roundInfoMeta}>
                        {formatDateRange(round.startDate, round.endDate)}
                        {advance ? ` · ${advance}` : ''}
                    </Text>
                </View>
                <StandingsCard round={round} metricLabel={event.metric.toLowerCase()} />
                <View style={styles.heroPrizeRow}>
                    <Ionicons name="gift-outline" size={15} color="#EAFBFE" />
                    <Text style={styles.heroPrizeText} numberOfLines={1}>{event.grandPrize}</Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
}

function EventCard({ event, now, onPress }: {
    readonly event: CompetitionEvent;
    readonly now: Date;
    readonly onPress: () => void;
}) {
    const status = eventStatus(event, now);
    const round = currentRound(event, now);
    const leader = round.standings[0] ?? event.rounds[event.rounds.length - 1].standings[0];
    return (
        <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
            <View style={styles.cardHeader}>
                <View style={[styles.cardTrophy, status === 'ended' && styles.cardTrophyEnded]}>
                    <Ionicons
                        name={status === 'ended' ? 'flag' : 'trophy'}
                        size={17}
                        color={status === 'ended' ? '#71717A' : '#0A96AC'}
                    />
                </View>
                <View style={styles.cardTitleBlock}>
                    <Text style={styles.cardName} numberOfLines={1}>{event.name}</Text>
                    <Text style={styles.cardMeta} numberOfLines={1}>
                        {event.metric} · {scopeLabel(event)} · {event.participantsCount} reps
                        {event.rounds.length > 1 ? ` · ${event.rounds.length} rounds` : ''}
                    </Text>
                </View>
                {status === 'ended' ? (
                    <View style={styles.endedChip}><Text style={styles.endedChipText}>Ended</Text></View>
                ) : status === 'upcoming' ? (
                    <View style={styles.daysChip}>
                        <Ionicons name="calendar-outline" size={12} color="#0A96AC" />
                        <Text style={styles.daysChipText}>{formatDateRange(round.startDate, round.endDate)}</Text>
                    </View>
                ) : (
                    <View style={styles.daysChip}>
                        <Ionicons name="time-outline" size={12} color="#0A96AC" />
                        <Text style={styles.daysChipText}>{daysLeft(round, now)}d</Text>
                    </View>
                )}
            </View>
            <View style={styles.cardFooter}>
                <View style={styles.leaderRow}>
                    <View>
                        <Text style={styles.leaderLabel}>{status === 'ended' ? 'Winner' : 'Leader'}</Text>
                        <Text style={styles.leaderName} numberOfLines={1}>{leader?.name ?? '—'}</Text>
                    </View>
                </View>
                <View style={styles.prizeBlock}>
                    <Ionicons name="gift-outline" size={13} color="#71717A" />
                    <Text style={styles.prizeText} numberOfLines={1}>{event.grandPrize}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function CompetitionsScreen() {
    const { session } = useSession();
    const router = useRouter();
    const managerId = Number(session?.user?.id ?? 0);
    const [fetchedEvents, setFetchedEvents] = useState<readonly CompetitionEvent[] | null>(null);
    const [offices, setOffices] = useState<readonly OfficeSummary[]>([]);
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const localEvents = useCompetitionEventsStore((state) => state.localEvents);
    const addEvent = useCompetitionEventsStore((state) => state.addEvent);

    useEffect(() => {
        const controller = new AbortController();
        fetchCompetitionEvents({ managerId, signal: controller.signal })
            .then(setFetchedEvents)
            .catch(() => undefined);
        fetchOffices({ managerId, signal: controller.signal })
            .then(setOffices)
            .catch(() => undefined);
        return () => controller.abort();
    }, [managerId]);

    const addButton = (
        <GlassCircleButton icon="add" accessibilityLabel="New competition" onPress={() => setIsBuilderOpen(true)} />
    );

    if (!fetchedEvents) {
        return (
            <SettingsShell title="Competitions" headerRight={addButton} glassHeader>
                <ActivityIndicator style={styles.loading} color="#18181B" />
            </SettingsShell>
        );
    }

    const now = new Date();
    const events = [...localEvents, ...fetchedEvents];
    const active = events.filter((event) => eventStatus(event, now) !== 'ended');
    const ended = events.filter((event) => eventStatus(event, now) === 'ended');
    // The main event is the biggest live one: rounds beat single-stage.
    const mainEvent = [...active].sort((a, b) => b.rounds.length - a.rounds.length)[0];
    const miniEvents = active.filter((event) => event !== mainEvent);

    const openDetail = (event: CompetitionEvent) =>
        router.push({ pathname: '/(app)/manager/competition-detail', params: { eventId: String(event.id) } } as never);

    return (
        <SettingsShell title="Competitions" headerRight={addButton} glassHeader>
            {mainEvent ? (
                <>
                    <Text style={[styles.sectionTitle, styles.sectionTitleFirst]}>Main event</Text>
                    <MainEventCard event={mainEvent} now={now} onPress={() => openDetail(mainEvent)} />
                </>
            ) : null}

            {miniEvents.length > 0 ? (
                <>
                    <Text style={styles.sectionTitle}>Mini competitions</Text>
                    <View style={styles.cardList}>
                        {miniEvents.map((event) => (
                            <EventCard key={event.id} event={event} now={now} onPress={() => openDetail(event)} />
                        ))}
                    </View>
                </>
            ) : null}

            {ended.length > 0 ? (
                <>
                    <Text style={styles.sectionTitle}>Finished</Text>
                    <View style={styles.cardList}>
                        {ended.map((event) => (
                            <EventCard key={event.id} event={event} now={now} onPress={() => openDetail(event)} />
                        ))}
                    </View>
                </>
            ) : null}

            <CompetitionBuilderSheet
                visible={isBuilderOpen}
                offices={offices}
                onClose={() => setIsBuilderOpen(false)}
                onLaunch={(event) => {
                    addEvent(event);
                    setIsBuilderOpen(false);
                }}
            />
        </SettingsShell>
    );
}

const styles = StyleSheet.create({
    loading: {
        marginTop: 48,
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
    sectionTitleFirst: {
        marginTop: 0,
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
    heroParticipants: {
        marginTop: 1,
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#EAFBFE',
    },
    endsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 13,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    endsPillText: {
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#0A96AC',
    },
    heroChipsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    roundInfoRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
        marginTop: 12,
        marginLeft: 2,
    },
    roundInfoTitle: {
        fontSize: 15,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#FFFFFF',
    },
    roundInfoMeta: {
        flex: 1,
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#EAFBFE',
    },
    heroPrizeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        marginLeft: 2,
    },
    heroPrizeText: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#EAFBFE',
    },
    cardList: {
        gap: 12,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(24, 24, 27, 0.07)',
        boxShadow: CARD_SHADOW,
        padding: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
    },
    cardTrophy: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(0, 209, 234, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTrophyEnded: {
        backgroundColor: '#F4F4F5',
    },
    cardTitleBlock: {
        flex: 1,
    },
    cardName: {
        fontSize: 15,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
    },
    cardMeta: {
        marginTop: 1,
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#71717A',
    },
    daysChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0, 209, 234, 0.12)',
        borderRadius: 12,
        paddingHorizontal: 9,
        paddingVertical: 4,
    },
    daysChipText: {
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#0A96AC',
    },
    endedChip: {
        backgroundColor: '#F4F4F5',
        borderRadius: 12,
        paddingHorizontal: 9,
        paddingVertical: 4,
    },
    endedChipText: {
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#71717A',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E4E4E7',
        marginTop: 10,
        paddingTop: 9,
    },
    leaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexShrink: 1,
    },
    leaderLabel: {
        fontSize: 10,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#A1A1AA',
    },
    leaderName: {
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
    },
    prizeBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        flexShrink: 1,
    },
    prizeText: {
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#71717A',
    },
});
