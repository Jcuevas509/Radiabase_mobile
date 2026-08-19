import {
  fitScreenProjection,
  invertScreenPointWithFit,
  projectCoordinateWithFit,
} from './fit-screen-projection';
import type { CoordinateProps } from 'types/componentsTypes';

function mercatorY(latitude: number): number {
  return Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI) / 360));
}

// A synthetic native projection with rotation/skew baked in — like a map the
// user has rotated with two fingers. The affine fit must recover it exactly.
function nativeProject(coordinate: CoordinateProps) {
  const merc = mercatorY(coordinate.latitude);
  return {
    x: 52_000 * coordinate.longitude + 210_000 * merc + 500,
    y: -180_000 * coordinate.longitude - 260_000 * merc + 700,
  };
}

const samples: CoordinateProps[] = [
  { latitude: 32.8351, longitude: -96.5645 },
  { latitude: 32.8362, longitude: -96.5631 },
  { latitude: 32.8344, longitude: -96.5622 },
  { latitude: 32.8368, longitude: -96.5649 },
  { latitude: 32.8357, longitude: -96.5638 },
];

function fitFromSamples() {
  return fitScreenProjection(samples.map((coordinate) => ({
    coordinate,
    point: nativeProject(coordinate),
  })));
}

describe('fitScreenProjection', () => {
  it('recovers a rotated native projection from sampled vertex points', () => {
    const fit = fitFromSamples();

    const unseen = { latitude: 32.83555, longitude: -96.56385 };
    const actual = projectCoordinateWithFit(fit!, unseen);
    const expected = nativeProject(unseen);

    expect(actual.x).toBeCloseTo(expected.x, 3);
    expect(actual.y).toBeCloseTo(expected.y, 3);
  });

  it('round-trips a dragged screen point back to its coordinate', () => {
    const fit = fitFromSamples();

    const fingerPoint = { x: 180, y: 420 };
    const coordinate = invertScreenPointWithFit(fit!, fingerPoint);
    const actual = projectCoordinateWithFit(fit!, coordinate!);

    expect(actual.x).toBeCloseTo(fingerPoint.x, 5);
    expect(actual.y).toBeCloseTo(fingerPoint.y, 5);
  });

  it('refuses a fit from too few or collinear samples', () => {
    expect(fitScreenProjection([])).toBeNull();
    expect(fitScreenProjection(samples.slice(0, 2).map((coordinate) => ({
      coordinate,
      point: nativeProject(coordinate),
    })))).toBeNull();

    const sameLatitude: CoordinateProps[] = [
      { latitude: 32.835, longitude: -96.5645 },
      { latitude: 32.835, longitude: -96.5631 },
      { latitude: 32.835, longitude: -96.5622 },
    ];
    expect(fitScreenProjection(sameLatitude.map((coordinate) => ({
      coordinate,
      point: nativeProject(coordinate),
    })))).toBeNull();
  });
});
