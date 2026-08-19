import { Pressable, StyleSheet, Text, View } from 'react-native';
import { UserAvatar } from 'components/Avatar/UserAvatar';
import { pickRemoteImageUrl } from 'utils/pick-remote-image-url';

type AssigneeMapLabelProps = {
  readonly areaId: number;
  readonly name: string;
  readonly lastname: string;
  readonly imageUrl?: string | null;
  readonly color: string;
  readonly onPress?: () => void;
};

/**
 * Named chip on an assigned turf. Uses a photo only when the user has one.
 */
export function AssigneeMapLabel({
  areaId,
  name,
  lastname,
  imageUrl,
  color,
  onPress,
}: AssigneeMapLabelProps) {
  const resolvedImageUrl = pickRemoteImageUrl(imageUrl);
  const fullName = `${name} ${lastname}`.trim();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open area assigned to ${fullName || `User ${areaId}`}`}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, { borderColor: color }, pressed && styles.pressed]}
    >
      <View pointerEvents="none">
        <UserAvatar
          firstName={name}
          lastName={lastname}
          imageUrl={resolvedImageUrl}
          color={color}
          size={24}
        />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {fullName || `User ${areaId}`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 4,
    paddingRight: 10,
    paddingLeft: 4,
    borderWidth: 2,
    maxWidth: 180,
    gap: 6,
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: '#18181B',
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.75,
  },
});
