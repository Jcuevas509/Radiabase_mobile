import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SettingsShell } from 'components/screens/Settings/SettingsShell';
import { GlassSurface } from 'components/GlassSurface';
import { GlassCircleButton } from 'components/Button/GlassCircleButton';
import { UserAvatar } from 'components/Avatar/UserAvatar';
import { CARD_SHADOW, TEAL_GRADIENT, PILL_GRADIENT, portraitUrl, splitName } from 'constants/design';
import { useSession } from 'context/AuthenticationContext';
import { fetchCompetitions, fetchOffices } from 'services/manager-api';
import type { Competition, CompetitionMetric, OfficeSummary } from 'types/manager.types';

const METRICS: readonly CompetitionMetric[] = ['Knocks', 'Appointments', 'Closes'];
const DURATIONS = [
    { label: 'Weekend', days: 2 },
    { label: '1 week', days: 7 },
    { label: '2 weeks', days: 14 },
    { label: '1 month', days: 30 },
] as const;

const MEDAL_IMAGES = [
    require('../../../assets/images/medals/gold.jpg'),
    require('../../../assets/images/medals/silver.jpg'),
    require('../../../assets/images/medals/bronze.jpg'),
] as const;

function metricIcon(metric: CompetitionMetric): keyof typeof Ionicons.glyphMap {
    if (metric === 'Knocks') return 'hand-left';
    if (metric === 'Appointments') return 'calendar';
    return 'ribbon';
}

function MetaChip({ icon, label, onDark }: {
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

function StandingsRows({ competition }: { readonly competition: Competition }) {
    if (competition.topThree.length === 0) {
        return <Text style={styles.standingsEmpty}>No results yet — standings appear once reps log activity.</Text>;
    }
    return (
        <>
            {competition.topThree.map((standing, index) => {
                const { first, last } = splitName(standing.name);
                return (
                    <View key={standing.name} style={[styles.standingRow, index > 0 && styles.standingRowDivider]}>
                        <Image source={MEDAL_IMAGES[index]} style={styles.medalImage} resizeMode="contain" />
                        <UserAvatar firstName={first} lastName={last} imageUrl={portraitUrl(standing.portrait)} size={30} color="#18181B" ringWidth={1} />
                        <Text style={styles.standingName} numberOfLines={1}>{standing.name}</Text>
                        <Text style={styles.standingValue}>{standing.value.toLocaleString()}</Text>
                        <Text style={styles.standingMetric}>{competition.metric.toLowerCase()}</Text>
                    </View>
                );
            })}
        </>
    );
}

/** Featured active competition: gradient hero with live standings. */
function HeroCompetitionCard({ competition }: { readonly competition: Competition }) {
    return (
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
                    <Text style={styles.heroName} numberOfLines={1}>{competition.name}</Text>
                    <Text style={styles.heroParticipants}>{competition.participantsCount} reps competing</Text>
                </View>
                <View style={styles.endsPill}>
                    <Ionicons name="time-outline" size={13} color="#0A96AC" />
                    <Text style={styles.endsPillText}>{competition.endsInDays}d left</Text>
                </View>
            </View>
            <View style={styles.heroChipsRow}>
                <MetaChip onDark icon={metricIcon(competition.metric)} label={competition.metric} />
                <MetaChip onDark icon="business-outline" label={competition.officeScope} />
            </View>
            <View style={styles.standingsCard}>
                <StandingsRows competition={competition} />
            </View>
            <View style={styles.heroPrizeRow}>
                <Ionicons name="gift-outline" size={15} color="#EAFBFE" />
                <Text style={styles.heroPrizeText} numberOfLines={1}>{competition.prize}</Text>
            </View>
        </LinearGradient>
    );
}

function CompetitionCard({ competition }: { readonly competition: Competition }) {
    const isEnded = competition.status === 'ended';
    const { first, last } = splitName(competition.leaderName);
    const leaderPortrait = competition.topThree[0]?.portrait;
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.cardTrophy, isEnded && styles.cardTrophyEnded]}>
                    <Ionicons name={isEnded ? 'flag' : 'trophy'} size={17} color={isEnded ? '#71717A' : '#0A96AC'} />
                </View>
                <View style={styles.cardTitleBlock}>
                    <Text style={styles.cardName} numberOfLines={1}>{competition.name}</Text>
                    <Text style={styles.cardMeta}>
                        {competition.metric} · {competition.officeScope} · {competition.participantsCount} reps
                    </Text>
                </View>
                {isEnded ? (
                    <View style={styles.endedChip}><Text style={styles.endedChipText}>Ended</Text></View>
                ) : (
                    <View style={styles.daysChip}>
                        <Ionicons name="time-outline" size={12} color="#0A96AC" />
                        <Text style={styles.daysChipText}>{competition.endsInDays}d</Text>
                    </View>
                )}
            </View>
            <View style={styles.cardFooter}>
                <View style={styles.leaderRow}>
                    {leaderPortrait ? (
                        <UserAvatar firstName={first} lastName={last} imageUrl={portraitUrl(leaderPortrait)} size={26} color="#18181B" ringWidth={1} />
                    ) : null}
                    <View>
                        <Text style={styles.leaderLabel}>{isEnded ? 'Winner' : 'Leader'}</Text>
                        <Text style={styles.leaderName} numberOfLines={1}>{competition.leaderName}</Text>
                    </View>
                </View>
                <View style={styles.prizeBlock}>
                    <Ionicons name="gift-outline" size={13} color="#71717A" />
                    <Text style={styles.prizeText} numberOfLines={1}>{competition.prize}</Text>
                </View>
            </View>
        </View>
    );
}

/** Competition builder sheet. Local-only: launching prepends to the list.
 * Seam: POST /competitions with the same payload once the API exists. */
function CompetitionBuilder({
    visible,
    offices,
    onClose,
    onLaunch,
}: {
    readonly visible: boolean;
    readonly offices: readonly OfficeSummary[];
    readonly onClose: () => void;
    readonly onLaunch: (competition: Competition) => void;
}) {
    const [name, setName] = useState('');
    const [metric, setMetric] = useState<CompetitionMetric>('Knocks');
    const [scope, setScope] = useState('All offices');
    const [durationDays, setDurationDays] = useState<number>(7);
    const [prize, setPrize] = useState('');

    const metricAnim = useRef(new Animated.Value(0)).current;
    const [metricTrackWidth, setMetricTrackWidth] = useState(0);
    useEffect(() => {
        Animated.spring(metricAnim, {
            toValue: METRICS.indexOf(metric),
            useNativeDriver: true,
            friction: 10,
            tension: 110,
        }).start();
    }, [metric, metricAnim]);
    const metricPillWidth = metricTrackWidth > 0 ? (metricTrackWidth - 8) / METRICS.length : 0;

    const scopeOptions = ['All offices', ...offices.map((office) => office.name)];
    const participantsFor = (selected: string) =>
        selected === 'All offices'
            ? offices.reduce((sum, office) => sum + office.repsCount, 0)
            : offices.find((office) => office.name === selected)?.repsCount ?? 0;
    const canLaunch = name.trim().length > 0 && prize.trim().length > 0;

    const handleLaunch = () => {
        onLaunch({
            id: Date.now(),
            name: name.trim(),
            metric,
            status: 'active',
            officeScope: scope,
            endsInDays: durationDays,
            participantsCount: participantsFor(scope),
            prize: prize.trim(),
            leaderName: '—',
            topThree: [],
        });
        setName('');
        setPrize('');
        setMetric('Knocks');
        setScope('All offices');
        setDurationDays(7);
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.builderRoot}>
                <View style={styles.builderHeader}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Close builder" hitSlop={10} onPress={onClose}>
                        <Text style={styles.builderCancel}>Cancel</Text>
                    </Pressable>
                    <Text style={styles.builderTitle}>New competition</Text>
                    <View style={styles.builderHeaderSpacer} />
                </View>
                <ScrollView contentContainerStyle={styles.builderContent} keyboardShouldPersistTaps="handled">
                    <Text style={styles.fieldLabel}>Name</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Blitz Weekend"
                        placeholderTextColor="#A1A1AA"
                        returnKeyType="done"
                    />

                    <Text style={styles.fieldLabel}>Metric</Text>
                    <View
                        style={styles.metricRow}
                        onLayout={(event) => setMetricTrackWidth(event.nativeEvent.layout.width)}
                    >
                        {metricPillWidth > 0 ? (
                            <Animated.View
                                style={[
                                    styles.metricPill,
                                    {
                                        width: metricPillWidth,
                                        transform: [{
                                            translateX: metricAnim.interpolate({
                                                inputRange: [0, METRICS.length - 1],
                                                outputRange: [0, metricPillWidth * (METRICS.length - 1)],
                                            }),
                                        }],
                                    },
                                ]}
                            >
                                <LinearGradient
                                    colors={[...PILL_GRADIENT]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={StyleSheet.absoluteFill}
                                />
                            </Animated.View>
                        ) : null}
                        {METRICS.map((option) => (
                            <TouchableOpacity key={option} style={styles.metricChip} onPress={() => setMetric(option)}>
                                <Text style={[styles.metricText, metric === option && styles.metricTextActive]}>
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.fieldLabel}>Who competes</Text>
                    <View style={styles.chipWrap}>
                        {scopeOptions.map((option) => {
                            const isActive = scope === option;
                            return (
                                <TouchableOpacity
                                    key={option}
                                    style={[styles.choiceChip, isActive && styles.choiceChipActive]}
                                    onPress={() => setScope(option)}
                                >
                                    <Text style={[styles.choiceChipText, isActive && styles.choiceChipTextActive]}>
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <Text style={styles.fieldLabel}>Duration</Text>
                    <View style={styles.chipWrap}>
                        {DURATIONS.map((option) => {
                            const isActive = durationDays === option.days;
                            return (
                                <TouchableOpacity
                                    key={option.label}
                                    style={[styles.choiceChip, isActive && styles.choiceChipActive]}
                                    onPress={() => setDurationDays(option.days)}
                                >
                                    <Text style={[styles.choiceChipText, isActive && styles.choiceChipTextActive]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <Text style={styles.fieldLabel}>Prize</Text>
                    <TextInput
                        style={styles.input}
                        value={prize}
                        onChangeText={setPrize}
                        placeholder="$250 + steak dinner"
                        placeholderTextColor="#A1A1AA"
                        returnKeyType="done"
                    />

                    <Text style={styles.fieldLabel}>Preview</Text>
                    <LinearGradient
                        colors={[...TEAL_GRADIENT]}
                        locations={[0, 0.55, 1]}
                        start={{ x: 0.1, y: 0 }}
                        end={{ x: 0.9, y: 1 }}
                        style={styles.previewCard}
                    >
                        <View style={styles.heroTrophy}>
                            <Ionicons name="trophy" size={20} color="#FFFFFF" />
                        </View>
                        <View style={styles.previewText}>
                            <Text style={styles.previewName} numberOfLines={1}>
                                {name.trim() || 'Competition name'}
                            </Text>
                            <Text style={styles.previewMeta} numberOfLines={1}>
                                {metric} · {scope} · {durationDays}d · {participantsFor(scope)} reps
                            </Text>
                            <Text style={styles.previewPrize} numberOfLines={1}>
                                {prize.trim() || 'Prize goes here'}
                            </Text>
                        </View>
                    </LinearGradient>

                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Launch competition"
                        disabled={!canLaunch}
                        onPress={handleLaunch}
                        activeOpacity={0.85}
                        style={[styles.launchButton, !canLaunch && styles.launchButtonDisabled]}
                    >
                        <LinearGradient
                            colors={[...TEAL_GRADIENT]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.launchGradient}
                        >
                            <Ionicons name="rocket-outline" size={17} color="#FFFFFF" />
                            <Text style={styles.launchText}>Launch competition</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </Modal>
    );
}

export default function CompetitionsScreen() {
    const { session } = useSession();
    const managerId = Number(session?.user?.id ?? 0);
    const [competitions, setCompetitions] = useState<readonly Competition[] | null>(null);
    const [offices, setOffices] = useState<readonly OfficeSummary[]>([]);
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        fetchCompetitions({ managerId, signal: controller.signal })
            .then(setCompetitions)
            .catch(() => undefined);
        fetchOffices({ managerId, signal: controller.signal })
            .then(setOffices)
            .catch(() => undefined);
        return () => controller.abort();
    }, [managerId]);

    const addButton = (
        <GlassCircleButton icon="add" accessibilityLabel="New competition" onPress={() => setIsBuilderOpen(true)} />
    );

    if (!competitions) {
        return (
            <SettingsShell title="Competitions" headerRight={addButton} glassHeader>
                <ActivityIndicator style={styles.loading} color="#18181B" />
            </SettingsShell>
        );
    }

    const active = competitions.filter((competition) => competition.status === 'active');
    const ended = competitions.filter((competition) => competition.status === 'ended');
    const [featured, ...otherActive] = active;

    return (
        <SettingsShell title="Competitions" headerRight={addButton} glassHeader>
            {featured ? (
                <>
                    <Text style={[styles.sectionTitle, styles.sectionTitleFirst]}>Main event</Text>
                    <HeroCompetitionCard competition={featured} />
                </>
            ) : null}

            {otherActive.length > 0 ? (
                <>
                    <Text style={styles.sectionTitle}>Mini competitions</Text>
                    <View style={styles.cardList}>
                        {otherActive.map((competition) => (
                            <CompetitionCard key={competition.id} competition={competition} />
                        ))}
                    </View>
                </>
            ) : null}

            {ended.length > 0 ? (
                <>
                    <Text style={styles.sectionTitle}>Finished</Text>
                    <View style={styles.cardList}>
                        {ended.map((competition) => (
                            <CompetitionCard key={competition.id} competition={competition} />
                        ))}
                    </View>
                </>
            ) : null}

            <CompetitionBuilder
                visible={isBuilderOpen}
                offices={offices}
                onClose={() => setIsBuilderOpen(false)}
                onLaunch={(competition) => {
                    setCompetitions((current) => [competition, ...(current ?? [])]);
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
    builderRoot: {
        flex: 1,
        backgroundColor: '#F1F2F4',
    },
    builderHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 10,
    },
    builderCancel: {
        fontSize: 15,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#71717A',
        width: 60,
    },
    builderTitle: {
        fontSize: 17,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
    },
    builderHeaderSpacer: {
        width: 60,
    },
    builderContent: {
        padding: 18,
        paddingBottom: 40,
    },
    fieldLabel: {
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#71717A',
        marginBottom: 7,
        marginTop: 16,
        marginLeft: 2,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(24, 24, 27, 0.07)',
        boxShadow: CARD_SHADOW,
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: 15,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
    },
    metricRow: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 4,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(24, 24, 27, 0.07)',
        boxShadow: CARD_SHADOW,
    },
    metricPill: {
        position: 'absolute',
        top: 4,
        left: 4,
        bottom: 4,
        borderRadius: 16,
        overflow: 'hidden',
    },
    metricChip: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
    },
    metricText: {
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#52525B',
    },
    metricTextActive: {
        color: '#FFFFFF',
    },
    chipWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    choiceChip: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(24, 24, 27, 0.07)',
        boxShadow: CARD_SHADOW,
    },
    choiceChipActive: {
        backgroundColor: '#18181B',
        borderColor: '#18181B',
    },
    choiceChipText: {
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#52525B',
    },
    choiceChipTextActive: {
        color: '#FFFFFF',
    },
    previewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: 20,
        padding: 14,
    },
    previewText: {
        flex: 1,
    },
    previewName: {
        fontSize: 16,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#FFFFFF',
    },
    previewMeta: {
        marginTop: 1,
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#EAFBFE',
    },
    previewPrize: {
        marginTop: 3,
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#EAFBFE',
    },
    launchButton: {
        marginTop: 22,
        borderRadius: 18,
        overflow: 'hidden',
    },
    launchButtonDisabled: {
        opacity: 0.45,
    },
    launchGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 52,
    },
    launchText: {
        fontSize: 16,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#FFFFFF',
    },
});
