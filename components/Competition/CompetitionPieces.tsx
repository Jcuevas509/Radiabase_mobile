import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';
import { UserAvatar } from 'components/Avatar/UserAvatar';
import { portraitUrl, splitName } from 'constants/design';
import { demoInt } from 'services/demo-stats';
import type { CompetitionEvent, CompetitionRound } from 'types/manager.types';
import { roundStatus } from 'utils/competition';

/** Placeholder headshots for standings rows that have no photo yet —
 * same randomuser set the rest of the sample data uses. */
const PLACEHOLDER_PORTRAITS = [
    'men/45', 'women/68', 'men/23', 'women/44', 'men/12',
    'women/12', 'men/61', 'women/21', 'men/76', 'women/57',
] as const;

const MEDAL_IMAGES = [
    require('../../assets/images/medals/gold.jpg'),
    require('../../assets/images/medals/silver.jpg'),
    require('../../assets/images/medals/bronze.jpg'),
] as const;

export function MetaChip({ icon, label, onDark }: {
    readonly icon: keyof typeof Ionicons.glyphMap;
    readonly label: string;
    readonly onDark?: boolean;
}) {
    return (
        <View style={[styles.metaChip, onDark && styles.metaChipDark]}>
            <Ionicons name={icon} size={12} color={onDark ? '#EAFBFE' : '#0A96AC'} />
            <Text style={[styles.metaChipText, onDark && styles.metaChipTextDark]}>{label}</Text>
        </View>
    );
}

/** Dots-and-lines round progress: done rounds check off, the live round
 * glows, upcoming rounds stay hollow. */
export function RoundTimeline({ event, now, activeRoundNumber }: {
    readonly event: CompetitionEvent;
    readonly now: Date;
    readonly activeRoundNumber?: number;
}) {
    return (
        <View style={styles.timeline}>
            {event.rounds.map((round, index) => {
                const status = roundStatus(round, now);
                const isSelected = activeRoundNumber === round.roundNumber;
                return (
                    <View key={round.roundNumber} style={styles.timelineStep}>
                        {index > 0 ? (
                            <View
                                style={[
                                    styles.timelineLine,
                                    status !== 'upcoming' && styles.timelineLineDone,
                                ]}
                            />
                        ) : null}
                        <View
                            style={[
                                styles.timelineDot,
                                status === 'ended' && styles.timelineDotDone,
                                status === 'active' && styles.timelineDotActive,
                                isSelected && styles.timelineDotSelected,
                            ]}
                        >
                            {status === 'ended' ? (
                                <Ionicons name="checkmark" size={20} color="#0A96AC" />
                            ) : (
                                <Text
                                    style={[
                                        styles.timelineDotText,
                                        status === 'active' && styles.timelineDotTextActive,
                                    ]}
                                >
                                    {round.roundNumber}
                                </Text>
                            )}
                        </View>
                        <Text style={styles.timelineLabel} numberOfLines={1}>
                            {round.label === 'Finals' ? 'Finals' : `R${round.roundNumber}`}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}

/** Top-three podium: big profile photos with a medal badge pinned to the
 * bottom-right of each — gold raised in the center, silver left, bronze
 * right. */
export function StandingsPodium({ round, metricLabel, onDark = false }: {
    readonly round: CompetitionRound;
    readonly metricLabel: string;
    readonly onDark?: boolean;
}) {
    if (round.standings.length === 0) {
        return (
            <Text style={[styles.standingsEmpty, onDark && styles.standingsEmptyDark]}>
                No results yet — standings appear once activity lands in this round.
            </Text>
        );
    }
    // Render order silver / gold / bronze; gold gets the big raised slot.
    const podiumOrder = [1, 0, 2]
        .filter((rank) => rank < round.standings.length)
        .map((rank) => ({ rank, standing: round.standings[rank] }));
    return (
        <View style={styles.podiumRow}>
            {podiumOrder.map(({ rank, standing }) => {
                const isGold = rank === 0;
                const size = isGold ? 92 : 68;
                const { first, last } = splitName(standing.name);
                const portrait = standing.portrait
                    || PLACEHOLDER_PORTRAITS[demoInt(`pp-${standing.name}`, 0, PLACEHOLDER_PORTRAITS.length - 1)];
                return (
                    <View
                        key={standing.name}
                        style={[styles.podiumSlot, !isGold && styles.podiumSlotSide]}
                    >
                        <View style={{ width: size, height: size }}>
                            <UserAvatar
                                firstName={first}
                                lastName={last}
                                imageUrl={portraitUrl(portrait)}
                                size={size}
                                color={onDark ? '#FFFFFF' : '#18181B'}
                                ringWidth={2}
                            />
                            <View style={[styles.medalBadge, isGold && styles.medalBadgeGold]}>
                                <Image
                                    source={MEDAL_IMAGES[rank]}
                                    style={isGold ? styles.medalBadgeImageGold : styles.medalBadgeImage}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>
                        <Text
                            style={[styles.podiumName, onDark && styles.podiumNameDark]}
                            numberOfLines={1}
                        >
                            {first} {last.charAt(0) ? `${last.charAt(0)}.` : ''}
                        </Text>
                        <Text style={[styles.podiumValue, onDark && styles.podiumValueDark]}>
                            {standing.value.toLocaleString()}
                            <Text style={[styles.podiumMetric, onDark && styles.podiumMetricDark]}>
                                {' '}{metricLabel}
                            </Text>
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#F4F4F5',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    metaChipDark: {
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
    },
    metaChipText: {
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#0A96AC',
    },
    metaChipTextDark: {
        color: '#EAFBFE',
    },
    timeline: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 14,
    },
    timelineStep: {
        flex: 1,
        alignItems: 'center',
        gap: 5,
    },
    timelineLine: {
        position: 'absolute',
        top: 16,
        right: '50%',
        left: '-50%',
        height: 2,
        borderRadius: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    timelineLineDone: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
    },
    timelineDot: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.55)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timelineDotDone: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FFFFFF',
    },
    timelineDotActive: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FFFFFF',
    },
    timelineDotSelected: {
        borderColor: '#18181B',
    },
    timelineDotText: {
        fontSize: 15,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#FFFFFF',
    },
    timelineDotTextActive: {
        color: '#0A96AC',
    },
    timelineLabel: {
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#EAFBFE',
    },
    standingsEmpty: {
        marginTop: 14,
        paddingVertical: 12,
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#71717A',
    },
    standingsEmptyDark: {
        color: '#EAFBFE',
    },
    podiumRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 22,
        marginTop: 16,
    },
    podiumSlot: {
        alignItems: 'center',
        gap: 3,
        maxWidth: 108,
    },
    podiumSlotSide: {
        marginBottom: 6,
    },
    // White circular chip so the medal art sits cleanly over photos.
    medalBadge: {
        position: 'absolute',
        right: -6,
        bottom: -4,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 4px rgba(24, 24, 27, 0.25)',
    },
    medalBadgeGold: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    medalBadgeImage: {
        width: 16,
        height: 22,
    },
    medalBadgeImageGold: {
        width: 18,
        height: 25,
    },
    podiumName: {
        marginTop: 6,
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
    },
    podiumNameDark: {
        color: '#FFFFFF',
    },
    podiumValue: {
        fontSize: 14,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#18181B',
    },
    podiumValueDark: {
        color: '#FFFFFF',
    },
    podiumMetric: {
        fontSize: 11,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#71717A',
    },
    podiumMetricDark: {
        color: '#CFF6FC',
    },
});
