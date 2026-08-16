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
    onEditArea: () => void;
}

export const ManageAreaModal: React.FC<ManageAreaModalProps> = ({
    visible,
    onClose,
    selectedArea,
    setSelectedAgent,
    onDeleteArea,
    onReassignArea,
    onEditArea,
}) => {
    const isAssigned = Boolean(selectedArea?.assignee);
    return (
        <PlainModal
            visible={visible}
            onClose={onClose}
            title={isAssigned
                ? `Assigned to ${`${selectedArea?.assignee?.name ?? ''} ${selectedArea?.assignee?.lastname ?? ''}`.trim() || 'user'}`
                : 'Manage Area'
            }
            buttons={
                <>
                    <Button
                        text='Delete Area'
                        textStyle={{ color: '#CA0105' }}
                        onPress={onDeleteArea}
                    />
                    <Button
                        text={isAssigned ? 'Reassign' : 'Assign'}
                        buttonStyle={{ backgroundColor: 'black', width: 149 }}
                        textStyle={{ color: 'white' }}
                        onPress={onReassignArea}
                    />
                </>
            }
        >
            <>
            {isAssigned ? <>
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
                :
                <View style={styles.textContainer}>
                    <Text style={styles.notAssignedText}>
                        This Area is not assigned yet.
                    </Text>
                </View>
            }
            <Button
                text="Edit Area"
                buttonStyle={styles.editButton}
                textStyle={styles.editButtonText}
                onPress={onEditArea}
            />
            </>
        </PlainModal>
    );
};

const styles = StyleSheet.create({
    textContainer: {
        paddingVertical: 24
    },
    notAssignedText: {
        fontSize: 14,
        fontWeight: '500'
    },
    manageAreaText: {
        fontSize: 12,
        fontWeight: '400',
        color: 'black'
    },
    boldText: {
        fontWeight: '600'
    },
    editButton: {
        backgroundColor: '#F3F2EF',
        width: '100%',
        marginBottom: 8,
    },
    editButtonText: {
        color: '#18181B',
    },
});