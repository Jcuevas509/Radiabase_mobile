import React from 'react';
import { ActivityIndicator, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PlainModal } from 'components/Modal/Modal';
import { Button } from '../Button/Button';
import { leadStatuses } from 'constants/leadStatuses';
import { FontAwesome6 } from '@expo/vector-icons';
import { NewSvg } from 'components/svg';
import { BuildingProps, LeadStatus } from 'types/componentsTypes';

interface QuickHouseOverviewModalProps {
    visible: boolean;
    onClose: () => void;
    selectedHouse: BuildingProps;
    isStatusSaving: boolean;
    savingStatusId: number | null;
    onDeletePin: () => void;
    onOpenHouseInfo: () => void;
    onChangeHouseStatus: (status: LeadStatus) => Promise<void> | void;
}

export const QuickHouseOverviewModal: React.FC<QuickHouseOverviewModalProps> = ({
    visible,
    onClose,
    selectedHouse,
    isStatusSaving,
    savingStatusId,
    onDeletePin,
    onOpenHouseInfo,
    onChangeHouseStatus
}) => {
    const currentStatus = leadStatuses.find(status => status?.statusId === selectedHouse?.statusId) || null;

    return (
        <PlainModal
            visible={visible}
            onClose={onClose}
            customTitle={
                <View style={styles.customTitleContainer}>
                    <View style={[styles.statusContainer, { borderColor: currentStatus?.color || 'black', backgroundColor: currentStatus?.color || 'white' }]}>
                        {currentStatus ? <currentStatus.icon color="white" /> : <></>}
                    </View>
                    <View style={styles.addressContainer}>
                        <FontAwesome6 name='location-dot' color='black' size={22} style={styles.locationIcon} />
                        <Text style={styles.addressText}>
                            {selectedHouse?.address}
                        </Text>
                    </View>
                </View>
            }
            buttons={
                <>
                    <Button
                        text='Delete Pin'
                        textStyle={{ color: '#CA0105' }}
                        onPress={onDeletePin}
                    />
                    <Button
                        text='Open House Info'
                        buttonStyle={{ backgroundColor: 'black', maxWidth: 247, width: '60%' }}
                        textStyle={{ color: 'white' }}
                        onPress={onOpenHouseInfo}
                        isDisabled={isStatusSaving}
                    />
                </>
            }
        >
            <>
                <View style={styles.textContainer}>
                    <Text style={styles.quickHouseOverviewText}>Quick Status{' '}</Text>
                    <View style={styles.statuses}>
                        {leadStatuses.map((status) => (
                            <View style={styles.singleStatus} key={status?.shortName}>
                                <Text style={styles.buttonText}>{status.shortName}</Text>
                                <TouchableOpacity
                                    key={status.shortName}
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
                                    onPress={() => void onChangeHouseStatus(status)}
                                    disabled={currentStatus?.statusId === status.statusId || isStatusSaving}
                                >
                                    {savingStatusId === status.statusId
                                        ? <ActivityIndicator color="white" size="small" />
                                        : <status.icon color="white" />}
                                </TouchableOpacity>
                            </View>
                        ))
                        }

                    </View>

                </View>
            </>
        </PlainModal>
    );
};

const styles = StyleSheet.create({
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addressText: {
        fontSize: 12,
        fontWeight: 400,
        color: '#1F1F1F',
    },
    statusContainer: {
        backgroundColor: '#1A75C6',
        justifyContent: 'center',
        alignItems: 'center',
        width: 32,
        borderWidth: 1,
        height: 32,
        borderRadius: 16,
        marginRight: 16
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

});
