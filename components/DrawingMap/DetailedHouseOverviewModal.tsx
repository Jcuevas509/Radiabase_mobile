import React, { useState, useEffect, useRef } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Linking } from 'react-native';
import { PlainModal } from 'components/Modal/Modal';
import { Button } from '../Button/Button';
import { customerStatuses, leadStatuses } from 'constants/leadStatuses';
import { MaterialIcons, FontAwesome6, Octicons, Ionicons } from '@expo/vector-icons';
import { BuildingProps, LeadStatus } from 'types/componentsTypes';
import Slider from '@react-native-community/slider';
import { useKeyboard } from 'hooks/useKeyboard';
import { StatusCard } from 'components/Card/StatusCard';

import { AssigneeCard } from 'components/Card/AssigneeCard';
import { InputField } from 'components/Input/InputField';
import { StatusTooltip } from 'components/Tooltip/StatusTooltip';
import { isUnknownMapAddress } from 'utils/parse-house-address';
import { reverseGeocodeHouseAddress } from 'utils/reverse-geocode-house-address';
interface DetailedHouseOverviewModalProps {
    visible: boolean;
    onClose: () => void;
    onDismiss?: () => void;
    selectedHouse: BuildingProps;
    isStatusSaving: boolean;
    savingStatusId: number | null;
    onOpenSubmitLead: (value: BuildingProps) => void;
    onUpdateLead: (value: BuildingProps) => Promise<void> | void;
    onChangeHouseStatus: (status: LeadStatus) => Promise<void> | void;
    onSaveNotes: (note: string) => void;
    onSaveHomeowner: (value: BuildingProps) => void;
}

export const DetailedHouseOverviewModal: React.FC<DetailedHouseOverviewModalProps> = ({
    visible,
    onClose,
    onDismiss,
    selectedHouse,
    isStatusSaving,
    savingStatusId,
    onOpenSubmitLead,
    onUpdateLead,
    onChangeHouseStatus,
    onSaveNotes,
    onSaveHomeowner,
}) => {
    const { keyboardShown, keyboardHeight } = useKeyboard()
    const scrollViewRef = useRef<ScrollView>(null);
    const [showStatusHistory, setShowStatusHistory] = useState<boolean>(false)
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [age, setAge] = useState('');
    const [houseBuilt, setHouseBuilt] = useState('');
    const [isOwner, setIsOwner] = useState(false);
    const [creditScore, setCreditScore] = useState(500);
    const [note, setNote] = useState('')
    const [customerTab, setCustomerTab] = useState(false);
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const [isNoteFocused, setIsNoteFocused] = useState(false)
    const [isValidEmail, setIsValidEmail] = useState(true)
    const [isConverting, setIsConverting] = useState(false)
    const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
    const [isResolvingAddress, setIsResolvingAddress] = useState(false);
    const currentStatus = leadStatuses.find(status => status?.statusId === selectedHouse?.statusId) || null;
    const leadId = selectedHouse?.additionalDetails?.leadId as number | null | undefined;
    const hasLead = Boolean(leadId);
    const hasInvalidEmail = email.trim().length > 0 && !isValidEmail;
    const displayAddress = !isUnknownMapAddress(selectedHouse?.address)
        ? selectedHouse?.address
        : resolvedAddress;

    const buildUpdatedHouse = (): BuildingProps => ({
        ...selectedHouse,
        assignee: {
            ...selectedHouse?.assignee,
            name: firstName,
            lastname: lastName,
            phone: phoneNumber,
            email: email
        },
        additionalDetails: {
            ...selectedHouse?.additionalDetails,
            age: age,
            houseBuilt: houseBuilt,
            isOwner: isOwner,
            creditScore: creditScore,
            note: note
        }
    });



    useEffect(() => {
        if (!visible) {
            return;
        }
        setFirstName(selectedHouse?.assignee?.name || '');
        setLastName(selectedHouse?.assignee?.lastname || '');
        setPhoneNumber(selectedHouse?.assignee?.phone || '');
        setEmail(selectedHouse?.assignee?.email || '');
        setAge(selectedHouse?.additionalDetails?.age || '');
        setHouseBuilt(selectedHouse?.additionalDetails?.houseBuilt || '');
        setIsOwner(selectedHouse?.additionalDetails?.isOwner || false);
        setCreditScore(selectedHouse?.additionalDetails?.creditScore || 500);
        setNote(selectedHouse?.additionalDetails?.note || '')
    }, [visible, selectedHouse?.id])

    // Same Apple reverse-geocode the Submit Lead form uses: when the backend
    // has no address for this parcel, resolve one from the pin coordinates.
    useEffect(() => {
        setResolvedAddress(null);
        if (!visible
            || !isUnknownMapAddress(selectedHouse?.address)
            || selectedHouse?.latitude == null
            || selectedHouse?.longitude == null) {
            return;
        }
        let isActive = true;
        setIsResolvingAddress(true);
        reverseGeocodeHouseAddress(selectedHouse.latitude, selectedHouse.longitude)
            .then((address) => {
                if (!isActive || !address) {
                    return;
                }
                const line = [
                    address.addressLine1,
                    address.city,
                    [address.state, address.zip].filter(Boolean).join(' '),
                ].filter(Boolean).join(', ');
                if (line) {
                    setResolvedAddress(line);
                }
            })
            .catch(() => undefined)
            .finally(() => {
                if (isActive) {
                    setIsResolvingAddress(false);
                }
            });
        return () => {
            isActive = false;
        };
    }, [visible, selectedHouse?.id])

    // useEffect(() => {
    //     if (keyboardShown) {
    //         setTimeout(() => {
    //             scrollViewRef.current?.scrollToEnd({ animated: true });
    //         }, 50);
    //     }
    // }, [keyboardShown]);

    const handleInputFocus = (toTop: boolean) => {
        if (!scrollViewRef.current) return;
        if (!toTop) setIsNoteFocused(true)
        requestAnimationFrame(() => {
            if (toTop) {
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            } else {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }
        });
    };

    const persistHomeowner = () => {
        onSaveHomeowner(buildUpdatedHouse());
    };

    // 650+ is the approval target; below that financing usually falls through.
    const creditColor = creditScore >= 650 ? '#16A34A' : creditScore >= 580 ? '#F59E0B' : '#EF4444';

    const openProjectSunroof = () => {
        if (selectedHouse?.latitude == null || selectedHouse?.longitude == null) {
            return;
        }
        Linking.openURL(`https://sunroof.withgoogle.com/building/${selectedHouse.latitude}/${selectedHouse.longitude}`).catch(() => null);
    };

    const openGoogleMaps = () => {
        if (selectedHouse?.latitude == null || selectedHouse?.longitude == null) {
            return;
        }
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${selectedHouse.latitude},${selectedHouse.longitude}`).catch(() => null);
    };

    const openAppleMaps = () => {
        if (selectedHouse?.latitude == null || selectedHouse?.longitude == null) {
            return;
        }
        const query = displayAddress ? `&q=${encodeURIComponent(displayAddress)}` : '';
        Linking.openURL(`http://maps.apple.com/?ll=${selectedHouse.latitude},${selectedHouse.longitude}${query}`).catch(() => null);
    };

    const handleLeadAction = async () => {
        const updatedHouse = buildUpdatedHouse();
        persistHomeowner();
        if (!hasLead) {
            onOpenSubmitLead(updatedHouse);
            return;
        }
        setIsConverting(true);
        try {
            await onUpdateLead(updatedHouse);
        } finally {
            setIsConverting(false);
        }
    };

    const persistAndClose = () => {
        persistHomeowner();
        if (note !== (selectedHouse?.additionalDetails?.note || '')) {
            onSaveNotes(note);
        }
        onClose();
    };

    const handleLeadStatusPress = async (status: LeadStatus) => {
        if (currentStatus?.statusId === status.statusId || isStatusSaving) {
            return;
        }
        await onChangeHouseStatus(status);
    };

    const handleContentSizeChange = () => {
        if (isNoteFocused) {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }
    };

    const LeadStatusTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.statuses}>
                {leadStatuses.map((status) => (
                    <View style={styles.singleStatus} key={status.shortName}>
                        <Text style={styles.buttonText}>{status.shortName}</Text>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel={`Set house status to ${status.fullName}`}
                            accessibilityState={{
                                busy: savingStatusId === status.statusId,
                                disabled: currentStatus?.statusId === status.statusId || isStatusSaving,
                            }}
                            style={[
                                styles.button,
                                {
                                    backgroundColor: status.color,
                                    opacity: currentStatus?.statusId === status.statusId ||
                                        (isStatusSaving && savingStatusId !== status.statusId) ? 0.2 : 1,
                                },
                            ]}
                            onPress={() => void handleLeadStatusPress(status)}
                            disabled={currentStatus?.statusId === status.statusId || isStatusSaving}
                        >
                            {savingStatusId === status.statusId
                                ? <ActivityIndicator color="white" size="small" />
                                : <status.icon color="white" />}
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </View>
    );

    const CustomerStatusTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.statuses}>
                {customerStatuses.map((status) => (
                    <View style={styles.singleStatus} key={status.shortName}>
                        <Text style={styles.buttonText}>{status.shortName}</Text>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: status.color }]}
                            onPress={() => undefined}
                        >
                            <status.icon color="white" />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </View>
    );
    const StatusHistory = () => (
        <View>
            <TouchableOpacity onPress={() => setShowStatusHistory(false)} style={styles.historyCloseButton} hitSlop={8}>
                <Text style={styles.historyCloseText}>Close status history</Text>
                <Ionicons name="close" size={18} color="black" />
            </TouchableOpacity>
            {selectedHouse?.statuses?.slice().reverse().map((status, index) => (
                <StatusCard
                    key={index}
                    statusId={status}
                    index={index}
                    current={index === 0}
                />
            ))}
            {selectedHouse?.assignee &&
                <AssigneeCard
                    assignee={selectedHouse?.assignee}
                />

            }
        </View>
    );
    return (
        <PlainModal
            visible={visible}
            onClose={persistAndClose}
            onDismiss={onDismiss}
            hasButtonDivider={false}
            topAccent
            compactBottom
            customTitle={
                <View style={styles.customTitleContainer}>
                    <View style={[styles.statusContainer, { borderColor: currentStatus?.color || '#E4E4E7', backgroundColor: currentStatus?.color || '#F4F4F5' }]}>
                        {currentStatus
                            ? <currentStatus.icon color="white" />
                            : <FontAwesome6 name="house" size={14} color="#A1A1AA" />}
                    </View>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.addressTitle} numberOfLines={2}>
                            {displayAddress || (isResolvingAddress ? 'Finding address…' : 'Unknown Address')}
                        </Text>
                    </View>
                </View>
            }
            buttons={
                <Button
                    text={hasLead ? 'Update Lead' : 'Convert to Lead'}
                    buttonStyle={styles.leadActionButton}
                    textStyle={styles.leadActionButtonText}
                    onPress={handleLeadAction}
                    isDisabled={hasInvalidEmail}
                    isLoading={isConverting}
                />
            }
        >

            {/* <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollViewContainerStyle}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            > */}
            <View style={styles.body}>
                <ScrollView
                    ref={scrollViewRef}
                    style={[styles.scrollView]}
                    contentContainerStyle={[
                        styles.scrollViewContent,
                        { paddingBottom: keyboardShown ? keyboardHeight - 100 : 0 }
                    ]}
                    onContentSizeChange={handleContentSizeChange}

                    keyboardShouldPersistTaps="handled">
                    {showStatusHistory && <StatusHistory />}
                    {hasLead ? (
                        <Text style={styles.leadBadge}>Lead #{leadId}</Text>
                    ) : null}
                    <View style={styles.mainInputContainer}>
                        <View style={{ width: '49%' }}>
                            <InputField
                                value={firstName}
                                placeholder="First Name"
                                onChange={setFirstName}
                                onFocus={() => handleInputFocus(true)}
                                onBlur={persistHomeowner}
                            />
                            <InputField
                                value={phoneNumber}
                                placeholder="Phone Number"
                                onChange={setPhoneNumber}
                                keyboardType="phone-pad"
                                onFocus={() => handleInputFocus(true)}
                                onBlur={persistHomeowner}
                            />
                            <InputField
                                value={age}
                                placeholder="Age"
                                onChange={setAge}
                                keyboardType="numeric"
                                onFocus={() => handleInputFocus(true)}
                            />
                        </View>
                        <View style={{ width: '49%' }}>
                            <InputField
                                value={lastName}
                                placeholder="Last Name"
                                onChange={setLastName}
                                onFocus={() => handleInputFocus(true)}
                                onBlur={persistHomeowner}
                            />
                            <InputField
                                value={email}
                                placeholder="Email"
                                onChange={(text, isValid) => {
                                    setEmail(text);
                                    setIsValidEmail(isValid ?? true)
                                }}
                                keyboardType="email-address"
                                isEmail={true}
                                onFocus={() => handleInputFocus(true)}
                                onBlur={persistHomeowner}
                            />
                            <InputField
                                value={houseBuilt}
                                placeholder="House Built"
                                onChange={setHouseBuilt}
                                onFocus={() => handleInputFocus(true)}
                            />
                        </View>
                    </View>
                    <View style={styles.creditRow}>
                        <Text style={styles.creditLabel}>Credit</Text>
                        <Slider
                            style={styles.creditSlider}
                            minimumValue={300}
                            maximumValue={850}
                            value={creditScore}
                            minimumTrackTintColor={creditColor}
                            maximumTrackTintColor='#E4E4E7'
                            thumbTintColor={creditColor}
                            onValueChange={setCreditScore}
                            step={5}
                        />
                        <Text style={[styles.creditValue, { color: creditColor }]}>
                            {creditScore >= 850 ? '850+' : Math.round(creditScore)}
                        </Text>
                    </View>

                    <View style={styles.tabViewContainer}>
                        <View style={styles.sliderContainer}>
                            <View style={styles.tabBar}>
                                <TouchableOpacity
                                    style={[styles.tabItem, !customerTab && styles.activeTabItem]}
                                    onPress={() => setCustomerTab(false)}
                                >
                                    <Text style={[styles.tabText, !customerTab && styles.activeTabText]}>Lead Status</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.tabItem, customerTab && styles.activeTabItem]}
                                    onPress={() => setCustomerTab(true)}
                                >
                                    <Text style={[styles.tabText, customerTab && styles.activeTabText]}>Customer Status</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.infoButton} onPress={() => setIsTooltipVisible(true)}>
                                <Octicons name="question" size={18} color="black" />
                            </TouchableOpacity>

                        </View>
                        <View>
                            {!customerTab ? <LeadStatusTab /> : <CustomerStatusTab />}
                        </View>
                    </View>
                    <View >
                        <InputField
                            style={[styles.noteInput]}
                            placeholder="Add Notes"
                            multiline
                            onFocus={() => handleInputFocus(false)}
                            onBlur={() => {
                                setIsNoteFocused(false);
                                onSaveNotes(note);
                            }}
                            value={note}
                            onChange={setNote}
                        />
                    </View>
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={openProjectSunroof}
                            accessibilityRole="button"
                            accessibilityLabel="Open this house in Project Sunroof"
                        >
                            <View style={styles.actionIconCircle}>
                                <MaterialIcons name="solar-power" size={20} color="#18181B" />
                            </View>
                            <Text style={styles.actionLabel}>Sunroof</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={openGoogleMaps}
                            accessibilityRole="button"
                            accessibilityLabel="Open this house in Google Maps"
                        >
                            <View style={styles.actionIconCircle}>
                                <FontAwesome6 name="google" size={17} color="#18181B" />
                            </View>
                            <Text style={styles.actionLabel}>Google</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={openAppleMaps}
                            accessibilityRole="button"
                            accessibilityLabel="Open this house in Apple Maps"
                        >
                            <View style={styles.actionIconCircle}>
                                <FontAwesome6 name="apple" size={20} color="#18181B" />
                            </View>
                            <Text style={styles.actionLabel}>Maps</Text>
                        </TouchableOpacity>
                        {(selectedHouse?.statuses?.length ?? 0) > 0 && (
                            <TouchableOpacity
                                style={styles.actionItem}
                                onPress={() => setShowStatusHistory(!showStatusHistory)}
                                accessibilityRole="button"
                                accessibilityLabel="Toggle status history"
                            >
                                <View style={styles.actionIconCircle}>
                                    <Ionicons name="time-outline" size={20} color="#18181B" />
                                </View>
                                <Text style={styles.actionLabel}>History</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
                {isTooltipVisible && <StatusTooltip onClose={() => setIsTooltipVisible(false)} />}
            </View>
            {/* </ScrollView> */}
        </PlainModal >
    );
};

const styles = StyleSheet.create({
    scrollView: {
        maxHeight: 550,
    },
    body: {
        position: 'relative',
    },
    scrollViewContainerStyle: {
        flexGrow: 1,
        maxHeight: 550,
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    mainInputContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    singleStatus: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    customTitleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        paddingRight: 12,
        zIndex: 20,
    },
    headerTextContainer: {
        flex: 1,
    },
    addressTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#18181B',
    },
    historyCloseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingVertical: 8,
    },
    historyCloseText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'black',
    },
    leadBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#DCFCE7',
        color: '#166534',
        fontSize: 11,
        fontWeight: '700',
        overflow: 'hidden',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginBottom: 12,
    },
    statusContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        marginRight: 16,
    },
    statuses: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 8,
        paddingHorizontal: 4,
    },
    button: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#3F3F46',
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 6,
    },
    sliderContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start'
    },
    tabViewContainer: {
        marginTop: 12,
    },
    tabBar: {
        flex: 1,
        flexDirection: 'row',
        padding: 3,
        borderRadius: 100,
        backgroundColor: '#F4F4F5',
    },
    tabItem: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 100,
        alignItems: 'center',
    },
    activeTabItem: {
        backgroundColor: '#18181B',
    },
    activeTabText: {
        fontWeight: '700',
        color: '#FFFFFF',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#71717A',
    },
    tabContent: {
        marginTop: 12,
    },
    noteInput: {
        height: 118,
        marginTop: 10,
        padding: 12,
        width: '100%',
        textAlignVertical: 'top',
    },
    creditRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 4,
        paddingHorizontal: 4,
    },
    creditLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#18181B',
        marginRight: 12,
    },
    creditSlider: {
        flex: 1,
    },
    creditValue: {
        fontSize: 17,
        fontWeight: '800',
        minWidth: 48,
        textAlign: 'right',
        marginLeft: 8,
        fontVariant: ['tabular-nums'],
    },
    infoButton: {
        marginLeft: 16,
    },
    leadActionButton: {
        backgroundColor: 'black',
        width: '100%',
        height: 50,
        borderRadius: 100,
    },
    leadActionButtonText: {
        color: 'white',
        fontSize: 14,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: 24,
        marginTop: 16,
        marginBottom: 4,
        paddingHorizontal: 4,
    },
    actionItem: {
        alignItems: 'center',
        gap: 5,
        minWidth: 52,
    },
    actionIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F4F4F5',
    },
    actionLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#18181B',
    },
    tooltipWrapper: {
        position: 'absolute',
        zIndex: 1000,
        left: 0,
        bottom: 60,
    },
    tooltipArrow: {
        position: 'absolute',
        right: 50,
        bottom: 225,
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderBottomWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#1F1F1F',
        transform: [{ rotate: '90deg' }],
        zIndex: 1002,
    },
});
