import React from "react";
import { View, Text, Dimensions, ScrollView } from "react-native";
import Svg, { Rect, Text as SvgText, Line } from "react-native-svg";
import { useColors } from "@/hooks/use-colors";
import { ClassAnalytics } from "@/lib/analytics-service";

interface CollectionComparisonChartProps {
  data: ClassAnalytics[];
}

export function CollectionComparisonChart({ data }: CollectionComparisonChartProps) {
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

  // Find max value for scaling
  const maxValue = Math.max(...data.map((c) => Math.max(c.collectedAmount, c.outstandingAmount)));
  const scale = maxValue > 0 ? innerHeight / maxValue : 1;

  const barGroupWidth = innerWidth / (data.length * 2.5);
  const barSpacing = innerWidth / data.length;

  return (
    <View className="bg-surface rounded-lg p-4 border border-border mb-6">
      <Text className="text-lg font-semibold text-foreground mb-4">Collected vs Outstanding (RS)</Text>
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

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const value = Math.round(maxValue * ratio);
            const y = padding.top + innerHeight - ratio * innerHeight;
            return (
              <React.Fragment key={`y-${ratio}`}>
                <Line
                  x1={padding.left - 5}
                  y1={y}
                  x2={padding.left}
                  y2={y}
                  stroke={colors.border}
                  strokeWidth={1}
                />
                <SvgText x={padding.left - 35} y={y + 4} fontSize="10" fill={colors.muted} textAnchor="end">
                  {value}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + innerHeight - ratio * innerHeight;
            return (
              <Line
                key={`grid-${ratio}`}
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
            const collectedHeight = classData.collectedAmount * scale;
            const outstandingHeight = classData.outstandingAmount * scale;
            const groupX = padding.left + index * barSpacing + (barSpacing - barGroupWidth * 2 - 4) / 2;
            const collectedX = groupX;
            const outstandingX = groupX + barGroupWidth + 4;
            const baseY = padding.top + innerHeight;

            return (
              <React.Fragment key={`bars-${index}`}>
                {/* Collected bar */}
                <Rect
                  x={collectedX}
                  y={baseY - collectedHeight}
                  width={barGroupWidth}
                  height={collectedHeight}
                  fill="#22C55E"
                  rx={2}
                />
                <SvgText
                  x={collectedX + barGroupWidth / 2}
                  y={baseY - collectedHeight - 5}
                  fontSize="10"
                  fill={colors.foreground}
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {classData.collectedAmount}
                </SvgText>

                {/* Outstanding bar */}
                <Rect
                  x={outstandingX}
                  y={baseY - outstandingHeight}
                  width={barGroupWidth}
                  height={outstandingHeight}
                  fill="#EF4444"
                  rx={2}
                />
                <SvgText
                  x={outstandingX + barGroupWidth / 2}
                  y={baseY - outstandingHeight - 5}
                  fontSize="10"
                  fill={colors.foreground}
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {classData.outstandingAmount}
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

      {/* Legend */}
      <View className="mt-4 flex-row justify-center gap-6">
        <View className="flex-row items-center">
          <View style={{ width: 12, height: 12, backgroundColor: "#22C55E", borderRadius: 2, marginRight: 6 }} />
          <Text className="text-sm text-foreground">Collected</Text>
        </View>
        <View className="flex-row items-center">
          <View style={{ width: 12, height: 12, backgroundColor: "#EF4444", borderRadius: 2, marginRight: 6 }} />
          <Text className="text-sm text-foreground">Outstanding</Text>
        </View>
      </View>
    </View>
  );
}
