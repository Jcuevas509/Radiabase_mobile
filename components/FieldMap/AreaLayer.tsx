import { memo } from 'react';
import { Marker, Polygon } from 'react-native-maps';
import { AssigneeMapLabel } from 'components/DrawingMap/AssigneeMapLabel';
import { UnassignedMapLabel } from 'components/DrawingMap/UnassignedMapLabel';
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
  readonly labelsEnabled: boolean;
  readonly onAreaPress: (areaId: number) => void;
};

/**
 * Turf polygons and their assignee chips as real MapView children, so they
 * track the camera natively instead of being re-projected per frame.
 */
export const AreaLayer = memo(function AreaLayer({
  areas,
  labelsEnabled,
  onAreaPress,
}: AreaLayerProps) {
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
      {labelsEnabled && areas.map((area) => (
        <Marker
          key={`area-label-${area.id}`}
          coordinate={area.centroid}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          onPress={(event) => {
            event.stopPropagation();
            onAreaPress(area.id);
          }}
        >
          {area.assignee ? (
            <AssigneeMapLabel
              areaId={area.id}
              name={area.assignee.name}
              lastname={area.assignee.lastname}
              imageUrl={area.assignee.avatarUrl}
              color={area.assignee.color}
            />
          ) : (
            <UnassignedMapLabel areaId={area.id} />
          )}
        </Marker>
      ))}
    </>
  );
});
