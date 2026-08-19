import type { RefObject } from 'react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import type MapView from 'react-native-maps';
import type { Region } from 'react-native-maps';
import Svg, { Path } from 'react-native-svg';
import type { MapBuildingResponse } from 'services/area-api';
import {
  fitScreenProjection,
  projectCoordinateWithFit,
  type ScreenProjectionFit,
} from 'utils/fit-screen-projection';

const MAX_RENDERED_FOOTPRINTS = 400;
const MAX_RING_POINTS = 16;
const OFFSCREEN_MARGIN_PX = 60;
const CALIBRATION_SAMPLES = 6;

type FootprintCanvasProps = {
  readonly footprints: MapBuildingResponse[];
  readonly mapRef: RefObject<MapView | null>;
  readonly region: Region | null;
  readonly hidden: boolean;
};

/**
 * Untouched roof outlines drawn as ONE screen-space SVG path — churning
 * hundreds of native children (map polygons or even individual SVG shapes)
 * freezes or crashes iOS Fabric, and since every outline shares one style
 * they can share one path. A handful of roofs are projected through the
 * map's own pointForCoordinate to calibrate a projection fit (only when the
 * camera settles, not when data refreshes), then every ring is placed with
 * local math. Hidden while the map moves; saved houses stay native so their
 * boxes track the camera perfectly.
 */
export const FootprintCanvas = memo(function FootprintCanvas({
  footprints,
  mapRef,
  region,
  hidden,
}: FootprintCanvasProps) {
  const { width, height } = useWindowDimensions();
  const [fit, setFit] = useState<ScreenProjectionFit | null>(null);
  const requestIdRef = useRef(0);
  const footprintsRef = useRef(footprints);
  footprintsRef.current = footprints;
  const hasFootprints = footprints.length > 0;

  useEffect(() => {
    const map = mapRef.current;
    if (hidden || !map || !region || !hasFootprints) {
      return;
    }
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const sampleSource = footprintsRef.current;
    const stride = Math.max(1, Math.floor(sampleSource.length / CALIBRATION_SAMPLES));
    const samples = sampleSource
      .filter((_, index) => index % stride === 0)
      .slice(0, CALIBRATION_SAMPLES);
    Promise.all(samples.map(async (building) => {
      try {
        const coordinate = { latitude: building.roofLat, longitude: building.roofLng };
        const point = await map.pointForCoordinate(coordinate);
        return Number.isFinite(point.x) && Number.isFinite(point.y)
          ? { coordinate, point }
          : null;
      } catch {
        return null;
      }
    })).then((pairs) => {
      if (requestIdRef.current !== requestId) {
        return;
      }
      setFit(fitScreenProjection(pairs.filter(
        (pair): pair is NonNullable<typeof pair> => pair !== null,
      )));
    });
  }, [hasFootprints, hidden, mapRef, region]);

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
    <Svg pointerEvents="none" style={styles.layer}>
      <Path
        d={pathData}
        stroke="#F5F0E6"
        fill="rgba(255, 255, 255, 0.14)"
        strokeWidth={1}
      />
    </Svg>
  );
});

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 7,
  },
});
