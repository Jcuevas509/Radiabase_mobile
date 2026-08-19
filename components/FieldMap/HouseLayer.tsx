import { memo, useMemo, type ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker, Polygon } from 'react-native-maps';
import { CallSvg, CancelSvg, GoBackSvg, NewSvg, NotHomeSvg } from 'components/svg';
import { leadStatuses } from 'constants/leadStatuses';
import type { MapBuildingResponse } from 'services/area-api';
import type { BuildingProps, SvgProps } from 'types/componentsTypes';
import { pickFootprintColors } from 'utils/pick-footprint-colors';

const MAX_RENDERED_FOOTPRINTS = 450;

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

type HouseLayerProps = {
  readonly footprints: MapBuildingResponse[];
  readonly houses: BuildingProps[];
  readonly onHousePress: (house: BuildingProps) => void;
};

/**
 * Street-zoom layer with no pins: a worked house is its roof box filled
 * solid in the outcome color (Not Interested = all red) with the outcome
 * glyph laid flat over the fill — no chip or circle, so the mark blends
 * into the box shading. The glyph doubles as the touch target; roof-box
 * taps are also resolved by the map-level hit test. Untouched roofs keep a
 * faint outline, and a saved door with no footprint gets a minimal dot so
 * it stays findable.
 */
export const HouseLayer = memo(function HouseLayer({
  footprints,
  houses,
  onHousePress,
}: HouseLayerProps) {
  const housesByExternalId = useMemo(() => {
    const index = new Map<string, BuildingProps>();
    for (const house of houses) {
      const externalId = house.additionalDetails?.externalId;
      if (typeof externalId === 'string' && externalId.length > 0) {
        index.set(externalId, house);
      }
    }
    return index;
  }, [houses]);
  const footprintIds = useMemo(
    () => new Set(footprints.map((footprint) => footprint.id)),
    [footprints],
  );

  const renderedFootprints = footprints.length > MAX_RENDERED_FOOTPRINTS
    ? footprints.slice(0, MAX_RENDERED_FOOTPRINTS)
    : footprints;

  return (
    <>
      {renderedFootprints.map((footprint) => {
        const savedHouse = housesByExternalId.get(footprint.id);
        const colors = savedHouse
          ? pickFootprintColors(savedHouse.subtitle)
          : pickFootprintColors(null);
        return (
          <Polygon
            key={`footprint-${footprint.id}`}
            coordinates={footprint.coordinates}
            strokeColor={colors.strokeColor}
            fillColor={colors.fillColor}
            strokeWidth={savedHouse ? 2 : 1}
            tappable={false}
          />
        );
      })}
      {houses.map((house) => {
        const status = typeof house.statusId === 'number'
          ? leadStatuses.find((item) => item.statusId === house.statusId)
          : undefined;
        const DecalIcon = status ? DECAL_ICON_BY_STATUS_ID[status.statusId] : undefined;
        const externalId = house.additionalDetails?.externalId;
        const hasFootprintBox = typeof externalId === 'string' && footprintIds.has(externalId);
        if (!DecalIcon && hasFootprintBox) {
          return null;
        }
        return (
          <Marker
            key={`house-${house.id}`}
            coordinate={{ latitude: house.latitude, longitude: house.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            onPress={(event) => {
              event.stopPropagation();
              onHousePress(house);
            }}
          >
            {DecalIcon ? (
              <View style={styles.decal}>
                <DecalIcon color="white" />
              </View>
            ) : (
              <View style={styles.unworkedDot} />
            )}
          </Marker>
        );
      })}
    </>
  );
});

const styles = StyleSheet.create({
  decal: {
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
  unworkedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(24, 24, 27, 0.45)',
  },
});
