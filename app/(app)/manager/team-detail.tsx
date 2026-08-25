import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect } from 'react-native-svg';
import { SettingsShell } from 'components/screens/Settings/SettingsShell';
import { GlassSurface } from 'components/GlassSurface';
import { UserAvatar } from 'components/Avatar/UserAvatar';
import { CARD_SHADOW, accentGradient, portraitUrl, splitName } from 'constants/design';
import { useSession } from 'context/AuthenticationContext';
import { demoInt } from 'services/demo-stats';
import { fetchOfficeTeams } from 'services/manager-api';
import type { OfficeTeam } from 'types/manager.types';

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

/** Deterministic per-member split of the team's points so rows always sum
 * close to the team total. Demo until per-member scoring exists. */
function memberBreakdown(team: OfficeTeam) {
    const weights = team.members.map((member) => demoInt(`${team.id}-${member.name}`, 6, 16));
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    return team.members
        .map((member, index) => ({
            ...member,
            role: demoInt(`role-${team.id}-${member.name}`, 0, 1) === 0 ? 'Setter' : 'Closer',
            points: Math.round((team.points * weights[index]) / totalWeight),
            knocksThisWeek: demoInt(`mk-${team.id}-${member.name}`, 40, 170),
        }))
        .sort((a, b) => b.points - a.points);
}

function TeamStat({ icon, value, label, showDivider }: {
    readonly icon: keyof typeof Ionicons.glyphMap;
    readonly value: string;
    readonly label: string;
    readonly showDivider?: boolean;
}) {
    return (
        <View style={[styles.teamStat, showDivider && styles.teamStatDivider]}>
            <View style={styles.teamStatIcon}>
                <Ionicons name={icon} size={16} color="#FFFFFF" />
            </View>
            <View>
                <Text style={styles.teamStatValue}>{value}</Text>
                <Text style={styles.teamStatLabel}>{label}</Text>
            </View>
        </View>
    );
}

function WeekPointsCard({ team }: { readonly team: OfficeTeam }) {
    const bars = WEEK_DAYS.map((_, index) => demoInt(`wt-${team.id}-${index}`, 10, 60));
    const max = Math.max(...bars);
    const barWidth = 26;
    const gap = 14;
    const chartHeight = 84;
    return (
        <View style={styles.trendCard}>
            <View style={styles.trendHeader}>
                <Text style={styles.trendTitle}>Points this week</Text>
                <Text style={styles.trendTotal}>+{team.pointsThisWeek}</Text>
            </View>
            <Svg width={WEEK_DAYS.length * (barWidth + gap) - gap} height={chartHeight}>
                {bars.map((value, index) => {
                    const barHeight = Math.max(6, (value / max) * (chartHeight - 4));
                    return (
                        <Rect
                            key={index}
                            x={index * (barWidth + gap)}
                            y={chartHeight - barHeight}
                            width={barWidth}
                            height={barHeight}
                            rx={7}
                            fill={value === max ? team.accentColor : `${team.accentColor}2E`}
                        />
                    );
                })}
            </Svg>
            <View style={styles.trendLabels}>
                {WEEK_DAYS.map((day, index) => (
                    <Text
                        key={index}
                        style={[styles.trendDay, { width: barWidth, marginRight: index < WEEK_DAYS.length - 1 ? gap : 0 }]}
                    >
                        {day}
                    </Text>
                ))}
            </View>
        </View>
    );
}

export default function TeamDetailScreen() {
    const { session } = useSession();
    const params = useLocalSearchParams<{ teamId?: string }>();
    const managerId = Number(session?.user?.id ?? 0);
    const teamId = Number(params.teamId ?? 0);
    const [team, setTeam] = useState<OfficeTeam | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        fetchOfficeTeams({ managerId, signal: controller.signal })
            .then((teams) => {
                setTeam(teams.find((entry) => entry.id === teamId) ?? null);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
        return () => controller.abort();
    }, [managerId, teamId]);

    if (isLoading) {
        return (
            <SettingsShell title="Team" glassHeader>
                <ActivityIndicator style={styles.loading} color="#18181B" />
            </SettingsShell>
        );
    }

    if (!team) {
        return (
            <SettingsShell title="Team" glassHeader>
                <Text style={styles.missingText}>This team is no longer available.</Text>
            </SettingsShell>
        );
    }

    const members = memberBreakdown(team);
    const goalPct = Math.min(100, Math.round((team.points / team.goalPoints) * 100));

    return (
        <SettingsShell title={team.name} glassHeader>
            <LinearGradient
                colors={accentGradient(team.accentColor)}
                locations={[0, 0.55, 1]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.heroCard}
            >
                <View style={styles.heroTopRow}>
                    <View style={styles.heroEmblem}>
                        <Ionicons
                            name={team.emblem as keyof typeof Ionicons.glyphMap}
                            size={22}
                            color="#FFFFFF"
                        />
                    </View>
                    <View style={styles.heroTitleBlock}>
                        <Text style={styles.heroName} numberOfLines={1}>{team.name}</Text>
                        <Text style={styles.heroMeta}>
                            {team.officeName} · {team.members.length} members
                        </Text>
                    </View>
                </View>
                <GlassSurface
                    glassEffectStyle="clear"
                    style={styles.teamStatsGlass}
                    fallbackStyle={styles.teamStatsFallback}
                >
                    <View style={styles.teamStatsRow}>
                        <TeamStat icon="star-outline" value={team.points.toLocaleString()} label="Points" />
                        <TeamStat icon="trending-up" value={`+${team.pointsThisWeek}`} label="This wk" showDivider />
                        <TeamStat icon="gift-outline" value={`${goalPct}%`} label={team.goalLabel} showDivider />
                    </View>
                </GlassSurface>
                <View style={styles.goalRow}>
                    <View style={styles.goalTrack}>
                        <View style={[styles.goalFill, { width: `${goalPct}%` }]} />
                    </View>
                    <Text style={styles.goalText}>
                        {team.points.toLocaleString()} / {team.goalPoints.toLocaleString()} pts
                    </Text>
                </View>
            </LinearGradient>

            <Text style={styles.sectionTitle}>Momentum</Text>
            <WeekPointsCard team={team} />

            <Text style={styles.sectionTitle}>Members</Text>
            <View style={styles.membersCard}>
                {members.map((member, index) => {
                    const { first, last } = splitName(member.name);
                    return (
                        <View key={member.name} style={[styles.memberRow, index > 0 && styles.memberDivider]}>
                            <Text style={styles.memberRank}>{index + 1}</Text>
                            <UserAvatar
                                firstName={first}
                                lastName={last}
                                imageUrl={member.portrait ? portraitUrl(member.portrait) : null}
                                size={36}
                                color={team.accentColor}
                                ringWidth={1}
                            />
                            <View style={styles.memberBody}>
                                <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
                                <Text style={styles.memberMeta}>
                                    {member.role} · {member.knocksThisWeek} knocks this wk
                                </Text>
                            </View>
                            <View style={styles.memberPointsBlock}>
                                <Text style={styles.memberPoints}>{member.points.toLocaleString()}</Text>
                                <Text style={styles.memberPointsLabel}>pts</Text>
                            </View>
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
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    heroEmblem: {
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
        fontSize: 22,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#FFFFFF',
    },
    heroMeta: {
        marginTop: 1,
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#F4FDFF',
    },
    teamStatsGlass: {
        borderRadius: 20,
        overflow: 'hidden',
        paddingVertical: 12,
        paddingHorizontal: 10,
        marginTop: 14,
    },
    teamStatsFallback: {
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
    },
    teamStatsRow: {
        flexDirection: 'row',
    },
    teamStat: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        justifyContent: 'center',
    },
    teamStatDivider: {
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderLeftColor: 'rgba(255, 255, 255, 0.45)',
    },
    teamStatIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    teamStatValue: {
        fontSize: 19,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#FFFFFF',
    },
    teamStatLabel: {
        fontSize: 11,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#F4FDFF',
    },
    goalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 12,
    },
    goalTrack: {
        flex: 1,
        height: 7,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.28)',
        overflow: 'hidden',
    },
    goalFill: {
        height: '100%',
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
    },
    goalText: {
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#F4FDFF',
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
    trendCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(24, 24, 27, 0.07)',
        boxShadow: CARD_SHADOW,
        padding: 16,
        alignItems: 'center',
    },
    trendHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        alignSelf: 'stretch',
        marginBottom: 14,
    },
    trendTitle: {
        fontSize: 15,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
    },
    trendTotal: {
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#16A34A',
    },
    trendLabels: {
        flexDirection: 'row',
        marginTop: 6,
    },
    trendDay: {
        fontSize: 11,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#A1A1AA',
        textAlign: 'center',
    },
    membersCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(24, 24, 27, 0.07)',
        boxShadow: CARD_SHADOW,
        paddingHorizontal: 14,
        paddingVertical: 4,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        paddingVertical: 10,
    },
    memberDivider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E4E4E7',
    },
    memberRank: {
        width: 18,
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#A1A1AA',
        textAlign: 'center',
    },
    memberBody: {
        flex: 1,
        gap: 1,
    },
    memberName: {
        fontSize: 15,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
    },
    memberMeta: {
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#71717A',
    },
    memberPointsBlock: {
        alignItems: 'flex-end',
    },
    memberPoints: {
        fontSize: 17,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#18181B',
    },
    memberPointsLabel: {
        fontSize: 11,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#A1A1AA',
    },
});
