import { View, Text, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useStudents } from "@/lib/student-context";
import { useEffect, useState } from "react";
import { calculateClassAnalytics, ClassAnalytics } from "@/lib/analytics-service";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import { CollectionRateChart } from "@/components/charts/collection-rate-chart";
import { OutstandingAmountChart } from "@/components/charts/outstanding-amount-chart";
import { CollectionComparisonChart } from "@/components/charts/collection-comparison-chart";

const screenWidth = Dimensions.get("window").width;

export default function ClassAnalyticsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { students, payments, refreshData } = useStudents();
  const [analyticsData, setAnalyticsData] = useState<ReturnType<typeof calculateClassAnalytics> | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      const data = calculateClassAnalytics(students, payments);
      setAnalyticsData(data);
      if (data.classes.length > 0 && !selectedClass) {
        setSelectedClass(data.classes[0].className);
      }
    }
  }, [students, payments]);

  if (!analyticsData) {
    return (
      <ScreenContainer className="p-4">
        <Text className="text-muted">Loading analytics...</Text>
      </ScreenContainer>
    );
  }

  const selectedClassData = analyticsData.classes.find((c) => c.className === selectedClass);

  const getCollectionRateColor = (rate: number) => {
    if (rate >= 80) return colors.success;
    if (rate >= 50) return colors.warning;
    return colors.error;
  };

  const renderClassCard = (classData: ClassAnalytics) => {
    const isSelected = selectedClass === classData.className;
    return (
      <TouchableOpacity
        key={classData.className}
        onPress={() => setSelectedClass(classData.className)}
        style={{
          opacity: 1,
        }}
        activeOpacity={0.7}
      >
        <View
          className={`rounded-lg p-4 mb-3 border ${
            isSelected ? "border-primary bg-primary/10" : "border-border bg-surface"
          }`}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className={`text-lg font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
              {classData.className}
            </Text>
            <View
              style={{
                backgroundColor: getCollectionRateColor(classData.collectionRate),
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 4,
              }}
            >
              <Text className="text-white text-sm font-semibold">
                {classData.collectionRate.toFixed(1)}%
              </Text>
            </View>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-muted">
              {classData.paidStudents}/{classData.totalStudents} Paid
            </Text>
            <Text className="text-xs text-muted">
              RS{classData.collectedAmount}/{classData.totalFeeAmount}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={true}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">Class Analytics</Text>
          <Text className="text-sm text-muted mt-1">Fee collection by class</Text>
        </View>

        {/* Overall Stats */}
        <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">Overall Statistics</Text>
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-2xl font-bold text-primary">{analyticsData.totalStudents}</Text>
              <Text className="text-xs text-muted mt-1">Total Students</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-success">
                {analyticsData.overallCollectionRate.toFixed(1)}%
              </Text>
              <Text className="text-xs text-muted mt-1">Collection Rate</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-warning">
                RS{analyticsData.totalCollectedAmount}
              </Text>
              <Text className="text-xs text-muted mt-1">Collected</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-error">
                RS{analyticsData.totalOutstandingAmount}
              </Text>
              <Text className="text-xs text-muted mt-1">Outstanding</Text>
            </View>
          </View>
        </View>

        {/* Top and Lowest Performing */}
        {analyticsData.topPerformingClass && analyticsData.lowestPerformingClass && (
          <View className="mb-6 flex-row gap-3">
            <View className="flex-1 bg-success/10 rounded-lg p-4 border border-success">
              <View className="flex-row items-center mb-2">
                <MaterialIcons name="trending-up" size={20} color={colors.success} />
                <Text className="text-sm font-semibold text-success ml-2">Top Performer</Text>
              </View>
              <Text className="text-lg font-bold text-foreground">
                {analyticsData.topPerformingClass.className}
              </Text>
              <Text className="text-xs text-muted mt-1">
                {analyticsData.topPerformingClass.collectionRate.toFixed(1)}% Collection Rate
              </Text>
            </View>

            <View className="flex-1 bg-error/10 rounded-lg p-4 border border-error">
              <View className="flex-row items-center mb-2">
                <MaterialIcons name="trending-down" size={20} color={colors.error} />
                <Text className="text-sm font-semibold text-error ml-2">Needs Attention</Text>
              </View>
              <Text className="text-lg font-bold text-foreground">
                {analyticsData.lowestPerformingClass.className}
              </Text>
              <Text className="text-xs text-muted mt-1">
                {analyticsData.lowestPerformingClass.collectionRate.toFixed(1)}% Collection Rate
              </Text>
            </View>
          </View>
        )}

        {/* Class Selection */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">Classes</Text>
          {analyticsData.classes.map((classData) => renderClassCard(classData))}
        </View>

        {/* Selected Class Details */}
        {selectedClassData && (
          <View className="bg-surface rounded-lg p-4 border border-border mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">
              {selectedClassData.className} - Detailed View
            </Text>

            {/* Collection Status */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Collection Status</Text>
              <View className="bg-background rounded-lg p-3 mb-2">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-muted">Collection Rate</Text>
                  <Text className="text-sm font-bold text-foreground">
                    {selectedClassData.collectionRate.toFixed(1)}%
                  </Text>
                </View>
                <View
                  style={{
                    height: 8,
                    backgroundColor: colors.border,
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${selectedClassData.collectionRate}%`,
                      backgroundColor: getCollectionRateColor(selectedClassData.collectionRate),
                    }}
                  />
                </View>
              </View>
            </View>

            {/* Financial Summary */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Financial Summary</Text>
              <View className="flex-row justify-between bg-background rounded-lg p-3 mb-2">
                <Text className="text-sm text-muted">Total Fee Amount</Text>
                <Text className="text-sm font-bold text-foreground">
                  RS{selectedClassData.totalFeeAmount}
                </Text>
              </View>
              <View className="flex-row justify-between bg-background rounded-lg p-3 mb-2">
                <Text className="text-sm text-muted">Collected Amount</Text>
                <Text className="text-sm font-bold text-success">
                  RS{selectedClassData.collectedAmount}
                </Text>
              </View>
              <View className="flex-row justify-between bg-background rounded-lg p-3">
                <Text className="text-sm text-muted">Outstanding Amount</Text>
                <Text className="text-sm font-bold text-error">
                  RS{selectedClassData.outstandingAmount}
                </Text>
              </View>
            </View>

            {/* Student Summary */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Student Summary</Text>
              <View className="flex-row justify-around">
                <View className="items-center bg-background rounded-lg p-3 flex-1 mr-2">
                  <Text className="text-2xl font-bold text-primary">
                    {selectedClassData.totalStudents}
                  </Text>
                  <Text className="text-xs text-muted mt-1">Total Students</Text>
                </View>
                <View className="items-center bg-background rounded-lg p-3 flex-1 mr-2">
                  <Text className="text-2xl font-bold text-success">
                    {selectedClassData.paidStudents}
                  </Text>
                  <Text className="text-xs text-muted mt-1">Paid</Text>
                </View>
                <View className="items-center bg-background rounded-lg p-3 flex-1">
                  <Text className="text-2xl font-bold text-warning">
                    {selectedClassData.pendingStudents}
                  </Text>
                  <Text className="text-xs text-muted mt-1">Pending</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Charts Section */}
        {analyticsData.classes.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">Visualizations</Text>
            <CollectionRateChart data={analyticsData.classes} />
            <CollectionComparisonChart data={analyticsData.classes} />
            <OutstandingAmountChart data={analyticsData.classes} />
          </View>
        )}

        {/* Empty State */}
        {analyticsData.classes.length === 0 && (
          <View className="flex-1 items-center justify-center py-8">
            <MaterialIcons name="bar-chart" size={48} color={colors.muted} />
            <Text className="text-lg font-semibold text-foreground mt-4">No Data Yet</Text>
            <Text className="text-sm text-muted text-center mt-2">
              Add students and record payments to see analytics
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
