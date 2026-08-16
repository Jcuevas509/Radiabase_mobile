import { Button } from 'components/Button/Button';
import { RadioButton } from 'components/RadioButton/RadioButton';
import { UserAvatar } from 'components/Avatar/UserAvatar';
import { View, Text, StyleSheet } from 'react-native';

interface CardProps {
    data: any,
    isSelected?: boolean,
    isAssigned?: boolean,
    fromMenu?: boolean,
    onSendCard?: () => void,
    setIsSelected?: (value: any) => void,
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
 * Agent row used in assign/manage modals and the drawer header.
 */
export function AgentCard({
    data,
    isSelected = false,
    setIsSelected,
    isAssigned = false,
    fromMenu = false,
    onSendCard,
}: CardProps) {
    const roleLabel = formatRoleLabel(data?.salesRole);
    const officeName = data?.officeName ?? null;
    const structureName = data?.structureName && data.structureName !== officeName
        ? data.structureName
        : null;
    const metaLine = [roleLabel, officeName].filter(Boolean).join(' · ');
    const fallbackSubtitle = fromMenu && !metaLine ? data?.description : null;

    return (
        <View key={data?.id} style={styles.container}>
            <View style={styles.personDetails}>
                <UserAvatar
                    firstName={data?.name}
                    lastName={data?.lastname}
                    imageUrl={data?.avatarUrl}
                    color={data?.color ?? '#32A0FF'}
                    size={36}
                />
                <View style={styles.textColumn}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name} numberOfLines={1}>
                            {data?.name} {data?.lastname}
                        </Text>
                    </View>
                    {metaLine ? (
                        <Text style={styles.meta} numberOfLines={1}>{metaLine}</Text>
                    ) : null}
                    {structureName ? (
                        <Text style={styles.structure} numberOfLines={1}>{structureName}</Text>
                    ) : null}
                    {fallbackSubtitle ? (
                        <Text style={styles.meta} numberOfLines={1}>{fallbackSubtitle}</Text>
                    ) : null}
                </View>
            </View>
            <View>
                {
                    fromMenu && onSendCard ?
                        <Button
                            text='Send Card'
                            buttonStyle={{ backgroundColor: 'black' }}
                            textStyle={{ color: 'white' }}
                            onPress={onSendCard}
                        />
                        :
                        isAssigned ?
                            <Text style={styles.assignedText}>Assigned</Text>
                            : <RadioButton
                                checked={isSelected}
                                value={data?.id}
                                onChange={() => setIsSelected && setIsSelected(data)}
                            />}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        width: '100%',
        minHeight: 56,
        paddingRight: 8,
    },
    name: {
        color: 'black',
        fontSize: 14,
        fontWeight: '600',
        flexShrink: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    meta: {
        color: '#3F3F46',
        fontSize: 12,
        fontWeight: '500',
    },
    structure: {
        color: '#71717A',
        fontSize: 11,
        marginTop: 1,
    },
    personDetails: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        flex: 1,
        paddingRight: 8,
    },
    textColumn: {
        flex: 1,
        marginLeft: 8,
    },
    assignedText: {
        fontWeight: '700',
        fontSize: 14,
    },
});
