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
 * Decal glyph per knock outcome, drawn in the middle of the roof box.
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
 * Street-zoom layer with no pins: each worked house is its roof box filled
 * solid in the outcome color (Not Interested = all red) with the outcome
 * glyph as a decal centered on the roof. The decal doubles as the touch
 * target; untouched roofs keep a faint outline.
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
            {status && DecalIcon ? (
              <View style={[styles.decal, { backgroundColor: status.color }]}>
                <DecalIcon color="white" />
              </View>
            ) : (
              <View style={styles.unworkedDecal}>
                <View style={styles.unworkedDot} />
              </View>
            )}
          </Marker>
        );
      })}
    </>
  );
});

const styles = StyleSheet.create({
  decal: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 3,
  },
  unworkedDecal: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(24, 24, 27, 0.4)',
  },
  unworkedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#18181B',
  },
});
