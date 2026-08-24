import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SettingsShell } from 'components/screens/Settings/SettingsShell';
import { UserAvatar } from 'components/Avatar/UserAvatar';
import { GlassSurface } from 'components/GlassSurface';
import { useSession } from 'context/AuthenticationContext';
import { fetchOfficeTeams, fetchOffices } from 'services/manager-api';
import type { OfficeSummary, OfficeTeam, TeamMember } from 'types/manager.types';

const CARD_SHADOW =
    '0 1px 2px rgba(24, 24, 27, 0.05), 0 10px 26px rgba(24, 24, 27, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.95)';
const TEAL_GRADIENT = ['#067A90', '#0AA6BE', '#00CFE8'] as const;

/** Shift a hex color toward black (negative) or white (positive). */
function shadeColor(hex: string, amount: number) {
    const value = parseInt(hex.slice(1), 16);
    const mix = (channel: number) =>
        Math.round(amount < 0 ? channel * (1 + amount) : channel + (255 - channel) * amount);
    const r = mix((value >> 16) & 255);
    const g = mix((value >> 8) & 255);
    const b = mix(value & 255);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Office-accent version of the hero gradient: deep -> base -> bright. */
function accentGradient(accent: string): [string, string, string] {
    return [shadeColor(accent, -0.45), shadeColor(accent, -0.1), shadeColor(accent, 0.18)];
}

function portraitUrl(portrait: string) {
    return `https://randomuser.me/api/portraits/${portrait}.jpg`;
}

function splitName(name: string): { first: string; last: string } {
    const [first, ...rest] = name.split(' ');
    return { first, last: rest.join(' ') };
}

function goalPct(team: OfficeTeam) {
    return Math.min(100, Math.round((team.points / team.goalPoints) * 100));
}

function AvatarStack({ members, size = 30, onDark = false }: {
    readonly members: readonly TeamMember[];
    readonly size?: number;
    readonly onDark?: boolean;
}) {
    return (
        <View style={styles.avatarStack}>
            {members.slice(0, 4).map((member, index) => {
                const { first, last } = splitName(member.name);
                return (
                    <View
                        key={member.name}
                        style={[
                            styles.avatarStackItem,
                            index > 0 && { marginLeft: -(size / 3) },
                            { borderRadius: (size + 4) / 2, borderColor: onDark ? '#0AA6BE' : '#FFFFFF' },
                        ]}
                    >
                        <UserAvatar
                            firstName={first}
                            lastName={last}
                            imageUrl={portraitUrl(member.portrait)}
                            size={size}
                            color="#18181B"
                            ringWidth={0}
                        />
                    </View>
                );
            })}
            {members.length > 4 ? (
                <View
                    style={[
                        styles.avatarStackItem,
                        styles.avatarOverflow,
                        { marginLeft: -(size / 3), width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 },
                    ]}
                >
                    <Text style={styles.avatarOverflowText}>+{members.length - 4}</Text>
                </View>
            ) : null}
        </View>
    );
}

function PagerStat({ icon, value, label, showDivider }: {
    readonly icon: keyof typeof Ionicons.glyphMap;
    readonly value: string;
    readonly label: string;
    readonly showDivider?: boolean;
}) {
    return (
        <View style={[styles.pagerStat, showDivider && styles.pagerStatDivider]}>
            <View style={styles.pagerStatIcon}>
                <Ionicons name={icon} size={16} color="#FFFFFF" />
            </View>
            <View>
                <Text style={styles.pagerStatValue}>{value}</Text>
                <Text style={styles.pagerStatLabel}>{label}</Text>
            </View>
        </View>
    );
}

/** Office Network-style gradient card that pages through offices with the
 * side arrows; the team list below follows the office on display. */
function OfficePagerCard({ officeName, office, teams, onPrevious, onNext }: {
    readonly officeName: string;
    readonly office: OfficeSummary | undefined;
    readonly teams: readonly OfficeTeam[];
    readonly onPrevious: () => void;
    readonly onNext: () => void;
}) {
    const totalPoints = teams.reduce((sum, team) => sum + team.points, 0);
    const totalMembers = teams.reduce((sum, team) => sum + team.members.length, 0);
    const accent = office?.accentColor ?? teams[0]?.accentColor ?? TEAL_GRADIENT[1];
    return (
        <LinearGradient
            colors={accentGradient(accent)}
            locations={[0, 0.55, 1]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.heroCard}
        >
            <View style={styles.pagerHeader}>
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Previous office"
                    hitSlop={8}
                    onPress={onPrevious}
                    style={styles.pagerArrow}
                >
                    <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.pagerTitleBlock}>
                    <Text style={styles.pagerEyebrow}>Office</Text>
                    <Text style={styles.pagerName} numberOfLines={1}>{officeName}</Text>
                    {office ? <Text style={styles.pagerCity}>{office.city}</Text> : null}
                </View>
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Next office"
                    hitSlop={8}
                    onPress={onNext}
                    style={styles.pagerArrow}
                >
                    <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
            <GlassSurface
                glassEffectStyle="clear"
                style={styles.pagerStatsGlass}
                fallbackStyle={styles.pagerStatsFallback}
            >
                <View style={styles.pagerStatsRow}>
                    <PagerStat icon="people-outline" value={String(teams.length)} label="Teams" />
                    <PagerStat icon="person-outline" value={String(totalMembers)} label="Members" showDivider />
                    <PagerStat icon="star-outline" value={totalPoints.toLocaleString()} label="Points" showDivider />
                </View>
            </GlassSurface>
        </LinearGradient>
    );
}

function TeamCard({ team }: { readonly team: OfficeTeam }) {
    const pct = goalPct(team);
    return (
        <View style={styles.teamCard}>
            <View style={styles.teamTopRow}>
                <View style={[styles.teamEmblem, { backgroundColor: `${team.accentColor}1F` }]}>
                    <Ionicons
                        name={team.emblem as keyof typeof Ionicons.glyphMap}
                        size={18}
                        color={team.accentColor}
                    />
                </View>
                <View style={styles.teamTitleBlock}>
                    <Text style={styles.teamName} numberOfLines={1}>{team.name}</Text>
                    <Text style={styles.teamMeta}>{team.members.length} members</Text>
                </View>
                <View style={styles.teamPointsBlock}>
                    <Text style={styles.teamPoints}>{team.points.toLocaleString()}</Text>
                    <Text style={styles.teamPointsLabel}>pts</Text>
                </View>
            </View>
            <View style={styles.teamBottomRow}>
                <AvatarStack members={team.members} size={26} />
                <View style={styles.weekChip}>
                    <Ionicons name="trending-up" size={12} color="#16A34A" />
                    <Text style={styles.weekChipText}>+{team.pointsThisWeek} this wk</Text>
                </View>
            </View>
            <View style={styles.goalRow}>
                <View style={styles.goalTrack}>
                    <View style={[styles.goalFill, { width: `${pct}%`, backgroundColor: team.accentColor }]} />
                </View>
                <Text style={styles.goalText} numberOfLines={1}>
                    <Ionicons name="gift-outline" size={11} color="#71717A" /> {team.goalLabel} · {pct}%
                </Text>
            </View>
        </View>
    );
}

export default function TeamsScreen() {
    const { session } = useSession();
    const params = useLocalSearchParams<{ office?: string }>();
    const managerId = Number(session?.user?.id ?? 0);
    const [teams, setTeams] = useState<readonly OfficeTeam[] | null>(null);
    const [offices, setOffices] = useState<readonly OfficeSummary[]>([]);
    const [officeIndex, setOfficeIndex] = useState(0);
    const requestedOffice = typeof params.office === 'string' ? params.office : '';

    useEffect(() => {
        const controller = new AbortController();
        fetchOfficeTeams({ managerId, signal: controller.signal })
            .then((loaded) => {
                setTeams(loaded);
                if (requestedOffice) {
                    const names = [...new Set(loaded.map((team) => team.officeName))];
                    const index = names.indexOf(requestedOffice);
                    if (index >= 0) {
                        setOfficeIndex(index);
                    }
                }
            })
            .catch(() => undefined);
        fetchOffices({ managerId, signal: controller.signal })
            .then(setOffices)
            .catch(() => undefined);
        return () => controller.abort();
    }, [managerId, requestedOffice]);

    const addButton = (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create team"
            hitSlop={8}
            // Seam: opens the create-team flow once POST /teams exists.
            onPress={() => Alert.alert('New team', 'Team creation is coming with the backend.')}
            style={({ pressed }) => [pressed && styles.pressed]}
        >
            <GlassSurface
                glassEffectStyle="clear"
                isInteractive
                style={styles.glassButton}
                fallbackStyle={styles.glassButtonFallback}
            >
                <Ionicons name="add" size={22} color="#18181B" />
            </GlassSurface>
        </Pressable>
    );

    if (!teams) {
        return (
            <SettingsShell title="Teams" headerRight={addButton} glassHeader>
                <ActivityIndicator style={styles.loading} color="#18181B" />
            </SettingsShell>
        );
    }

    const ranked = [...teams].sort((a, b) => b.points - a.points);
    const officeNames = [...new Set(teams.map((team) => team.officeName))];
    const safeIndex = officeNames.length > 0 ? officeIndex % officeNames.length : 0;
    const currentOffice = officeNames[safeIndex];
    const officeTeams = ranked.filter((team) => team.officeName === currentOffice);
    const officeDetails = offices.find((office) => office.name === currentOffice);
    const stepOffice = (step: number) =>
        setOfficeIndex((safeIndex + step + officeNames.length) % officeNames.length);

    return (
        <SettingsShell title="Teams" headerRight={addButton} glassHeader>
            {currentOffice ? (
                <OfficePagerCard
                    officeName={currentOffice}
                    office={officeDetails}
                    teams={officeTeams}
                    onPrevious={() => stepOffice(-1)}
                    onNext={() => stepOffice(1)}
                />
            ) : null}

            <View style={styles.teamList}>
                {officeTeams.map((team) => (
                    <TeamCard key={team.id} team={team} />
                ))}
            </View>
        </SettingsShell>
    );
}

const styles = StyleSheet.create({
    loading: {
        marginTop: 48,
    },
    pressed: {
        opacity: 0.7,
    },
    // Bare native glass circle — no background or shadow on the glass node.
    glassButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    glassButtonFallback: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    heroCard: {
        borderRadius: 26,
        padding: 16,
    },
    pagerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    pagerArrow: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pagerTitleBlock: {
        flex: 1,
        alignItems: 'center',
    },
    pagerEyebrow: {
        fontSize: 11,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#CFF6FC',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    pagerName: {
        fontSize: 22,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#FFFFFF',
    },
    pagerCity: {
        marginTop: 1,
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#EAFBFE',
    },
    pagerStatsGlass: {
        borderRadius: 20,
        overflow: 'hidden',
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginTop: 14,
    },
    pagerStatsFallback: {
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
    },
    pagerStatsRow: {
        flexDirection: 'row',
    },
    pagerStat: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        justifyContent: 'center',
    },
    pagerStatDivider: {
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderLeftColor: 'rgba(255, 255, 255, 0.45)',
    },
    pagerStatIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pagerStatValue: {
        fontSize: 20,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#FFFFFF',
    },
    pagerStatLabel: {
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#EAFBFE',
    },
    heroGoalText: {
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#EAFBFE',
    },
    avatarStack: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarStackItem: {
        borderWidth: 2,
        overflow: 'hidden',
    },
    avatarOverflow: {
        backgroundColor: '#F4F4F5',
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarOverflowText: {
        fontSize: 10,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#71717A',
    },
    teamList: {
        gap: 12,
        marginTop: 16,
    },
    teamCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(24, 24, 27, 0.07)',
        boxShadow: CARD_SHADOW,
        padding: 14,
    },
    teamTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
    },
    teamEmblem: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    teamTitleBlock: {
        flex: 1,
    },
    teamName: {
        fontSize: 16,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
    },
    teamMeta: {
        marginTop: 1,
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#71717A',
    },
    teamPointsBlock: {
        alignItems: 'flex-end',
    },
    teamPoints: {
        fontSize: 20,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#18181B',
    },
    teamPointsLabel: {
        fontSize: 11,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#A1A1AA',
    },
    teamBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 11,
    },
    weekChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(22, 163, 74, 0.09)',
        borderRadius: 12,
        paddingHorizontal: 9,
        paddingVertical: 4,
    },
    weekChipText: {
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#16A34A',
    },
    goalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E4E4E7',
        marginTop: 12,
        paddingTop: 11,
    },
    goalTrack: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EDEDF0',
        overflow: 'hidden',
    },
    goalFill: {
        height: '100%',
        borderRadius: 3,
    },
    goalText: {
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#71717A',
    },
});
