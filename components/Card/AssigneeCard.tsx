import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import moment from 'moment';
import { customerStatuses, leadStatuses } from 'constants/leadStatuses';

interface AssigneeCardProps {
    assignee: any;
    current?: boolean;
}

/**
 * @description A component that can be used as a assignee card
 */

export function AssigneeCard({
    assignee,
    current
}: AssigneeCardProps) {

    return (
        <View style={[styles.rowContainer, { marginBottom: 16 }]}>
            <View style={styles.columnContainer}>
                <Text style={current ? styles.boldText : styles.greyBoldText}>
                    House Assigned
                </Text>
                <Text style={styles.text}>
                    Area assigned on { }<Text style={styles.boldText}>
                        {moment(new Date()).format('DD.MM.YYYY hh:mmA')}
                    </Text>
                </Text>
            </View>
            <View style={styles.personDetails}>
                <View >
                    <Image
                        source={{ uri: 'https://media.istockphoto.com/id/1388648617/photo/confident-caucasian-young-man-in-casual-denim-clothes-with-arms-crossed-looking-at-camera.jpg?s=612x612&w=0&k=20&c=YxctPklAOJMmy6Tolyvn45rJL3puk5RlKt39FO46ZeA=' }}
                        style={[styles.image, { borderColor: assignee?.color }]}
                    />
                </View>
                <View>
                    <Text style={styles.name}>
                        {assignee?.name} {assignee?.lastname}
                    </Text>
                    <Text style={styles.description}>
                        {assignee?.description}
                    </Text>
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
    name: {
        color: 'black',
        fontSize: 12,
        marginBottom: 4,
        fontWeight: 600
    },
    description: {
        color: 'black',
        fontSize: 8,
        fontWeight: 400
    },
    personDetails: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    image: {
        height: 32,
        width: 32,
        borderRadius: 16,
        marginRight: 6,
        borderWidth: 2
    }
    ,
});
