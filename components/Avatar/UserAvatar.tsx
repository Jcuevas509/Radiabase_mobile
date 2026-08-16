import { Image, StyleSheet, Text, View } from 'react-native';
import { pickRemoteImageUrl } from 'utils/pick-remote-image-url';

type UserAvatarProps = {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly imageUrl?: string | null;
  readonly color?: string;
  readonly size?: number;
  readonly onImageLoad?: () => void;
};

function getInitials(firstName?: string, lastName?: string): string {
  const first = (firstName ?? '').trim().charAt(0);
  const last = (lastName ?? '').trim().charAt(0);
  return `${first}${last}`.toUpperCase() || '?';
}

/**
 * Shows a user's photo only when they have one; otherwise initials.
 */
export function UserAvatar({
  firstName,
  lastName,
  imageUrl,
  color = '#32A0FF',
  size = 36,
  onImageLoad,
}: UserAvatarProps) {
  const remoteImageUrl = pickRemoteImageUrl(imageUrl);
  return (
    <View
      style={[
        styles.avatar,
        {
          height: size,
          width: size,
          borderRadius: size / 2,
          borderColor: color,
        },
      ]}
    >
      {remoteImageUrl ? (
        <Image
          source={{ uri: remoteImageUrl }}
          style={{ height: size - 4, width: size - 4, borderRadius: (size - 4) / 2 }}
          onLoad={onImageLoad}
        />
      ) : (
        <Text style={[styles.avatarText, { fontSize: Math.max(10, Math.round(size * 0.33)) }]}>
          {getInitials(firstName, lastName)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 2,
    backgroundColor: '#F3F2EF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontWeight: '700',
    color: '#18181B',
  },
});
