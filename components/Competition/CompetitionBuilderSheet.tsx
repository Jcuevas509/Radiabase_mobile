import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
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
import { PILL_GRADIENT, TEAL_GRADIENT, CARD_SHADOW } from 'constants/design';
import type {
    CompetitionDivision,
    CompetitionEvent,
    CompetitionMetric,
    CompetitionRound,
    OfficeSummary,
} from 'types/manager.types';
import { formatDateRange } from 'utils/competition';

const METRICS: readonly CompetitionMetric[] = ['Knocks', 'Appointments', 'Closes'];
const DIVISIONS: readonly CompetitionDivision[] = ['Setters', 'Closers'];
const DURATIONS = [
    { label: '1 week', days: 7 },
    { label: '2 weeks', days: 14 },
    { label: '1 month', days: 30 },
    { label: '6 weeks', days: 42 },
    { label: '2 months', days: 60 },
] as const;

function isoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

/** Evenly split the event window into rounds; the last one is Finals. */
function buildRounds(input: {
    readonly durationDays: number;
    readonly roundsCount: number;
    readonly advanceTop: number;
    readonly divisions: readonly CompetitionDivision[];
    readonly roundPrize: string;
}): CompetitionRound[] {
    const start = new Date();
    const roundLength = Math.max(1, Math.round(input.durationDays / input.roundsCount));
    return Array.from({ length: input.roundsCount }, (_, index) => {
        const roundStart = new Date(start.getTime() + index * roundLength * 86_400_000);
        const roundEnd = new Date(roundStart.getTime() + (roundLength - 1) * 86_400_000);
        const isLast = index === input.roundsCount - 1;
        const advance = isLast
            ? null
            : Object.fromEntries(input.divisions.map((division) => [division, input.advanceTop]));
        return {
            roundNumber: index + 1,
            label: isLast && input.roundsCount > 1 ? 'Finals' : input.roundsCount > 1 ? `Round ${index + 1}` : 'Event',
            startDate: isoDate(roundStart),
            endDate: isoDate(roundEnd),
            advance,
            prize: !isLast && input.roundPrize.trim() ? input.roundPrize.trim() : null,
            standings: [],
        };
    });
}

function Stepper({ label, value, min, max, onChange }: {
    readonly label: string;
    readonly value: number;
    readonly min: number;
    readonly max: number;
    readonly onChange: (value: number) => void;
}) {
    return (
        <View style={styles.stepperRow}>
            <Text style={styles.stepperLabel}>{label}</Text>
            <View style={styles.stepperControls}>
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Decrease ${label}`}
                    disabled={value <= min}
                    onPress={() => onChange(Math.max(min, value - 1))}
                    style={[styles.stepperButton, value <= min && styles.stepperButtonDisabled]}
                >
                    <Ionicons name="remove" size={16} color="#18181B" />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{value}</Text>
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Increase ${label}`}
                    disabled={value >= max}
                    onPress={() => onChange(Math.min(max, value + 1))}
                    style={[styles.stepperButton, value >= max && styles.stepperButtonDisabled]}
                >
                    <Ionicons name="add" size={16} color="#18181B" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

function ChoiceChip({ label, isActive, onPress }: {
    readonly label: string;
    readonly isActive: boolean;
    readonly onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={[styles.choiceChip, isActive && styles.choiceChipActive]}
            onPress={onPress}
        >
            <Text style={[styles.choiceChipText, isActive && styles.choiceChipTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

/**
 * The event builder: one main event, optionally structured into rounds
 * with per-round advancement. Local-only; the launch payload is the
 * contract for the rebuilt competitions backend.
 */
export function CompetitionBuilderSheet({ visible, offices, onClose, onLaunch }: {
    readonly visible: boolean;
    readonly offices: readonly OfficeSummary[];
    readonly onClose: () => void;
    readonly onLaunch: (event: CompetitionEvent) => void;
}) {
    const [name, setName] = useState('');
    const [metric, setMetric] = useState<CompetitionMetric>('Knocks');
    const [divisions, setDivisions] = useState<readonly CompetitionDivision[]>(['Setters', 'Closers']);
    const [scopeOffices, setScopeOffices] = useState<readonly string[]>([]);
    const [isRoundsFormat, setIsRoundsFormat] = useState(true);
    const [roundsCount, setRoundsCount] = useState(4);
    const [advanceTop, setAdvanceTop] = useState(3);
    const [durationDays, setDurationDays] = useState<number>(42);
    const [grandPrize, setGrandPrize] = useState('');
    const [roundPrize, setRoundPrize] = useState('');

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

    const toggleDivision = (division: CompetitionDivision) => {
        setDivisions((current) => {
            if (current.includes(division)) {
                return current.length > 1 ? current.filter((entry) => entry !== division) : current;
            }
            return [...current, division];
        });
    };

    const toggleOffice = (officeName: string) => {
        setScopeOffices((current) =>
            current.includes(officeName)
                ? current.filter((entry) => entry !== officeName)
                : [...current, officeName],
        );
    };

    const participantsFor = (): number => {
        const inScope = scopeOffices.length === 0
            ? offices
            : offices.filter((office) => scopeOffices.includes(office.name));
        return inScope.reduce((sum, office) => sum + office.repsCount, 0);
    };

    const effectiveRounds = isRoundsFormat ? roundsCount : 1;
    const rounds = buildRounds({
        durationDays,
        roundsCount: effectiveRounds,
        advanceTop,
        divisions,
        roundPrize,
    });
    const canLaunch = name.trim().length > 0 && grandPrize.trim().length > 0;

    const handleLaunch = () => {
        onLaunch({
            id: Date.now(),
            name: name.trim(),
            metric,
            divisions,
            officeScope: scopeOffices,
            grandPrize: grandPrize.trim(),
            participantsCount: participantsFor(),
            rounds: buildRounds({
                durationDays,
                roundsCount: effectiveRounds,
                advanceTop,
                divisions,
                roundPrize,
            }).map((round, index) =>
                index === 0 ? { ...round, label: effectiveRounds === 1 ? name.trim() : round.label } : round,
            ),
        });
        setName('');
        setGrandPrize('');
        setRoundPrize('');
        setScopeOffices([]);
        setIsRoundsFormat(true);
        setRoundsCount(4);
        setAdvanceTop(3);
        setDurationDays(42);
        setMetric('Knocks');
        setDivisions(['Setters', 'Closers']);
    };

    const summary = [
        effectiveRounds === 1 ? 'Single event' : `${effectiveRounds} rounds`,
        formatDateRange(rounds[0].startDate, rounds[rounds.length - 1].endDate),
        effectiveRounds > 1 ? `top ${advanceTop} advance` : null,
        `${participantsFor()} reps`,
    ].filter(Boolean).join(' · ');

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.sheetRoot}>
                <View style={styles.sheetHeader}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Close builder" hitSlop={10} onPress={onClose}>
                        <Text style={styles.sheetCancel}>Cancel</Text>
                    </Pressable>
                    <Text style={styles.sheetTitle}>New competition</Text>
                    <View style={styles.sheetSpacer} />
                </View>
                <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
                    <Text style={styles.fieldLabel}>Name</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Summer Slam"
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

                    <Text style={styles.fieldLabel}>Divisions</Text>
                    <View style={styles.chipWrap}>
                        {DIVISIONS.map((division) => (
                            <ChoiceChip
                                key={division}
                                label={division}
                                isActive={divisions.includes(division)}
                                onPress={() => toggleDivision(division)}
                            />
                        ))}
                    </View>

                    <Text style={styles.fieldLabel}>Offices (none selected = whole org)</Text>
                    <View style={styles.chipWrap}>
                        <ChoiceChip
                            label="All offices"
                            isActive={scopeOffices.length === 0}
                            onPress={() => setScopeOffices([])}
                        />
                        {offices.map((office) => (
                            <ChoiceChip
                                key={office.id}
                                label={office.name}
                                isActive={scopeOffices.includes(office.name)}
                                onPress={() => toggleOffice(office.name)}
                            />
                        ))}
                    </View>

                    <Text style={styles.fieldLabel}>Format</Text>
                    <View style={styles.chipWrap}>
                        <ChoiceChip label="Single event" isActive={!isRoundsFormat} onPress={() => setIsRoundsFormat(false)} />
                        <ChoiceChip label="Rounds" isActive={isRoundsFormat} onPress={() => setIsRoundsFormat(true)} />
                    </View>
                    {isRoundsFormat ? (
                        <View style={styles.stepperCard}>
                            <Stepper label="Rounds" value={roundsCount} min={2} max={6} onChange={setRoundsCount} />
                            <View style={styles.stepperDivider} />
                            <Stepper label="Advance top" value={advanceTop} min={1} max={12} onChange={setAdvanceTop} />
                        </View>
                    ) : null}

                    <Text style={styles.fieldLabel}>Duration</Text>
                    <View style={styles.chipWrap}>
                        {DURATIONS.map((option) => (
                            <ChoiceChip
                                key={option.label}
                                label={option.label}
                                isActive={durationDays === option.days}
                                onPress={() => setDurationDays(option.days)}
                            />
                        ))}
                    </View>

                    <Text style={styles.fieldLabel}>Grand prize</Text>
                    <TextInput
                        style={styles.input}
                        value={grandPrize}
                        onChangeText={setGrandPrize}
                        placeholder="Cabo trip for two"
                        placeholderTextColor="#A1A1AA"
                        returnKeyType="done"
                    />
                    {isRoundsFormat ? (
                        <>
                            <Text style={styles.fieldLabel}>Round prize (optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={roundPrize}
                                onChangeText={setRoundPrize}
                                placeholder="Steak dinner per round winner"
                                placeholderTextColor="#A1A1AA"
                                returnKeyType="done"
                            />
                        </>
                    ) : null}

                    <Text style={styles.fieldLabel}>Preview</Text>
                    <LinearGradient
                        colors={[...TEAL_GRADIENT]}
                        locations={[0, 0.55, 1]}
                        start={{ x: 0.1, y: 0 }}
                        end={{ x: 0.9, y: 1 }}
                        style={styles.previewCard}
                    >
                        <View style={styles.previewTrophy}>
                            <Ionicons name="trophy" size={20} color="#FFFFFF" />
                        </View>
                        <View style={styles.previewText}>
                            <Text style={styles.previewName} numberOfLines={1}>
                                {name.trim() || 'Competition name'}
                            </Text>
                            <Text style={styles.previewMeta} numberOfLines={2}>
                                {metric} · {divisions.join(' + ')} · {summary}
                            </Text>
                            <Text style={styles.previewPrize} numberOfLines={1}>
                                {grandPrize.trim() || 'Grand prize goes here'}
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

const styles = StyleSheet.create({
    sheetRoot: {
        flex: 1,
        backgroundColor: '#F1F2F4',
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 10,
    },
    sheetCancel: {
        fontSize: 15,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#71717A',
        width: 60,
    },
    sheetTitle: {
        fontSize: 17,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
    },
    sheetSpacer: {
        width: 60,
    },
    sheetContent: {
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
    stepperCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(24, 24, 27, 0.07)',
        boxShadow: CARD_SHADOW,
        paddingHorizontal: 14,
        marginTop: 10,
    },
    stepperRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 11,
    },
    stepperDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#E4E4E7',
    },
    stepperLabel: {
        fontSize: 14,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
    },
    stepperControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    stepperButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#F4F4F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperButtonDisabled: {
        opacity: 0.4,
    },
    stepperValue: {
        minWidth: 22,
        textAlign: 'center',
        fontSize: 16,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#18181B',
    },
    previewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: 20,
        padding: 14,
    },
    previewTrophy: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        alignItems: 'center',
        justifyContent: 'center',
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
