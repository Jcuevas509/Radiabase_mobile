import { memo } from 'react';
import { Polygon } from 'react-native-maps';
import type { CoordinateProps } from 'types/componentsTypes';

export type AreaDisplay = {
  readonly id: number;
  readonly coordinates: CoordinateProps[];
  readonly centroid: CoordinateProps;
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

type AreaLayerProps = {
  readonly areas: AreaDisplay[];
};

/**
 * Turf polygons as real MapView children, so they track the camera natively.
 * Labels live in AreaLabelOverlay (screen space) — zoom-scaled labels inside
 * native markers forced annotation churn every settle, which crashes iOS
 * Fabric.
 */
export const AreaLayer = memo(function AreaLayer({ areas }: AreaLayerProps) {
  return (
    <>
      {areas.map((area) => (
        <Polygon
          key={`area-shape-${area.id}`}
          coordinates={area.coordinates}
          strokeColor={area.strokeColor}
          fillColor={area.fillColor}
          strokeWidth={2}
          tappable={false}
        />
      ))}
    </>
  );
});
