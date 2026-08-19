import Location01Icon from '@hugeicons/core-free-icons/Location01Icon';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { AssigneeMapLabel } from 'components/DrawingMap/AssigneeMapLabel';
import { UnassignedMapLabel } from 'components/DrawingMap/UnassignedMapLabel';
import { leadStatuses } from 'constants/leadStatuses';
import type { RefObject } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type MapView from 'react-native-maps';
import type { Region } from 'react-native-maps';
import Svg, { Polygon as SvgPolygon } from 'react-native-svg';
import type { BuildingProps, CoordinateProps } from 'types/componentsTypes';
import { selectMapOverlayItems, simplifyOverlayRing } from 'utils/select-map-overlay-items';

export type MapAreaOverlay = {
  readonly id: number;
  readonly coordinate: CoordinateProps;
  readonly coordinates: CoordinateProps[];
  readonly strokeColor: string;
  readonly fillColor: string;
  readonly assignee: {
    readonly id: number;
    readonly name: string;
    readonly lastname: string;
    readonly avatarUrl?: string | null;
    readonly color: string;
  } | null;
};

type MapDynamicOverlayProps = {
  readonly mapRef: RefObject<MapView | null>;
  readonly region: Region | null;
  readonly hidden: boolean;
  readonly interactiveHidden?: boolean;
  readonly houses: BuildingProps[];
  readonly areas: MapAreaOverlay[];
  readonly onHousePress: (house: BuildingProps) => void;
  readonly onHouseLongPress?: (house: BuildingProps) => void;
  readonly onAreaPress: (areaId: number) => void;
};

type ProjectionItem = {
  readonly key: string;
  readonly coordinate: CoordinateProps;
};

type ScreenPoint = {
  readonly x: number;
  readonly y: number;
};

function isValidPoint(point: ScreenPoint): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

/**
 * Screen-space map annotations. Keeping these views outside MapView prevents
 * iOS Fabric from inserting and removing legacy native map children as the
 * viewport data changes.
 */
export function MapDynamicOverlay({
  mapRef,
  region,
  hidden,
  interactiveHidden = false,
  houses,
  areas,
  onHousePress,
  onHouseLongPress,
  onAreaPress,
}: MapDynamicOverlayProps) {
  const [points, setPoints] = useState<Record<string, ScreenPoint>>({});
  const selectedItems = useMemo(
    () => region
      ? selectMapOverlayItems(region, houses, areas)
      : { houses: [], areas: [] },
    [areas, houses, region],
  );
  const visibleAreas = useMemo(
    () => selectedItems.areas.map((area) => ({
      ...area,
      coordinates: simplifyOverlayRing(area.coordinates),
    })),
    [selectedItems.areas],
  );
  const projectionItems = useMemo<ProjectionItem[]>(() => [
    ...selectedItems.houses.map((house) => ({
      key: `house-${house.id}`,
      coordinate: { latitude: house.latitude, longitude: house.longitude },
    })),
    ...visibleAreas.map((area) => ({
      key: `area-${area.id}`,
      coordinate: area.coordinate,
    })),
    ...visibleAreas.flatMap((area) => area.coordinates.map((coordinate, index) => ({
      key: `area-${area.id}-vertex-${index}`,
      coordinate,
    }))),
  ], [selectedItems.houses, visibleAreas]);

  useEffect(() => {
    const map = mapRef.current;
    if (hidden || !map || !region) {
      setPoints({});
      return;
    }

    let cancelled = false;
    setPoints({});
    Promise.all(projectionItems.map(async (item) => {
      try {
        const point = await map.pointForCoordinate(item.coordinate);
        return isValidPoint(point) ? [item.key, point] as const : null;
      } catch {
        return null;
      }
    })).then((projectedItems) => {
      if (cancelled) {
        return;
      }
      const nextPoints: Record<string, ScreenPoint> = {};
      for (const projectedItem of projectedItems) {
        if (projectedItem) {
          nextPoints[projectedItem[0]] = projectedItem[1];
        }
      }
      setPoints(nextPoints);
    });

    return () => {
      cancelled = true;
    };
  }, [hidden, mapRef, projectionItems, region]);

  if (hidden) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.layer}>
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
        {visibleAreas.map((area) => {
          const areaPoints = area.coordinates.map((_, index) =>
            points[`area-${area.id}-vertex-${index}`],
          );
          if (areaPoints.length < 3 || areaPoints.some((point) => !point)) {
            return null;
          }
          return (
            <SvgPolygon
              key={`area-shape-${area.id}`}
              points={areaPoints.map((point) => `${point.x},${point.y}`).join(' ')}
              stroke={area.strokeColor}
              fill={area.fillColor}
              strokeWidth={2}
            />
          );
        })}
      </Svg>
      {!interactiveHidden && visibleAreas.map((area) => {
        const point = points[`area-${area.id}`];
        if (!point) {
          return null;
        }
        return (
          <View
            key={`area-${area.id}`}
            pointerEvents="box-none"
            style={[styles.areaPosition, { left: point.x - 100, top: point.y - 22 }]}
          >
            {area.assignee ? (
              <AssigneeMapLabel
                areaId={area.id}
                name={area.assignee.name}
                lastname={area.assignee.lastname}
                imageUrl={area.assignee.avatarUrl}
                color={area.assignee.color}
                onPress={() => onAreaPress(area.id)}
              />
            ) : (
              <UnassignedMapLabel areaId={area.id} onPress={() => onAreaPress(area.id)} />
            )}
          </View>
        );
      })}
      {!interactiveHidden && selectedItems.houses.map((house) => {
        const point = points[`house-${house.id}`];
        if (!point) {
          return null;
        }
        const status = leadStatuses.find((item) => item.statusId === house.statusId);
        return (
          <Pressable
            key={`house-${house.id}`}
            accessibilityRole="button"
            accessibilityLabel="Open house"
            delayLongPress={450}
            hitSlop={6}
            onLongPress={onHouseLongPress ? () => onHouseLongPress(house) : undefined}
            onPress={() => onHousePress(house)}
            style={({ pressed }) => [
              styles.housePosition,
              { left: point.x - 22, top: point.y - 22 },
              pressed && styles.pressed,
            ]}
          >
            <HugeiconsIcon
              icon={Location01Icon}
              size={18}
              color={status?.color || '#18181B'}
              strokeWidth={2}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 8,
  },
  areaPosition: {
    position: 'absolute',
    width: 200,
    alignItems: 'center',
  },
  housePosition: {
    position: 'absolute',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
