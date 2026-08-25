import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Easing,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SettingsShell } from 'components/screens/Settings/SettingsShell';
import { GlassCircleButton } from 'components/Button/GlassCircleButton';
import { GlassSurface } from 'components/GlassSurface';
import { CompetitionBuilderSheet } from 'components/Competition/CompetitionBuilderSheet';
import { RoundTimeline, StandingsPodium } from 'components/Competition/CompetitionPieces';
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
/**
 * Continuously morphing gradient (AnimatedGradientView-style): two
 * oversized gradient sheets pan on opposing diagonal sine paths while the
 * upper sheet crossfades, so color and direction both flow. Native-driver
 * transforms/opacity only.
 */
const FLOW_SHEET = 1000;

function FlowSheet({ colors, startPoint, endPoint, xRange, yRange, xDur, yDur, fade }: {
    readonly colors: readonly [string, string, ...string[]];
    readonly startPoint: { x: number; y: number };
    readonly endPoint: { x: number; y: number };
    readonly xRange: readonly [number, number];
    readonly yRange: readonly [number, number];
    readonly xDur: number;
    readonly yDur: number;
    readonly fade?: readonly [number, number];
}) {
    const x = useRef(new Animated.Value(0)).current;
    const y = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const drift = (value: Animated.Value, duration: number) =>
            Animated.loop(Animated.sequence([
                Animated.timing(value, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(value, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ]));
        const loops = [drift(x, xDur), drift(y, yDur)];
        if (fade) {
            loops.push(drift(opacity, (xDur + yDur) / 2));
        }
        loops.forEach((loop) => loop.start());
        return () => loops.forEach((loop) => loop.stop());
    }, [x, y, opacity, xDur, yDur, fade]);

    return (
        <Animated.View
            style={{
                position: 'absolute',
                width: FLOW_SHEET,
                height: FLOW_SHEET,
                left: -(FLOW_SHEET / 2),
                top: -(FLOW_SHEET / 2),
                opacity: fade
                    ? opacity.interpolate({ inputRange: [0, 1], outputRange: fade as unknown as number[] })
                    : 1,
                transform: [
                    { translateX: x.interpolate({ inputRange: [0, 1], outputRange: xRange as unknown as number[] }) },
                    { translateY: y.interpolate({ inputRange: [0, 1], outputRange: yRange as unknown as number[] }) },
                ],
            }}
        >
            <LinearGradient
                colors={[...colors]}
                locations={[0, 0.28, 0.5, 0.72, 1]}
                start={startPoint}
                end={endPoint}
                style={StyleSheet.absoluteFill}
            />
        </Animated.View>
    );
}

function LavaField() {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <FlowSheet
                colors={['#04121C', '#0B4A63', '#19C8E8', '#083055', '#04121C']}
                startPoint={{ x: 0, y: 0.1 }}
                endPoint={{ x: 1, y: 0.9 }}
                xRange={[-240, 200]}
                yRange={[-140, 120]}
                xDur={12000}
                yDur={17000}
            />
            <FlowSheet
                colors={['#050B26', '#14309B', '#4A2BC0', '#0A1B3F', '#050B26']}
                startPoint={{ x: 1, y: 0 }}
                endPoint={{ x: 0, y: 1 }}
                xRange={[200, -220]}
                yRange={[120, -150]}
                xDur={15000}
                yDur={10000}
                fade={[0.15, 0.6]}
            />
        </View>
    );
}

/** Centered popup with the full event rulebook. */
function EventInfoModal({ event, visible, onClose }: {
    readonly event: CompetitionEvent;
    readonly visible: boolean;
    readonly onClose: () => void;
}) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.infoScrim} onPress={onClose}>
                <Pressable style={styles.infoCard} onPress={() => undefined}>
                    <Text style={styles.infoTitle}>{event.name}</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name={metricIcon(event.metric)} size={16} color="#0A96AC" />
                        <Text style={styles.infoText}>Scored on {event.metric.toLowerCase()}</Text>
                    </View>
                    <View style={[styles.infoRow, styles.infoDivider]}>
                        <Ionicons name="people-outline" size={16} color="#0A96AC" />
                        <Text style={styles.infoText}>
                            {event.divisions.join(' and ')} divisions · {scopeLabel(event)} · {event.participantsCount} reps
                        </Text>
                    </View>
                    {event.rounds.map((round) => {
                        const advance = advanceLabel(round);
                        return (
                            <View key={round.roundNumber} style={[styles.infoRow, styles.infoDivider]}>
                                <Ionicons
                                    name={round.advance ? 'arrow-forward-circle-outline' : 'trophy-outline'}
                                    size={16}
                                    color="#0A96AC"
                                />
                                <Text style={styles.infoText}>
                                    {round.label} ({formatDateRange(round.startDate, round.endDate)})
                                    {advance ? `: ${advance}` : ''}
                                    {round.prize ? ` · round prize: ${round.prize}` : ''}
                                </Text>
                            </View>
                        );
                    })}
                    <View style={[styles.infoRow, styles.infoDivider]}>
                        <Ionicons name="gift-outline" size={16} color="#0A96AC" />
                        <Text style={styles.infoText}>Grand prize: {event.grandPrize}</Text>
                    </View>
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Close details"
                        style={styles.infoCloseButton}
                        onPress={onClose}
                    >
                        <Text style={styles.infoCloseText}>Done</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

function MainEventCard({ event, now, onPress }: {
    readonly event: CompetitionEvent;
    readonly now: Date;
    readonly onPress: () => void;
}) {
    const round = currentRound(event, now);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    return (
        <TouchableOpacity activeOpacity={0.92} onPress={onPress}>
            <View style={styles.heroCard}>
                <LinearGradient
                    colors={['#020C12', '#062736', '#03101B']}
                    locations={[0, 0.55, 1]}
                    start={{ x: 0.1, y: 0 }}
                    end={{ x: 0.9, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                <LavaField />
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
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Competition details"
                        hitSlop={8}
                        onPress={() => setIsInfoOpen(true)}
                        style={styles.infoButton}
                    >
                        <Ionicons name="information" size={17} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
                <GlassSurface
                    glassEffectStyle="clear"
                    style={styles.heroGlassPanel}
                    fallbackStyle={styles.heroGlassPanelFallback}
                >
                    <RoundTimeline event={event} now={now} />
                    <StandingsPodium round={round} metricLabel={event.metric.toLowerCase()} onDark />
                </GlassSurface>
                <EventInfoModal event={event} visible={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
                <View style={styles.heroPrizeRow}>
                    <Ionicons name="gift-outline" size={15} color="#EAFBFE" />
                    <Text style={styles.heroPrizeText} numberOfLines={1}>{event.grandPrize}</Text>
                </View>
            </View>
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
        overflow: 'hidden',
        backgroundColor: '#020C12',
    },
    // Bare clear glass over the moving ripples — the panel lenses the
    // animation behind it (nav-bar recipe: no paint on the glass node).
    heroGlassPanel: {
        borderRadius: 20,
        overflow: 'hidden',
        marginTop: 12,
        paddingHorizontal: 12,
        paddingBottom: 14,
    },
    heroGlassPanelFallback: {
        backgroundColor: 'rgba(255, 255, 255, 0.14)',
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
    infoButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoScrim: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 26,
    },
    infoCard: {
        alignSelf: 'stretch',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 14,
        boxShadow: '0 18px 50px rgba(0, 0, 0, 0.35)',
    },
    infoTitle: {
        fontSize: 19,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#18181B',
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
    },
    infoDivider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E4E4E7',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#18181B',
        lineHeight: 18,
    },
    infoCloseButton: {
        marginTop: 10,
        backgroundColor: '#18181B',
        borderRadius: 15,
        minHeight: 46,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoCloseText: {
        fontSize: 15,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#FFFFFF',
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
