const React = require('react');
const { View } = require('react-native');

function MapView(props) {
  return React.createElement(View, props);
}

function Marker() {
  return null;
}

function Polygon() {
  return null;
}

module.exports = {
  __esModule: true,
  default: MapView,
  MapView,
  Marker,
  Polygon,
  PROVIDER_GOOGLE: 'google',
};
