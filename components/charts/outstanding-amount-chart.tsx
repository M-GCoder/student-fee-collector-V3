import React from "react";
import { View, Text, Dimensions } from "react-native";
import Svg, { Circle, Text as SvgText, Path } from "react-native-svg";
import { useColors } from "@/hooks/use-colors";
import { ClassAnalytics } from "@/lib/analytics-service";

interface OutstandingAmountChartProps {
  data: ClassAnalytics[];
}

export function OutstandingAmountChart({ data }: OutstandingAmountChartProps) {
  const colors = useColors();
  const screenWidth = Dimensions.get("window").width;
  const chartSize = Math.min(screenWidth - 32, 300);
  const centerX = chartSize / 2;
  const centerY = chartSize / 2;
  const radius = chartSize / 3;

  if (data.length === 0) {
    return (
      <View className="bg-surface rounded-lg p-4 border border-border mb-6">
        <Text className="text-sm font-semibold text-muted">No data available</Text>
      </View>
    );
  }

  const totalOutstanding = data.reduce((sum, c) => sum + c.outstandingAmount, 0);

  if (totalOutstanding === 0) {
    return (
      <View className="bg-surface rounded-lg p-4 border border-border mb-6">
        <Text className="text-lg font-semibold text-foreground mb-4">Outstanding Amount by Class</Text>
        <View className="items-center py-8">
          <Text className="text-lg font-semibold text-success">All fees collected!</Text>
        </View>
      </View>
    );
  }

  const slices = data
    .filter((c) => c.outstandingAmount > 0)
    .map((classData) => ({
      ...classData,
      percentage: (classData.outstandingAmount / totalOutstanding) * 100,
    }));

  let currentAngle = -Math.PI / 2;
  const sliceData = slices.map((slice) => {
    const sliceAngle = (slice.percentage / 100) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;

    const startX = centerX + radius * Math.cos(startAngle);
    const startY = centerY + radius * Math.sin(startAngle);
    const endX = centerX + radius * Math.cos(endAngle);
    const endY = centerY + radius * Math.sin(endAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    const pathData = `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;

    const labelAngle = startAngle + sliceAngle / 2;
    const labelRadius = radius * 0.65;
    const labelX = centerX + labelRadius * Math.cos(labelAngle);
    const labelY = centerY + labelRadius * Math.sin(labelAngle);

    currentAngle = endAngle;

    return { slice, pathData, labelX, labelY };
  });

  const colors_array = ["#EF4444", "#F59E0B", "#FCD34D", "#FBBF24", "#FB923C"];

  return (
    <View className="bg-surface rounded-lg p-4 border border-border mb-6">
      <Text className="text-lg font-semibold text-foreground mb-4">Outstanding Amount by Class</Text>
      <View style={{ alignItems: "center" }}>
        <Svg width={chartSize} height={chartSize}>
          {sliceData.map((item, index) => (
            <React.Fragment key={`slice-${index}`}>
              <Path
                d={item.pathData}
                fill={colors_array[index % colors_array.length]}
                stroke={colors.background}
                strokeWidth={2}
              />
              <SvgText
                x={item.labelX}
                y={item.labelY}
                fontSize="12"
                fill={colors.background}
                textAnchor="middle"
                fontWeight="600"
              >
                {item.slice.percentage.toFixed(0)}%
              </SvgText>
            </React.Fragment>
          ))}
        </Svg>
      </View>

      {/* Legend */}
      <View className="mt-4 gap-2">
        {sliceData.map((item, index) => (
          <View key={`legend-${index}`} className="flex-row items-center">
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                backgroundColor: colors_array[index % colors_array.length],
                marginRight: 8,
              }}
            />
            <Text className="text-sm text-foreground flex-1">{item.slice.className}</Text>
            <Text className="text-sm font-semibold text-foreground">RS{item.slice.outstandingAmount}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
