import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import { PlainModal } from 'components/Modal/Modal';
import { Button } from '../Button/Button';
import { AgentCard } from '../Card/AgentCard';
import { InputField } from 'components/Input/InputField';
import { useKeyboard } from 'hooks/useKeyboard';
import { AssigneeOption, fetchAssigneeOptions, matchesAssigneeSearch } from 'services/users-api';

type AssigneeScope = 'office' | 'all';

interface AssignAreaModalProps {
    visible: boolean;
    onClose: () => void;
    isReassignment: boolean;
    loading: boolean;
    selectedAgent: any;
    setSelectedAgent: (agent: any) => void;
    onDeleteArea: () => void;
    onConfirmAndAssign: () => void;
    hasNoAssignee: boolean;
    officeId: number | null;
}

export const AssignAreaModal: React.FC<AssignAreaModalProps> = ({
    visible,
    onClose,
    loading,
    selectedAgent,
    setSelectedAgent,
    onDeleteArea,
    onConfirmAndAssign,
    hasNoAssignee,
    officeId,
}) => {
    const { height } = useWindowDimensions();
    const { keyboardShown, keyboardHeight } = useKeyboard();
    const canFilterByOffice = Boolean(officeId);
    const [scope, setScope] = useState<AssigneeScope>(canFilterByOffice ? 'office' : 'all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [debouncedSearch, setDebouncedSearch] = useState<string>('');
    const [people, setPeople] = useState<AssigneeOption[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [isTruncated, setIsTruncated] = useState<boolean>(false);
    const [isLoadingList, setIsLoadingList] = useState<boolean>(false);
    const listMaxHeight = Math.max(
        120,
        Math.round(height * 0.42) - (keyboardShown ? Math.round(keyboardHeight * 0.35) : 0),
    );

    useEffect(() => {
        if (!visible) {
            setSearchQuery('');
            setDebouncedSearch('');
            setScope(canFilterByOffice ? 'office' : 'all');
            return;
        }
        const timeoutId = setTimeout(() => {
            setDebouncedSearch(searchQuery.trim());
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, visible, canFilterByOffice]);

    const isOfficeRoster = canFilterByOffice && scope === 'office';
    const serverSearch = isOfficeRoster ? undefined : debouncedSearch;

    useEffect(() => {
        if (!visible) {
            return;
        }
        let isCancelled = false;
        setIsLoadingList(true);
        fetchAssigneeOptions({
            officeId,
            search: serverSearch,
            scope: canFilterByOffice ? scope : 'all',
        })
            .then((result) => {
                if (isCancelled) {
                    return;
                }
                setPeople(result.people);
                setTotalCount(result.totalCount);
                setIsTruncated(result.isTruncated);
            })
            .catch(() => {
                if (!isCancelled) {
                    setPeople([]);
                    setTotalCount(0);
                    setIsTruncated(false);
                }
            })
            .finally(() => {
                if (!isCancelled) {
                    setIsLoadingList(false);
                }
            });
        return () => {
            isCancelled = true;
        };
    }, [visible, officeId, scope, serverSearch, canFilterByOffice]);

    const filteredPeople = people.filter((person) => matchesAssigneeSearch(person, searchQuery));
    const emptyMessage = searchQuery.trim()
        ? 'No users match your search.'
        : scope === 'office'
            ? 'No users in this office.'
            : 'No users available to assign.';
    const statusLabel = scope === 'office'
        ? `${filteredPeople.length} in this office`
        : isTruncated
            ? `Showing ${filteredPeople.length} of ${totalCount}. Search to find someone else.`
            : `${filteredPeople.length} people`;

    return (
        <PlainModal
            visible={visible}
            onClose={onClose}
            title={`${!hasNoAssignee ? "Reassign" : "Assign"} Area to User`}
            isLoading={loading}
            buttons={
                <>
                    <Button
                        text='Delete Area'
                        textStyle={{ color: '#CA0105' }}
                        onPress={onDeleteArea}
                    />
                    <Button
                        text={`Confirm & ${!hasNoAssignee ? "Reassign" : "Assign"}`}
                        buttonStyle={{ backgroundColor: 'black' }}
                        textStyle={{ color: 'white' }}
                        onPress={onConfirmAndAssign}
                        isDisabled={!selectedAgent}
                    />
                </>
            }
        >
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                {canFilterByOffice ? (
                    <View style={styles.scopeRow}>
                        <Pressable
                            onPress={() => setScope('office')}
                            style={[styles.scopeChip, scope === 'office' && styles.scopeChipActive]}
                        >
                            <Text style={[styles.scopeChipText, scope === 'office' && styles.scopeChipTextActive]}>
                                This office
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setScope('all')}
                            style={[styles.scopeChip, scope === 'all' && styles.scopeChipActive]}
                        >
                            <Text style={[styles.scopeChipText, scope === 'all' && styles.scopeChipTextActive]}>
                                All offices
                            </Text>
                        </Pressable>
                    </View>
                ) : null}
                <InputField
                    value={searchQuery}
                    placeholder="Search name, office, or role"
                    onChange={setSearchQuery}
                    placeHolderColor="#6E6A62"
                    style={styles.searchInput}
                />
                <Text style={styles.statusText}>{statusLabel}</Text>
                <ScrollView
                    style={{ maxHeight: listMaxHeight }}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                >
                    {isLoadingList ? (
                        <ActivityIndicator style={styles.loader} color="#007AFF" />
                    ) : filteredPeople.length === 0 ? (
                        <Text style={styles.emptyText}>{emptyMessage}</Text>
                    ) : (
                        filteredPeople.map((person) => (
                            <AgentCard
                                key={person.id}
                                data={person}
                                setIsSelected={setSelectedAgent}
                                isSelected={selectedAgent?.id === person?.id}
                            />
                        ))
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </PlainModal>
    );
};

const styles = StyleSheet.create({
    scopeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    scopeChip: {
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#F3F2EF',
    },
    scopeChipActive: {
        backgroundColor: '#000000',
    },
    scopeChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6E6A62',
    },
    scopeChipTextActive: {
        color: '#ffffff',
    },
    searchInput: {
        width: '100%',
        height: 44,
        marginBottom: 0,
        backgroundColor: '#F3F2EF',
        borderWidth: 0,
        fontSize: 16,
    },
    statusText: {
        fontSize: 12,
        color: '#6E6A62',
        marginTop: 8,
        marginBottom: 8,
    },
    listContent: {
        paddingBottom: 8,
        flexGrow: 1,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6E6A62',
        paddingVertical: 16,
    },
    loader: {
        marginVertical: 24,
    },
});
