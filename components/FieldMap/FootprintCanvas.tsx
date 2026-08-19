import type { RefObject } from 'react';
import { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import type MapView from 'react-native-maps';
import type { Region } from 'react-native-maps';
import Svg, { Polygon as SvgPolygon } from 'react-native-svg';
import type { MapBuildingResponse } from 'services/area-api';
import {
  fitScreenProjection,
  projectCoordinateWithFit,
  type ScreenProjectionFit,
} from 'utils/fit-screen-projection';

const MAX_RENDERED_FOOTPRINTS = 400;
const MAX_RING_POINTS = 24;
const OFFSCREEN_MARGIN_PX = 60;
const CALIBRATION_SAMPLES = 6;

type FootprintCanvasProps = {
  readonly footprints: MapBuildingResponse[];
  readonly mapRef: RefObject<MapView | null>;
  readonly region: Region | null;
  readonly hidden: boolean;
};

/**
 * Untouched roof outlines drawn in ONE screen-space SVG instead of hundreds
 * of native map polygons — churning that many native children through the
 * map view crashes iOS Fabric. A handful of roofs are projected through the
 * map's own pointForCoordinate to calibrate a projection fit, then every
 * ring is placed with local math. Hidden while the map moves; saved houses
 * stay native so their boxes track the camera perfectly.
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

  useEffect(() => {
    const map = mapRef.current;
    if (hidden || !map || !region || footprints.length === 0) {
      return;
    }
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const stride = Math.max(1, Math.floor(footprints.length / CALIBRATION_SAMPLES));
    const samples = footprints
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
  }, [footprints, hidden, mapRef, region]);

  if (hidden || !fit || footprints.length === 0) {
    return null;
  }

  const rendered = footprints.length > MAX_RENDERED_FOOTPRINTS
    ? footprints.slice(0, MAX_RENDERED_FOOTPRINTS)
    : footprints;

  return (
    <Svg pointerEvents="none" style={styles.layer}>
      {rendered.map((building) => {
        const anchor = projectCoordinateWithFit(fit, {
          latitude: building.roofLat,
          longitude: building.roofLng,
        });
        if (
          anchor.x < -OFFSCREEN_MARGIN_PX || anchor.x > width + OFFSCREEN_MARGIN_PX ||
          anchor.y < -OFFSCREEN_MARGIN_PX || anchor.y > height + OFFSCREEN_MARGIN_PX
        ) {
          return null;
        }
        const ring = building.coordinates.length > MAX_RING_POINTS
          ? building.coordinates.filter((_, index) =>
              index % Math.ceil(building.coordinates.length / MAX_RING_POINTS) === 0)
          : building.coordinates;
        const points = ring
          .map((coordinate) => projectCoordinateWithFit(fit, coordinate))
          .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
          .join(' ');
        return (
          <SvgPolygon
            key={`footprint-${building.id}`}
            points={points}
            stroke="#F5F0E6"
            fill="rgba(255, 255, 255, 0.14)"
            strokeWidth={1}
          />
        );
      })}
    </Svg>
  );
});

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 7,
  },
});
