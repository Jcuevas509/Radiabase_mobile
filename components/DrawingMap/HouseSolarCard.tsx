import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SolarInsightsResponse } from 'services/area-api';
import { formatSolarKwh } from 'utils/format-solar-kwh';
import { formatSolarSunshine } from 'utils/format-solar-sunshine';

type HouseSolarCardProps = {
  readonly isLoading: boolean;
  readonly insights: SolarInsightsResponse | null;
};

/**
 * Compact Solar potential card for the canvassing house sheet.
 */
export const HouseSolarCard: React.FC<HouseSolarCardProps> = ({ isLoading, insights }) => {
  return (
    <View style={styles.card} accessibilityLabel="Solar potential">
      <Text style={styles.title}>Solar potential</Text>
      {isLoading ? <ActivityIndicator color="#18181B" /> : <SolarCardBody insights={insights} />}
    </View>
  );
};

const SolarCardBody: React.FC<{ readonly insights: SolarInsightsResponse | null }> = ({ insights }) => {
  if (!insights) {
    return <Text style={styles.message}>Solar is unavailable.</Text>;
  }
  if (!insights.available) {
    return <Text style={styles.message}>{describeUnavailable(insights.reason)}</Text>;
  }
  return (
    <View>
      <Text style={styles.metric}>{formatSolarSunshine(insights.maxSunshineHoursPerYear)}</Text>
      <Text style={styles.metric}>{formatPanelLine(insights)}</Text>
      <Text style={styles.metric}>{formatRoofLine(insights.wholeRoofAreaMeters2)}</Text>
      <Text style={styles.metric}>{formatSolarKwh(insights.yearlyEnergyKwh)}</Text>
      <Text style={styles.meta}>{formatImageryLine(insights)}</Text>
    </View>
  );
};

function describeUnavailable(reason: SolarInsightsResponse['reason']): string {
  if (reason === 'no_coverage') {
    return 'No Solar coverage for this roof.';
  }
  if (reason === 'unconfigured') {
    return 'Solar is not configured on this API.';
  }
  return 'Solar is unavailable.';
}

function formatPanelLine(insights: SolarInsightsResponse): string {
  if (insights.maxArrayPanelsCount == null) {
    return '— panels';
  }
  return `${insights.maxArrayPanelsCount} max panels`;
}

function formatRoofLine(areaMeters2: number | null): string {
  if (areaMeters2 == null || !Number.isFinite(areaMeters2)) {
    return '— roof m²';
  }
  return `${Math.round(areaMeters2)} roof m²`;
}

function formatImageryLine(insights: SolarInsightsResponse): string {
  const quality = insights.imageryQuality ?? 'Unknown quality';
  const date = insights.imageryDate;
  if (!date) {
    return quality;
  }
  return `${quality} · ${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F4F4F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  title: {
    color: '#18181B',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  metric: {
    color: '#18181B',
    fontSize: 13,
    lineHeight: 18,
  },
  meta: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 6,
  },
  message: {
    color: '#52525B',
    fontSize: 13,
  },
});
