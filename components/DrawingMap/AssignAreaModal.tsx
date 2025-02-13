
import React from 'react';
import { PlainModal } from 'components/Modal/Modal';
import { Button } from '../Button/Button';
import { AgentCard } from '../Card/AgentCard';

interface AssignAreaModalProps {
    visible: boolean;
    onClose: () => void;
    isReassignment: boolean;
    loading: boolean;
    selectedAgent: any;
    setSelectedAgent: (agent: any) => void;
    onDeleteArea: () => void;
    onConfirmAndAssign: () => void;
    peopleData: any[];
}

export const AssignAreaModal: React.FC<AssignAreaModalProps> = ({
    visible,
    onClose,
    isReassignment,
    loading,
    selectedAgent,
    setSelectedAgent,
    onDeleteArea,
    onConfirmAndAssign,
    peopleData,
}) => {
    return (
        <PlainModal
            visible={visible}
            onClose={onClose}
            title={`${isReassignment ? "Reassign" : "Assign"} Area to User`}
            isLoading={loading}
            buttons={
                <>
                    <Button
                        text='Delete Area'
                        textStyle={{ color: '#CA0105' }}
                        onPress={onDeleteArea}
                    />
                    <Button
                        text={`Confirm & ${isReassignment ? "Reassign" : "Assign"}`}
                        buttonStyle={{ backgroundColor: 'black' }}
                        textStyle={{ color: 'white' }}
                        onPress={onConfirmAndAssign}
                        isDisabled={!selectedAgent}
                    />
                </>
            }
        >
            <>
                {peopleData?.map((person) => (
                    <AgentCard
                        key={person.id}
                        data={person}
                        setIsSelected={setSelectedAgent}
                        isSelected={selectedAgent?.id === person?.id}
                    />
                ))}
            </>
        </PlainModal>
    );
};