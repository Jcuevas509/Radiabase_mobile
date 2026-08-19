import type { MutableRefObject, RefObject } from 'react';
import { useEffect } from 'react';
import type MapView from 'react-native-maps';
import { TrueNorthCompass } from 'components/FieldMap/TrueNorthCompass';
import { useDeviceTrueHeading } from 'hooks/useDeviceTrueHeading';
import { useMapCameraHeading } from 'hooks/useMapCameraHeading';

export type CompassControllerHandle = {
  readonly requestHeadingUpdate: () => void;
};

type MapCompassControllerProps = {
  readonly mapRef: RefObject<MapView | null>;
  readonly isEnabled: boolean;
  readonly controllerRef: MutableRefObject<CompassControllerHandle | null>;
};

/**
 * Owns both compass rotation sources so their high-frequency updates re-render
 * only this small component. The device heading sensor fires many times per
 * second while the phone is in hand — holding that state in the map screen
 * re-rendered the entire map tree continuously and froze the UI. The map
 * screen nudges the camera-heading read through `controllerRef` on region
 * changes without ever re-rendering for it.
 */
export function MapCompassController({
  mapRef,
  isEnabled,
  controllerRef,
}: MapCompassControllerProps) {
  const deviceHeading = useDeviceTrueHeading(isEnabled);
  const {
    heading: mapHeading,
    requestHeadingUpdate,
    resetMapToNorth,
    alignMapToHeading,
  } = useMapCameraHeading(mapRef);

  useEffect(() => {
    controllerRef.current = { requestHeadingUpdate };
    return () => {
      controllerRef.current = null;
    };
  }, [controllerRef, requestHeadingUpdate]);

  return (
    <TrueNorthCompass
      mapHeading={mapHeading}
      deviceHeading={deviceHeading}
      onResetNorth={resetMapToNorth}
      onAlignToDevice={deviceHeading !== null
        ? () => alignMapToHeading(deviceHeading)
        : undefined}
    />
  );
}
