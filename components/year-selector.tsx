import React from 'react';
import { View, Text, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';

interface YearSelectorProps {
  year: number;
  onYearChange: (year: number) => void;
  minYear?: number;
  maxYear?: number;
}

/**
 * Year Selector Component
 * Displays current year with left/right arrows to navigate between years
 * Allows users to view and manage payments for different years
 */
export function YearSelector({
  year,
  onYearChange,
  minYear = 2020,
  maxYear = new Date().getFullYear() + 5,
}: YearSelectorProps) {
  const colors = useColors();

  const handlePreviousYear = () => {
    if (year > minYear) {
      onYearChange(year - 1);
    }
  };

  const handleNextYear = () => {
    if (year < maxYear) {
      onYearChange(year + 1);
    }
  };

  const canGoPrevious = year > minYear;
  const canGoNext = year < maxYear;

  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-surface rounded-lg mb-4 border border-border">
      {/* Left Arrow Button */}
      <Pressable
        onPress={handlePreviousYear}
        disabled={!canGoPrevious}
        className="p-2"
        style={({ pressed }) => [
          {
            opacity: pressed && canGoPrevious ? 0.7 : canGoPrevious ? 1 : 0.3,
          },
        ]}
      >
        <MaterialIcons
          name="chevron-left"
          size={28}
          color={canGoPrevious ? colors.primary : colors.muted}
        />
      </Pressable>

      {/* Year Display */}
      <View className="flex-1 items-center">
        <Text className="text-2xl font-bold text-foreground">{year}</Text>
        <Text className="text-xs text-muted mt-1">Academic Year</Text>
      </View>

      {/* Right Arrow Button */}
      <Pressable
        onPress={handleNextYear}
        disabled={!canGoNext}
        className="p-2"
        style={({ pressed }) => [
          {
            opacity: pressed && canGoNext ? 0.7 : canGoNext ? 1 : 0.3,
          },
        ]}
      >
        <MaterialIcons
          name="chevron-right"
          size={28}
          color={canGoNext ? colors.primary : colors.muted}
        />
      </Pressable>
    </View>
  );
}
