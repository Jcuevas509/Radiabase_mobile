import React, { useState, useEffect, useRef } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, Switch, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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
interface DetailedHouseOverviewModalProps {
    visible: boolean;
    onClose: () => void;
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
    const currentStatus = leadStatuses.find(status => status?.statusId === selectedHouse?.statusId) || null;
    const leadId = selectedHouse?.additionalDetails?.leadId as number | null | undefined;
    const hasLead = Boolean(leadId);
    const hasInvalidEmail = email.trim().length > 0 && !isValidEmail;

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
            customTitle={
                <View style={styles.customTitleContainer}>
                    <View style={styles.statusSection}>
                        <View style={[styles.statusContainer, { borderColor: currentStatus?.color || 'black', backgroundColor: currentStatus?.color || 'white' }]}>
                            {currentStatus ? <currentStatus.icon color="white" /> : <></>}
                        </View>
                        <Text style={styles.statusName}>
                            {currentStatus ? currentStatus?.fullName : "This house has no status!"}
                        </Text>
                    </View>
                    {selectedHouse?.statuses && selectedHouse?.statuses?.length > 0 && <TouchableOpacity onPress={() => setShowStatusHistory(!showStatusHistory)} style={styles.historySection} hitSlop={8}>
                        <Text style={styles.statusHistory}>
                            {showStatusHistory ? "Close history" : "Status history"}
                        </Text>
                    </TouchableOpacity>}
                </View>
            }
            buttons={
                <Button
                    text={hasLead ? 'Update Lead' : 'Convert to Lead'}
                    buttonStyle={{ backgroundColor: 'black', width: '100%' }}
                    textStyle={{ color: 'white' }}
                    onPress={handleLeadAction}
                    isDisabled={hasLead && hasInvalidEmail}
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
                    <View style={styles.addressContainer}>
                        <View style={styles.statusSection}>
                            <FontAwesome6 name='location-dot' color='black' size={22} style={styles.locationIcon} />
                            <Text style={styles.addressText}>
                                {selectedHouse?.address}
                            </Text>
                        </View>
                        <View style={styles.historySection}>
                            <MaterialIcons name="solar-power" size={28} color="#32A0FF" />
                        </View>
                    </View>
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
                    <View style={styles.switchContainer}>
                        <Text style={styles.label}>Owner:</Text>
                        <Switch
                            value={isOwner}
                            onValueChange={setIsOwner}
                            thumbColor={isOwner ? "#32A0FF" : 'white'}
                            trackColor={{ false: '#E9E9E9', true: '#D9D9D9' }}
                        />
                        <TouchableOpacity style={styles.infoButton}>
                            <MaterialIcons name="info-outline" size={16} color="black" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.sliderContainer}>
                        <View>
                            <Text style={styles.label}>Credit: </Text>
                        </View>
                        <View style={styles.sliderWrapper}>
                            <View style={styles.labelContainer}>
                                <Text style={styles.maxLabel}>700+</Text>
                            </View>
                            <Slider
                                style={{ width: 260 }}
                                minimumValue={300}
                                maximumValue={850}
                                value={creditScore}
                                minimumTrackTintColor={'#32A0FF'}
                                maximumTrackTintColor='#D9D9D9'
                                thumbTintColor={"#32A0FF"}
                                onValueChange={setCreditScore}
                                step={1}
                            />
                        </View>
                        <TouchableOpacity style={styles.infoButton}>
                            <MaterialIcons name="info-outline" size={16} color="black" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.tabViewContainer}>
                        <View style={styles.sliderContainer}>
                            <View style={styles.tabBar}>
                                <TouchableOpacity
                                    style={[styles.tabItem, { width: 123 }, !customerTab && styles.activeTabItem,]}
                                    onPress={() => setCustomerTab(false)}
                                >
                                    <Text style={[styles.tabText, !customerTab && styles.activeTabText]}>Lead Status</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.tabItem, , { width: 159 }, customerTab && styles.activeTabItem]}
                                    onPress={() => setCustomerTab(true)}
                                >
                                    <Text style={[styles.tabText, customerTab && styles.activeTabText]}>Customer Status</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.infoButton} onPress={() => setIsTooltipVisible(true)}>
                                <Octicons name="question" size={24} color="black" />
                            </TouchableOpacity>

                        </View>
                        <View>
                            {!customerTab ? <LeadStatusTab /> : <CustomerStatusTab />}
                        </View>
                    </View>
                    <View >
                        <InputField
                            style={[styles.noteInput]}
                            placeholder="Leave internal note here..."
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
    keyboardAvoidingView: {
        flex: 1,
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
    textContainer: {
        paddingVertical: 0
    },
    singleStatus: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 32,
    },
    quickHouseOverviewText: {
        fontSize: 12,
        marginBottom: 12,
        fontWeight: 400,
        color: 'black'
    },
    boldText: {
        fontWeight: '600'
    },
    customTitleContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        paddingRight: 8,
        zIndex: 20,
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
    statusSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addressContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 24,
        paddingLeft: 8
    },
    addressText: {
        fontSize: 12,
        fontWeight: 400,
        color: '#1F1F1F',
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
    locationIcon: {
        height: 22,
        marginRight: 16
    },
    statuses: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginVertical: 8,
    },
    button: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'black',
        fontSize: 12,
        fontWeight: 500,
        marginBottom: 4,
    },
    container: {
        padding: 0,
        flexGrow: 1
    },
    switchContainer: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
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
        flexDirection: 'row',
        width: 288,
        padding: 3,
        borderRadius: 8,
        backgroundColor: '#E9E9E9'
    },
    tabItem: {
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    activeTabItem: {
        backgroundColor: 'white',
    },
    activeTabText: {
        fontWeight: 600,
    },
    tabText: {
        fontSize: 16,
        fontWeight: 500,
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
    label: {
        fontSize: 12,
        marginRight: 24,
        fontWeight: 600,
        color: 'black'
    },
    statusName: {
        fontWeight: '300',
        fontSize: 12,
    },
    historySection: {
        alignItems: 'flex-end',
    },
    statusHistory: {
        fontWeight: '600',
        fontSize: 12,
    },
    maxLabel: {
        fontSize: 8,
        fontWeight: '600',
    },
    sliderWrapper: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginTop: -8
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 0,
    },
    infoButton: {
        marginLeft: 16,
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
