const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const { CircleDrawingOverlay } = require('./CircleDrawingOverlay');

const gestureEvent = (x, y) => ({ nativeEvent: { locationX: x, locationY: y } });

describe('CircleDrawingOverlay', () => {
  let renderer = null;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(async () => {
    if (renderer) {
      await act(async () => renderer.unmount());
    }
    renderer = null;
  });

  it('does not replace a draft for a tap or tiny drag, but emits a valid circle', async () => {
    const onCircleChange = jest.fn();
    const coordinateForPoint = jest.fn(({ x, y }) => Promise.resolve({
      latitude: 40.7128 + y * 0.00001,
      longitude: -74.006 + x * 0.00001,
    }));

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(CircleDrawingOverlay, {
        active: true,
        mapRef: { current: { coordinateForPoint } },
        onCircleChange,
      }));
    });
    const canvas = renderer.root.findByProps({
      accessibilityLabel: 'Circle drawing canvas. Drag from the center of the area outward.',
    });

    await act(async () => {
      await canvas.props.onResponderGrant(gestureEvent(10, 10));
      canvas.props.onResponderMove(gestureEvent(10, 10));
      canvas.props.onResponderRelease();
      await Promise.resolve();
    });
    expect(onCircleChange).not.toHaveBeenCalled();

    await act(async () => {
      await canvas.props.onResponderGrant(gestureEvent(10, 10));
      canvas.props.onResponderMove(gestureEvent(10, 80));
      canvas.props.onResponderRelease();
      await Promise.resolve();
    });
    expect(onCircleChange).toHaveBeenCalledTimes(1);
    expect(onCircleChange.mock.calls[0][0]).toHaveLength(40);
  });

  it('ignores a projection that resolves after responder termination', async () => {
    let resolveEdge;
    const onCircleChange = jest.fn();
    const coordinateForPoint = jest.fn()
      .mockResolvedValueOnce({ latitude: 40.7128, longitude: -74.006 })
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveEdge = resolve;
      }));

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(CircleDrawingOverlay, {
        active: true,
        mapRef: { current: { coordinateForPoint } },
        onCircleChange,
      }));
    });
    const canvas = renderer.root.findByProps({
      accessibilityLabel: 'Circle drawing canvas. Drag from the center of the area outward.',
    });

    await act(async () => {
      await canvas.props.onResponderGrant(gestureEvent(10, 10));
      canvas.props.onResponderMove(gestureEvent(10, 80));
      canvas.props.onResponderTerminate();
      resolveEdge({ latitude: 40.7138, longitude: -74.006 });
      await Promise.resolve();
    });

    expect(onCircleChange).not.toHaveBeenCalled();
  });
});
