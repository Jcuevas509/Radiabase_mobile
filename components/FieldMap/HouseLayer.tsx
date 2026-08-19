import Location01Icon from '@hugeicons/core-free-icons/Location01Icon';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker, Polygon } from 'react-native-maps';
import { leadStatuses } from 'constants/leadStatuses';
import type { MapBuildingResponse } from 'services/area-api';
import type { BuildingProps } from 'types/componentsTypes';
import { pickFootprintColors } from 'utils/pick-footprint-colors';

const MAX_RENDERED_FOOTPRINTS = 450;

type HouseLayerProps = {
  readonly footprints: MapBuildingResponse[];
  readonly houses: BuildingProps[];
  readonly onHousePress: (house: BuildingProps) => void;
};

/**
 * Street-zoom layer: Overture roof outlines (status-tinted once a door is
 * saved) plus a pin marker per saved door. All children are stable-keyed and
 * capped so the native map never churns through large child batches.
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
            strokeWidth={1}
            tappable={false}
          />
        );
      })}
      {houses.map((house) => {
        const status = leadStatuses.find((item) => item.statusId === house.statusId);
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
            <View style={styles.pin}>
              <HugeiconsIcon
                icon={Location01Icon}
                size={18}
                color={status?.color || '#18181B'}
                strokeWidth={2}
              />
            </View>
          </Marker>
        );
      })}
    </>
  );
});

const styles = StyleSheet.create({
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(24, 24, 27, 0.25)',
  },
});
