import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { MapBuildingResponse } from 'services/area-api';
import type { BuildingProps } from 'types/componentsTypes';
import {
  projectCoordinateWithFit,
  type ScreenProjectionFit,
} from 'utils/fit-screen-projection';
import { pickFootprintColors } from 'utils/pick-footprint-colors';

const MAX_RENDERED_FOOTPRINTS = 400;
const MAX_RING_POINTS = 16;
const OFFSCREEN_MARGIN_PX = 60;

type FootprintBucket = {
  readonly strokeColor: string;
  readonly fillColor: string;
  readonly strokeWidth: number;
  readonly segments: string[];
};

type FootprintCanvasProps = {
  readonly footprints: MapBuildingResponse[];
  readonly houses: BuildingProps[];
  readonly fit: ScreenProjectionFit | null;
  readonly hidden: boolean;
};

/**
 * Every roof box — untouched outlines AND status-colored saved boxes — drawn
 * as a handful of screen-space SVG paths, one per style. Churning native map
 * children (polygons or markers) at zoom thresholds crashes iOS Fabric, so
 * the native map keeps zero per-house children; rings are placed with the
 * shared projection fit and the layer hides while the map moves.
 */
export const FootprintCanvas = memo(function FootprintCanvas({
  footprints,
  houses,
  fit,
  hidden,
}: FootprintCanvasProps) {
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    if (__DEV__) {
      console.log('[Touch] FootprintCanvas mounted');
      return () => {
        console.log('[Touch] FootprintCanvas unmounted');
      };
    }
    return undefined;
  }, []);

  const statusByExternalId = useMemo(() => {
    const index = new Map<string, string>();
    for (const house of houses) {
      const externalId = house.additionalDetails?.externalId;
      if (typeof externalId === 'string' && externalId.length > 0) {
        index.set(externalId, house.subtitle ?? '');
      }
    }
    return index;
  }, [houses]);

  const buckets = useMemo(() => {
    if (!fit || footprints.length === 0) {
      return [];
    }
    const rendered = footprints.length > MAX_RENDERED_FOOTPRINTS
      ? footprints.slice(0, MAX_RENDERED_FOOTPRINTS)
      : footprints;
    const bucketByKey = new Map<string, FootprintBucket>();
    for (const building of rendered) {
      const anchor = projectCoordinateWithFit(fit, {
        latitude: building.roofLat,
        longitude: building.roofLng,
      });
      if (
        anchor.x < -OFFSCREEN_MARGIN_PX || anchor.x > width + OFFSCREEN_MARGIN_PX ||
        anchor.y < -OFFSCREEN_MARGIN_PX || anchor.y > height + OFFSCREEN_MARGIN_PX
      ) {
        continue;
      }
      const ring = building.coordinates.length > MAX_RING_POINTS
        ? building.coordinates.filter((_, index) =>
            index % Math.ceil(building.coordinates.length / MAX_RING_POINTS) === 0)
        : building.coordinates;
      if (ring.length < 3) {
        continue;
      }
      const savedStatus = statusByExternalId.get(building.id);
      const colors = pickFootprintColors(savedStatus ?? null);
      const strokeWidth = savedStatus !== undefined ? 2 : 1;
      const key = `${colors.strokeColor}|${colors.fillColor}|${strokeWidth}`;
      let bucket = bucketByKey.get(key);
      if (!bucket) {
        bucket = {
          strokeColor: colors.strokeColor,
          fillColor: colors.fillColor,
          strokeWidth,
          segments: [],
        };
        bucketByKey.set(key, bucket);
      }
      const ringPath = ring
        .map((coordinate, index) => {
          const point = projectCoordinateWithFit(fit, coordinate);
          return `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
        })
        .join('');
      bucket.segments.push(`${ringPath}Z`);
    }
    return Array.from(bucketByKey.values());
  }, [fit, footprints, height, statusByExternalId, width]);

  if (hidden || buckets.length === 0) {
    return null;
  }

  return (
    // The wrapping View enforces pointerEvents="none" at the RN level —
    // relying on the Svg component alone has let touches be swallowed on
    // Fabric, which killed all map gestures whenever this layer was visible.
    <View pointerEvents="none" style={styles.layer}>
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
        {buckets.map((bucket) => (
          <Path
            key={`${bucket.strokeColor}-${bucket.fillColor}-${bucket.strokeWidth}`}
            d={bucket.segments.join('')}
            stroke={bucket.strokeColor}
            fill={bucket.fillColor}
            strokeWidth={bucket.strokeWidth}
          />
        ))}
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 7,
  },
});
