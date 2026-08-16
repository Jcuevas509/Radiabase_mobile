import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import moment from 'moment';
import { UserAvatar } from 'components/Avatar/UserAvatar';

interface AssigneeCardProps {
    assignee: {
        name?: string;
        lastname?: string;
        email?: string;
        description?: string;
        color?: string;
        avatarUrl?: string | null;
        officeName?: string | null;
        salesRole?: string | null;
    };
    current?: boolean;
}

function formatRoleLabel(role?: string | null): string | null {
    if (!role) {
        return null;
    }
    return role
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Shows who a house/area is assigned to. Uses a photo only when the user has one.
 */
export function AssigneeCard({
    assignee,
    current,
}: AssigneeCardProps) {
    const fullName = `${assignee?.name ?? ''} ${assignee?.lastname ?? ''}`.trim() || 'Unassigned';
    const roleLabel = formatRoleLabel(assignee?.salesRole);
    const metaLine = [roleLabel, assignee?.officeName].filter(Boolean).join(' · ');
    const subtitle = metaLine;

    return (
        <View style={[styles.rowContainer, { marginBottom: 16 }]}>
            <View style={styles.columnContainer}>
                <Text style={current ? styles.boldText : styles.greyBoldText}>
                    Assigned to
                </Text>
                <Text style={styles.text}>
                    Area assigned on { }<Text style={styles.boldText}>
                        {moment(new Date()).format('DD.MM.YYYY hh:mmA')}
                    </Text>
                </Text>
            </View>
            <View style={styles.personDetails}>
                <UserAvatar
                    firstName={assignee?.name}
                    lastName={assignee?.lastname}
                    imageUrl={assignee?.avatarUrl}
                    color={assignee?.color ?? '#32A0FF'}
                    size={32}
                />
                <View style={styles.textColumn}>
                    <Text style={styles.name} numberOfLines={1}>
                        {fullName}
                    </Text>
                    {subtitle ? (
                        <Text style={styles.description} numberOfLines={1}>
                            {subtitle}
                        </Text>
                    ) : null}
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
        alignItems: 'flex-start',
        flexShrink: 1,
        paddingRight: 8,
    },
    text: {
        fontSize: 12,
        fontWeight: 300,
    },
    boldText: {
        fontSize: 12,
        color: 'black',
        fontWeight: '600',
    },
    greyBoldText: {
        fontSize: 12,
        color: '#1F1F1F',
        fontWeight: '600',
    },
    name: {
        color: 'black',
        fontSize: 12,
        marginBottom: 2,
        fontWeight: 600,
    },
    description: {
        color: '#3F3F46',
        fontSize: 10,
        fontWeight: 400,
    },
    personDetails: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        flexShrink: 1,
        maxWidth: '55%',
    },
    textColumn: {
        marginLeft: 6,
        flexShrink: 1,
    },
});
