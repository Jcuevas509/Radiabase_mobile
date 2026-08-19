import {
  fitScreenProjection,
  invertScreenPointWithFit,
  projectCoordinateWithFit,
} from './fit-screen-projection';
import type { CoordinateProps } from 'types/componentsTypes';

function mercatorY(latitude: number): number {
  return Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI) / 360));
}

// A synthetic native projection the fit should recover exactly: linear in
// longitude for x and in Mercator-Y for y, like a real map view.
function nativeProject(coordinate: CoordinateProps) {
  return {
    x: 52_000 * (coordinate.longitude + 96.565) + 40,
    y: -310_000 * (mercatorY(coordinate.latitude) - mercatorY(32.837)) + 60,
  };
}

const samples: CoordinateProps[] = [
  { latitude: 32.8351, longitude: -96.5645 },
  { latitude: 32.8362, longitude: -96.5631 },
  { latitude: 32.8344, longitude: -96.5622 },
  { latitude: 32.8368, longitude: -96.5649 },
];

describe('fitScreenProjection', () => {
  it('recovers the native projection from sampled vertex points', () => {
    const fit = fitScreenProjection(samples.map((coordinate) => ({
      coordinate,
      point: nativeProject(coordinate),
    })));

    const unseen = { latitude: 32.83555, longitude: -96.56385 };
    const actual = projectCoordinateWithFit(fit!, unseen);
    const expected = nativeProject(unseen);

    expect(actual.x).toBeCloseTo(expected.x, 4);
    expect(actual.y).toBeCloseTo(expected.y, 4);
  });

  it('round-trips a dragged screen point back to its coordinate', () => {
    const fit = fitScreenProjection(samples.map((coordinate) => ({
      coordinate,
      point: nativeProject(coordinate),
    })));

    const fingerPoint = { x: 180, y: 420 };
    const coordinate = invertScreenPointWithFit(fit!, fingerPoint);
    const actual = projectCoordinateWithFit(fit!, coordinate!);

    expect(actual.x).toBeCloseTo(fingerPoint.x, 5);
    expect(actual.y).toBeCloseTo(fingerPoint.y, 5);
  });

  it('refuses a fit from degenerate samples', () => {
    expect(fitScreenProjection([])).toBeNull();
    expect(fitScreenProjection([
      { coordinate: samples[0], point: { x: 10, y: 10 } },
    ])).toBeNull();
    expect(fitScreenProjection([
      { coordinate: { latitude: 32.83, longitude: -96.56 }, point: { x: 10, y: 10 } },
      { coordinate: { latitude: 32.83, longitude: -96.56 }, point: { x: 40, y: 40 } },
    ])).toBeNull();
  });
});
