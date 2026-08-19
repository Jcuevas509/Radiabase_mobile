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

/**
 * Decal glyph per knock outcome, drawn flat in the middle of the roof box.
 * Not Interested deliberately uses the X mark rather than its list icon.
 */
const DECAL_ICON_BY_STATUS_ID: Record<number, ComponentType<SvgProps>> = {
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
 * Worked-house outcome glyphs as tappable screen-space views placed with the
 * shared projection fit — the last native markers besides the location dot
 * are gone, so no zoom threshold can batch-churn map annotations anymore.
 * Unworked saved doors show nothing here; their roof boxes and the map-level
 * hit test cover them.
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
        const DecalIcon = status ? DECAL_ICON_BY_STATUS_ID[status.statusId] : undefined;
        if (!status || !DecalIcon) {
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
            key={`house-decal-${house.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Open house, status ${status.fullName}`}
            hitSlop={6}
            onPress={() => onHousePress(house)}
            style={({ pressed }) => [
              styles.decal,
              { left: point.x - 18, top: point.y - 18 },
              pressed && styles.pressed,
            ]}
          >
            <DecalIcon color="white" />
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
  decal: {
    position: 'absolute',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.55,
    shadowRadius: 2,
    elevation: 3,
  },
  pressed: {
    opacity: 0.6,
  },
});
