import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import moment from 'moment';
import { customerStatuses, leadStatuses } from 'constants/leadStatuses';

// All statuses for both lead and customer
const allStatuses = [...leadStatuses, ...customerStatuses];

interface StatusCardProps {
    statusId: number;
    index: number;
    current?: boolean;
}

/**
 * @description A component that can be used as a status card in the modal
 */

export function StatusCard({
    statusId,
    index,
    current
}: StatusCardProps) {

    const statusDetails = allStatuses.find(status => status.statusId === statusId) ?? null;

    return (
        <View style={[styles.rowContainer, { marginBottom: 16 }]} key={index}>
            <View style={styles.columnContainer}>
                <Text style={current ? styles.boldText : styles.greyBoldText}>
                    {current ? "Current Status" : "Status Changed"}
                </Text>
                <Text style={styles.text}>
                    Status changed on { }<Text style={styles.boldText}>
                        {moment(new Date()).format('DD.MM.YYYY hh:mmA')}
                    </Text>
                </Text>
            </View>
            <View style={styles.rowContainer}>
                <View style={[styles.statusContainer, { borderColor: statusDetails?.color || 'black', backgroundColor: statusDetails?.color || 'white' }]}>
                    {statusDetails ? <statusDetails.icon color="white" /> : <></>}
                </View>
                <View style={{ width: 30 }}>
                    <Text style={styles.boldText}>{statusDetails?.shortName}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    columnContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start'
    },
    text: {
        fontSize: 12,
        fontWeight: 300
    },
    boldText: {
        fontSize: 12,
        color: 'black',
        fontWeight: '600'
    },
    greyBoldText: {
        fontSize: 12,
        color: '#1F1F1F',
        fontWeight: '600'
    },
    greyText: {
        color: '#1F1F1F'
    },
    statusContainer: {
        backgroundColor: '#1A75C6',
        justifyContent: 'center',
        alignItems: 'center',
        width: 32,
        borderWidth: 1,
        height: 32,
        borderRadius: 16,
        marginRight: 8
    },

});
