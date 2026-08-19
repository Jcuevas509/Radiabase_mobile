import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BuildingProps } from 'types/componentsTypes';
import {
  countMapHousesByOutcome,
  type MapHouseOutcomeFilter,
} from 'utils/filter-map-houses-by-outcome';

type FilterOption = {
  readonly value: MapHouseOutcomeFilter;
  readonly label: string;
  readonly color?: string;
};

const FILTER_OPTIONS: readonly FilterOption[] = [
  { value: 'all', label: 'All saved' },
  { value: 'unworked', label: 'No outcome', color: '#71717A' },
  { value: 'interested', label: 'Interested / GB', color: '#1A75C6' },
  { value: 'not_home', label: 'Not home', color: '#F9B20F' },
  { value: 'not_interested', label: 'Not interested', color: '#F90114' },
  { value: 'custom', label: 'Call back', color: '#A300FF' },
];

type MapHouseStatusFilterProps = {
  readonly houses: BuildingProps[];
  readonly value: MapHouseOutcomeFilter;
  readonly onChange: (value: MapHouseOutcomeFilter) => void;
};

export function MapHouseStatusFilter({
  houses,
  value,
  onChange,
}: MapHouseStatusFilterProps) {
  const counts = useMemo(() => countMapHousesByOutcome(houses), [houses]);
  if (houses.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        contentContainerStyle={styles.content}
        showsHorizontalScrollIndicator={false}
      >
        {FILTER_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          const isDisabled = option.value !== 'all' && counts[option.value] === 0;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="tab"
              accessibilityLabel={`${option.label}, ${counts[option.value]} nearby saved doors`}
              accessibilityState={{ selected: isSelected, disabled: isDisabled }}
              disabled={isDisabled}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                isDisabled && styles.chipDisabled,
                pressed && styles.chipPressed,
              ]}
            >
              {option.color ? (
                <View style={[styles.dot, { backgroundColor: option.color }]} />
              ) : null}
              <Text style={[styles.label, isSelected && styles.labelSelected]}>
                {option.label} {counts[option.value]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 72,
    left: 78,
    right: 12,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 12,
  },
  content: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  chip: {
    minHeight: 30,
    borderRadius: 15,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
  },
  chipSelected: {
    backgroundColor: '#18181B',
  },
  chipDisabled: {
    opacity: 0.38,
  },
  chipPressed: {
    opacity: 0.7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  label: {
    color: '#3F3F46',
    fontSize: 11,
    fontWeight: '700',
  },
  labelSelected: {
    color: '#FFFFFF',
  },
});
