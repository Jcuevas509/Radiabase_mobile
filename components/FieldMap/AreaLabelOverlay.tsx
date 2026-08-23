import { memo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { AssigneeMapLabel } from 'components/DrawingMap/AssigneeMapLabel';
import { UnassignedMapLabel } from 'components/DrawingMap/UnassignedMapLabel';
import type { AreaDisplay } from 'components/FieldMap/AreaLayer';
import {
  projectCoordinateWithFit,
  type ScreenProjectionFit,
} from 'utils/fit-screen-projection';

const OFFSCREEN_MARGIN_PX = 100;

type AreaLabelOverlayProps = {
  readonly areas: AreaDisplay[];
  readonly fit: ScreenProjectionFit | null;
  readonly hidden: boolean;
  /** 0..1 — shrinks labels as the camera zooms out. */
  readonly labelScale: number;
  readonly onAreaPress: (areaId: number) => void;
};

/**
 * Turf labels in screen space instead of native markers: scaling with zoom
 * forced marker remounts every settle, and churning native annotations is
 * what crashes iOS Fabric. Labels are plain tappable views placed with the
 * shared projection fit, hidden while the map moves.
 */
export const AreaLabelOverlay = memo(function AreaLabelOverlay({
  areas,
  fit,
  hidden,
  labelScale,
  onAreaPress,
}: AreaLabelOverlayProps) {
  const { width, height } = useWindowDimensions();
  if (hidden || !fit || areas.length === 0) {
    return null;
  }
  return (
    <View pointerEvents="box-none" style={styles.layer}>
      {areas.map((area) => {
        const point = projectCoordinateWithFit(fit, area.centroid);
        if (
          point.x < -OFFSCREEN_MARGIN_PX || point.x > width + OFFSCREEN_MARGIN_PX ||
          point.y < -OFFSCREEN_MARGIN_PX || point.y > height + OFFSCREEN_MARGIN_PX
        ) {
          return null;
        }
        return (
          <View
            key={`area-label-${area.id}`}
            pointerEvents="box-none"
            style={[
              styles.labelPosition,
              {
                left: point.x - 100,
                top: point.y - 22,
                transform: [{ scale: labelScale }],
              },
            ]}
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
    </View>
  );
});

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    zIndex: 8,
  },
  labelPosition: {
    position: 'absolute',
    width: 200,
    alignItems: 'center',
  },
});
