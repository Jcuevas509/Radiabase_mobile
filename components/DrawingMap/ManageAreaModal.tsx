import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlainModal } from 'components/Modal/Modal';
import { Button } from '../Button/Button';
import { AgentCard } from '../Card/AgentCard';
import moment from 'moment';

interface ManageAreaModalProps {
    visible: boolean;
    onClose: () => void;
    selectedArea: any;
    setSelectedAgent: (agent: any) => void;
    onDeleteArea: () => void;
    onReassignArea: () => void;
}

export const ManageAreaModal: React.FC<ManageAreaModalProps> = ({
    visible,
    onClose,
    selectedArea,
    setSelectedAgent,
    onDeleteArea,
    onReassignArea,
}) => {
    return (
        <PlainModal
            visible={visible}
            onClose={onClose}
            title="Manage Area"
            buttons={
                <>
                    <Button
                        text='Delete Area'
                        textStyle={{ color: '#CA0105' }}
                        onPress={onDeleteArea}
                    />
                    <Button
                        text='Reassign'
                        buttonStyle={{ backgroundColor: 'black', width: 149 }}
                        textStyle={{ color: 'white' }}
                        onPress={onReassignArea}
                    />
                </>
            }
        >
            <>
                <AgentCard
                    data={selectedArea?.assignee}
                    isAssigned={true}
                    setIsSelected={setSelectedAgent}
                />
                <View style={styles.textContainer}>
                    <Text style={styles.manageAreaText}>You have assigned this area on{' '}
                        <Text style={styles.boldText}>
                            {moment(new Date()).format('DD.MM.YYYY HH:mm:ss')}.
                        </Text>
                    </Text>
                </View>
            </>
        </PlainModal>
    );
};

const styles = StyleSheet.create({
    textContainer: {
        paddingVertical: 24
    },
    manageAreaText: {
        fontSize: 12,
        fontWeight: '400',
        color: 'black'
    },
    boldText: {
        fontWeight: '600'
    },
});