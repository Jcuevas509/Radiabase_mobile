import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';
import { UserAvatar } from 'components/Avatar/UserAvatar';
import { portraitUrl, splitName } from 'constants/design';
import type { CompetitionEvent, CompetitionRound } from 'types/manager.types';
import { roundStatus } from 'utils/competition';

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
                                <Ionicons name="checkmark" size={12} color="#0A96AC" />
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

/** Medal-ranked standings rows on a white inset card. */
export function StandingsCard({ round, metricLabel }: {
    readonly round: CompetitionRound;
    readonly metricLabel: string;
}) {
    return (
        <View style={styles.standingsCard}>
            {round.standings.length === 0 ? (
                <Text style={styles.standingsEmpty}>
                    No results yet — standings appear once activity lands in this round.
                </Text>
            ) : (
                round.standings.map((standing, index) => {
                    const { first, last } = splitName(standing.name);
                    return (
                        <View
                            key={standing.name}
                            style={[styles.standingRow, index > 0 && styles.standingRowDivider]}
                        >
                            <Image source={MEDAL_IMAGES[index]} style={styles.medalImage} resizeMode="contain" />
                            <UserAvatar
                                firstName={first}
                                lastName={last}
                                imageUrl={standing.portrait ? portraitUrl(standing.portrait) : null}
                                size={30}
                                color="#18181B"
                                ringWidth={1}
                            />
                            <Text style={styles.standingName} numberOfLines={1}>{standing.name}</Text>
                            <Text style={styles.standingValue}>{standing.value.toLocaleString()}</Text>
                            <Text style={styles.standingMetric}>{metricLabel}</Text>
                        </View>
                    );
                })
            )}
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
        gap: 4,
    },
    timelineLine: {
        position: 'absolute',
        top: 13,
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
        width: 27,
        height: 27,
        borderRadius: 14,
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
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#FFFFFF',
    },
    timelineDotTextActive: {
        color: '#0A96AC',
    },
    timelineLabel: {
        fontSize: 10,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#EAFBFE',
    },
    standingsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        marginTop: 14,
        paddingVertical: 4,
        paddingHorizontal: 12,
    },
    standingsEmpty: {
        paddingVertical: 12,
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#71717A',
    },
    standingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        paddingVertical: 7,
    },
    standingRowDivider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E4E4E7',
    },
    medalImage: {
        width: 24,
        height: 32,
    },
    standingName: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
    },
    standingValue: {
        fontSize: 15,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#18181B',
    },
    standingMetric: {
        fontSize: 11,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#A1A1AA',
    },
});
