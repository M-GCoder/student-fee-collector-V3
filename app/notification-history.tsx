// import { View, Text, TouchableOpacity, ScrollView, FlatList, Alert } from "react-native";
// import { ScreenContainer } from "@/components/screen-container";
// import { useRouter, useFocusEffect } from "expo-router";
// import { useState, useCallback } from "react";
// import MaterialIcons from "@expo/vector-icons/MaterialIcons";
// import { useColors } from "@/hooks/use-colors";
// import {
//   getNotificationHistory,
//   clearNotificationHistory,
//   NotificationRecord,
// } from "@/lib/notification-service";

// export default function NotificationHistoryScreen() {
//   const router = useRouter();
//   const colors = useColors();
//   const [history, setHistory] = useState<NotificationRecord[]>([]);
//   const [loading, setLoading] = useState(true);

//   useFocusEffect(
//     useCallback(() => {
//       loadHistory();
//     }, [])
//   );

//   const loadHistory = async () => {
//     try {
//       setLoading(true);
//       const records = await getNotificationHistory();
//       setHistory(records.reverse()); // Show newest first
//     } catch (error) {
//       Alert.alert("Error", "Failed to load notification history");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleClearHistory = () => {
//     Alert.alert(
//       "Clear History",
//       "Are you sure you want to delete all notification records? This action cannot be undone.",
//       [
//         { text: "Cancel", onPress: () => {}, style: "cancel" },
//         {
//           text: "Clear",
//           onPress: async () => {
//             try {
//               await clearNotificationHistory();
//               setHistory([]);
//               Alert.alert("Success", "Notification history cleared");
//             } catch (error) {
//               Alert.alert("Error", "Failed to clear history");
//             }
//           },
//           style: "destructive",
//         },
//       ]
//     );
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-IN", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   const getNotificationIcon = (type: string) => {
//     switch (type) {
//       case "unpaid_reminder":
//         return "warning";
//       case "payment_confirmation":
//         return "check-circle";
//       default:
//         return "notifications";
//     }
//   };

//   const getNotificationColor = (type: string) => {
//     switch (type) {
//       case "unpaid_reminder":
//         return colors.warning;
//       case "payment_confirmation":
//         return colors.success;
//       default:
//         return colors.primary;
//     }
//   };

//   const renderNotificationItem = ({ item }: { item: NotificationRecord }) => (
//     <View className="bg-surface rounded-lg p-4 mb-3 border border-border">
//       <View className="flex-row items-start">
//         <MaterialIcons
//           name={getNotificationIcon(item.type) as any}
//           size={20}
//           color={getNotificationColor(item.type)}
//           style={{ marginRight: 12, marginTop: 2 }}
//         />
//         <View className="flex-1">
//           <Text className="text-base font-semibold text-foreground">{item.studentName}</Text>
//           <Text className="text-sm text-muted mt-1">{item.message}</Text>
//           <Text className="text-xs text-muted mt-2">{formatDate(item.sentAt)}</Text>
//         </View>
//       </View>
//     </View>
//   );

//   return (
//     <ScreenContainer className="p-4">
//       <View className="flex-1">
//         {/* Header */}
//         <View className="mb-6 flex-row items-center">
//           <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
//             <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
//           </TouchableOpacity>
//           <MaterialIcons name="history" size={28} color={colors.primary} style={{ marginRight: 8 }} />
//           <View className="flex-1">
//             <Text className="text-2xl font-bold text-foreground">Notification History</Text>
//             <Text className="text-sm text-muted mt-1">All sent notifications</Text>
//           </View>
//         </View>

//         {/* Stats */}
//         {history.length > 0 && (
//           <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
//             <View className="flex-row justify-between">
//               <View className="items-center">
//                 <Text className="text-2xl font-bold text-primary">{history.length}</Text>
//                 <Text className="text-xs text-muted mt-1">Total Notifications</Text>
//               </View>
//               <View className="items-center">
//                 <Text className="text-2xl font-bold text-warning">
//                   {history.filter((n) => n.type === "unpaid_reminder").length}
//                 </Text>
//                 <Text className="text-xs text-muted mt-1">Fee Reminders</Text>
//               </View>
//               <View className="items-center">
//                 <Text className="text-2xl font-bold text-success">
//                   {history.filter((n) => n.type === "payment_confirmation").length}
//                 </Text>
//                 <Text className="text-xs text-muted mt-1">Confirmations</Text>
//               </View>
//             </View>
//           </View>
//         )}

//         {/* Loading State */}
//         {loading && (
//           <View className="flex-1 items-center justify-center">
//             <Text className="text-muted">Loading...</Text>
//           </View>
//         )}

//         {/* Empty State */}
//         {!loading && history.length === 0 && (
//           <View className="flex-1 items-center justify-center">
//             <MaterialIcons name="notifications-off" size={48} color={colors.muted} />
//             <Text className="text-lg font-semibold text-foreground mt-4">No Notifications</Text>
//             <Text className="text-sm text-muted text-center mt-2">
//               Notifications you send will appear here
//             </Text>
//           </View>
//         )}

//         {/* Notification List */}
//         {!loading && history.length > 0 && (
//           <FlatList
//             data={history}
//             renderItem={renderNotificationItem}
//             keyExtractor={(item) => item.id}
//             scrollEnabled={false}
//             contentContainerStyle={{ flexGrow: 1 }}
//           />
//         )}
//       </View>

//       {/* Clear Button */}
//       {history.length > 0 && (
//         <TouchableOpacity
//           onPress={handleClearHistory}
//           style={{
//             backgroundColor: colors.error,
//             borderRadius: 8,
//             paddingVertical: 12,
//             paddingHorizontal: 16,
//             flexDirection: "row",
//             alignItems: "center",
//             justifyContent: "center",
//             marginTop: 16,
//           }}
//           activeOpacity={0.8}
//         >
//           <MaterialIcons name="delete-sweep" size={20} color="#ffffff" />
//           <Text className="text-white font-semibold ml-3">Clear History</Text>
//         </TouchableOpacity>
//       )}
//     </ScreenContainer>
//   );
// }
