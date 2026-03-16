import React from "react";
import { View, Text, Dimensions, ScrollView } from "react-native";
import Svg, { Rect, Text as SvgText, Line } from "react-native-svg";
import { useColors } from "@/hooks/use-colors";
import { ClassAnalytics } from "@/lib/analytics-service";

interface CollectionRateChartProps {
  data: ClassAnalytics[];
}

export function CollectionRateChart({ data }: CollectionRateChartProps) {
  const colors = useColors();
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 32;
  const chartHeight = 300;
  const padding = { top: 20, bottom: 40, left: 50, right: 20 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  if (data.length === 0) {
    return (
      <View className="bg-surface rounded-lg p-4 border border-border mb-6">
        <Text className="text-sm font-semibold text-muted">No data available</Text>
      </View>
    );
  }

  const barWidth = innerWidth / (data.length * 1.5);
  const barSpacing = innerWidth / data.length;

  return (
    <View className="bg-surface rounded-lg p-4 border border-border mb-6">
      <Text className="text-lg font-semibold text-foreground mb-4">Collection Rate by Class (%)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={Math.max(chartWidth - 8, 400)} height={chartHeight}>
          {/* Y-axis */}
          <Line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={chartHeight - padding.bottom}
            stroke={colors.border}
            strokeWidth={1}
          />

          {/* X-axis */}
          <Line
            x1={padding.left}
            y1={chartHeight - padding.bottom}
            x2={chartWidth - padding.right}
            y2={chartHeight - padding.bottom}
            stroke={colors.border}
            strokeWidth={1}
          />

          {/* Y-axis labels (0, 25, 50, 75, 100) */}
          {[0, 25, 50, 75, 100].map((value) => {
            const y = padding.top + innerHeight - (value / 100) * innerHeight;
            return (
              <React.Fragment key={`y-${value}`}>
                <Line
                  x1={padding.left - 5}
                  y1={y}
                  x2={padding.left}
                  y2={y}
                  stroke={colors.border}
                  strokeWidth={1}
                />
                <SvgText x={padding.left - 35} y={y + 4} fontSize="10" fill={colors.muted} textAnchor="end">
                  {value}%
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((value) => {
            const y = padding.top + innerHeight - (value / 100) * innerHeight;
            return (
              <Line
                key={`grid-${value}`}
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke={colors.border}
                strokeWidth={0.5}
                strokeDasharray="4,4"
                opacity={0.5}
              />
            );
          })}

          {/* Bars */}
          {data.map((classData, index) => {
            const barHeight = (classData.collectionRate / 100) * innerHeight;
            const x = padding.left + index * barSpacing + (barSpacing - barWidth) / 2;
            const y = padding.top + innerHeight - barHeight;

            return (
              <React.Fragment key={`bar-${index}`}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={classData.collectionRate >= 80 ? "#22C55E" : classData.collectionRate >= 50 ? "#F59E0B" : "#EF4444"}
                  rx={4}
                />
                {/* Label */}
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 5}
                  fontSize="11"
                  fill={colors.foreground}
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {classData.collectionRate.toFixed(1)}%
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* X-axis labels */}
          {data.map((classData, index) => {
            const x = padding.left + index * barSpacing + barSpacing / 2;
            return (
              <SvgText
                key={`label-${index}`}
                x={x}
                y={chartHeight - padding.bottom + 20}
                fontSize="10"
                fill={colors.muted}
                textAnchor="middle"
              >
                {classData.className}
              </SvgText>
            );
          })}
        </Svg>
      </ScrollView>
    </View>
  );
}
