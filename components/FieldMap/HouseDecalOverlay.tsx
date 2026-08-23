import { memo, type ComponentType } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { CallSvg, CancelSvg, GoBackSvg, NewSvg, NotHomeSvg } from 'components/svg';
import { leadStatuses } from 'constants/leadStatuses';
import type { BuildingProps, SvgProps } from 'types/componentsTypes';
import {
  projectCoordinateWithFit,
  type ScreenProjectionFit,
} from 'utils/fit-screen-projection';

const OFFSCREEN_MARGIN_PX = 40;
const BADGE_SIZE = 30;

/**
 * Badge glyph per knock outcome. Not Interested deliberately uses the X mark
 * rather than its list icon.
 */
const BADGE_ICON_BY_STATUS_ID: Record<number, ComponentType<SvgProps>> = {
  0: NewSvg,
  1: CancelSvg,
  2: NotHomeSvg,
  3: GoBackSvg,
  4: CallSvg,
};

type HouseDecalOverlayProps = {
  readonly houses: BuildingProps[];
  readonly fit: ScreenProjectionFit | null;
  readonly hidden: boolean;
  readonly onHousePress: (house: BuildingProps) => void;
};

/**
 * Every saved door is one circular badge centered on its roof: outcome color
 * with the outcome glyph once worked, neutral white while unworked. No roof
 * outlines are drawn at all — untouched roofs stay clean satellite and remain
 * tappable through the map-level hit test. Badges are screen-space views on
 * the shared projection fit, so the native map keeps zero per-house children.
 */
export const HouseDecalOverlay = memo(function HouseDecalOverlay({
  houses,
  fit,
  hidden,
  onHousePress,
}: HouseDecalOverlayProps) {
  const { width, height } = useWindowDimensions();
  if (hidden || !fit || houses.length === 0) {
    return null;
  }
  return (
    <View pointerEvents="box-none" style={styles.layer}>
      {houses.map((house) => {
        const status = typeof house.statusId === 'number'
          ? leadStatuses.find((item) => item.statusId === house.statusId)
          : undefined;
        const BadgeIcon = status ? BADGE_ICON_BY_STATUS_ID[status.statusId] : undefined;
        // Unworked houses show no badge — the roof itself is tappable, and
        // the default white dots just cluttered the map.
        if (!status || !BadgeIcon) {
          return null;
        }
        const point = projectCoordinateWithFit(fit, {
          latitude: house.latitude,
          longitude: house.longitude,
        });
        if (
          point.x < -OFFSCREEN_MARGIN_PX || point.x > width + OFFSCREEN_MARGIN_PX ||
          point.y < -OFFSCREEN_MARGIN_PX || point.y > height + OFFSCREEN_MARGIN_PX
        ) {
          return null;
        }
        return (
          <Pressable
            key={`house-badge-${house.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Open house, status ${status.fullName}`}
            hitSlop={8}
            onPress={() => onHousePress(house)}
            style={({ pressed }) => [
              styles.badge,
              { left: point.x - BADGE_SIZE / 2, top: point.y - BADGE_SIZE / 2 },
              { backgroundColor: status.color },
              pressed && styles.pressed,
            ]}
          >
            <BadgeIcon color="white" />
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9,
  },
  badge: {
    position: 'absolute',
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
  },
  pressed: {
    opacity: 0.6,
  },
});
