import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { UserAvatar } from 'components/Avatar/UserAvatar';
import { pickRemoteImageUrl } from 'utils/pick-remote-image-url';

type AssigneeMapLabelProps = {
  readonly areaId: number;
  readonly latitude: number;
  readonly longitude: number;
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
  latitude,
  longitude,
  name,
  lastname,
  imageUrl,
  color,
  onPress,
}: AssigneeMapLabelProps) {
  const hasPhoto = Boolean(pickRemoteImageUrl(imageUrl));
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const fullName = `${name} ${lastname}`.trim();
  useEffect(() => {
    setTracksViewChanges(true);
    const timeoutId = setTimeout(() => setTracksViewChanges(false), 250);
    return () => clearTimeout(timeoutId);
  }, [name, lastname, color, imageUrl, hasPhoto]);
  return (
    <Marker
      identifier={`area-${areaId}-rep-${name}-${lastname}`}
      coordinate={{ latitude, longitude }}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.5, y: 0.5 }}
      tappable={Boolean(onPress)}
      zIndex={4}
      onPress={onPress}
    >
      <View style={[styles.chip, { borderColor: color }]} pointerEvents="none">
        <UserAvatar
          firstName={name}
          lastName={lastname}
          imageUrl={imageUrl}
          color={color}
          size={24}
          onImageLoad={() => setTracksViewChanges(false)}
        />
        <Text style={styles.name} numberOfLines={1}>
          {fullName || `User ${areaId}`}
        </Text>
      </View>
    </Marker>
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
});
