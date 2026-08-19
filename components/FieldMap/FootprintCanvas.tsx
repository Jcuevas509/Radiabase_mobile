import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { MapBuildingResponse } from 'services/area-api';
import {
  projectCoordinateWithFit,
  type ScreenProjectionFit,
} from 'utils/fit-screen-projection';

const MAX_RENDERED_FOOTPRINTS = 400;
const MAX_RING_POINTS = 16;
const OFFSCREEN_MARGIN_PX = 60;

type FootprintCanvasProps = {
  readonly footprints: MapBuildingResponse[];
  readonly fit: ScreenProjectionFit | null;
  readonly hidden: boolean;
};

/**
 * Untouched roof outlines drawn as ONE screen-space SVG path — churning
 * hundreds of native children (map polygons or even individual SVG shapes)
 * freezes or crashes iOS Fabric, and since every outline shares one style
 * they can share one path. Rings are placed with the shared projection fit;
 * hidden while the map moves. Saved houses stay native so their boxes track
 * the camera perfectly.
 */
export const FootprintCanvas = memo(function FootprintCanvas({
  footprints,
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

  const pathData = useMemo(() => {
    if (!fit || footprints.length === 0) {
      return '';
    }
    const rendered = footprints.length > MAX_RENDERED_FOOTPRINTS
      ? footprints.slice(0, MAX_RENDERED_FOOTPRINTS)
      : footprints;
    const segments: string[] = [];
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
      const ringPath = ring
        .map((coordinate, index) => {
          const point = projectCoordinateWithFit(fit, coordinate);
          return `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
        })
        .join('');
      segments.push(`${ringPath}Z`);
    }
    return segments.join('');
  }, [fit, footprints, height, width]);

  if (hidden || !pathData) {
    return null;
  }

  return (
    // The wrapping View enforces pointerEvents="none" at the RN level —
    // relying on the Svg component alone has let touches be swallowed on
    // Fabric, which killed all map gestures whenever this layer was visible.
    <View pointerEvents="none" style={styles.layer}>
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Path
          d={pathData}
          stroke="#F5F0E6"
          fill="rgba(255, 255, 255, 0.14)"
          strokeWidth={1}
        />
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
