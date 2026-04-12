// import { View, Text, TouchableOpacity, ScrollView, Alert, Switch, FlatList } from "react-native";
// import { ScreenContainer } from "@/components/screen-container";
// import { useRouter } from "expo-router";
// import { useEffect, useState } from "react";
// import MaterialIcons from "@expo/vector-icons/MaterialIcons";
// import { useColors } from "@/hooks/use-colors";
// import {
//   getReminders,
//   toggleReminder,
//   deleteReminder,
//   formatReminderTime,
//   getNextReminderTriggerDate,
//   ReminderConfig,
// } from "@/lib/recurring-reminder-service";

// export default function RecurringRemindersScreen() {
//   const router = useRouter();
//   const colors = useColors();
//   const [reminders, setReminders] = useState<ReminderConfig[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadReminders();
//   }, []);

//   const loadReminders = async () => {
//     try {
//       setLoading(true);
//       const data = await getReminders();
//       setReminders(data);
//     } catch (error) {
//       console.error("Error loading reminders:", error);
//       Alert.alert("Error", "Failed to load reminders");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleToggleReminder = async (id: string) => {
//     try {
//       await toggleReminder(id);
//       await loadReminders();
//     } catch (error) {
//       Alert.alert("Error", "Failed to update reminder");
//     }
//   };

//   const handleDeleteReminder = (id: string) => {
//     Alert.alert(
//       "Delete Reminder",
//       "Are you sure you want to delete this reminder?",
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Delete",
//           onPress: async () => {
//             try {
//               await deleteReminder(id);
//               await loadReminders();
//             } catch (error) {
//               Alert.alert("Error", "Failed to delete reminder");
//             }
//           },
//           style: "destructive",
//         },
//       ]
//     );
//   };

//   const renderReminderItem = ({ item }: { item: ReminderConfig }) => {
//     const nextTrigger = getNextReminderTriggerDate(item);
//     const nextTriggerText = nextTrigger.toLocaleDateString("en-IN", {
//       month: "short",
//       day: "numeric",
//       year: "numeric",
//     });

//     return (
//       <View className="bg-surface rounded-lg p-4 mb-3 border border-border">
//         <View className="flex-row items-center justify-between mb-3">
//           <View className="flex-1">
//             <Text className="text-base font-semibold text-foreground">
//               {item.reminderDate}
//               <Text className="text-xs text-muted"> of every month</Text>
//             </Text>
//             <Text className="text-sm text-muted mt-1">{formatReminderTime(item.reminderTime)}</Text>
//           </View>
//           <Switch
//             value={item.enabled}
//             onValueChange={() => handleToggleReminder(item.id)}
//             trackColor={{ false: colors.border, true: colors.success }}
//             thumbColor={item.enabled ? colors.primary : colors.muted}
//           />
//         </View>

//         <View className="bg-background rounded p-2 mb-3">
//           <Text className="text-xs text-muted mb-1">Message:</Text>
//           <Text className="text-sm text-foreground">{item.message}</Text>
//         </View>

//         <View className="flex-row items-center justify-between mb-3">
//           <View>
//             <Text className="text-xs text-muted">Frequency</Text>
//             <Text className="text-sm font-semibold text-foreground capitalize">{item.frequency}</Text>
//           </View>
//           <View>
//             <Text className="text-xs text-muted">Next Trigger</Text>
//             <Text className="text-sm font-semibold text-primary">{nextTriggerText}</Text>
//           </View>
//         </View>

//         <View className="flex-row gap-2">
//           <TouchableOpacity
//             onPress={() => router.push(`/edit-reminder/${item.id}`)}
//             style={{
//               flex: 1,
//               backgroundColor: colors.primary,
//               borderRadius: 6,
//               paddingVertical: 8,
//               alignItems: "center",
//             }}
//             activeOpacity={0.8}
//           >
//             <View className="flex-row items-center">
//               <MaterialIcons name="edit" size={16} color="#ffffff" />
//               <Text className="text-white font-semibold ml-2">Edit</Text>
//             </View>
//           </TouchableOpacity>

//           <TouchableOpacity
//             onPress={() => handleDeleteReminder(item.id)}
//             style={{
//               flex: 1,
//               backgroundColor: colors.error,
//               borderRadius: 6,
//               paddingVertical: 8,
//               alignItems: "center",
//             }}
//             activeOpacity={0.8}
//           >
//             <View className="flex-row items-center">
//               <MaterialIcons name="delete" size={16} color="#ffffff" />
//               <Text className="text-white font-semibold ml-2">Delete</Text>
//             </View>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   };

//   return (
//     <ScreenContainer className="p-4">
//       <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
//         {/* Header */}
//         <View className="mb-6 flex-row items-center">
//           <MaterialIcons name="schedule" size={28} color={colors.primary} style={{ marginRight: 8 }} />
//           <View className="flex-1">
//             <Text className="text-3xl font-bold text-foreground">Recurring Reminders</Text>
//             <Text className="text-sm text-muted mt-1">Automated payment reminders</Text>
//           </View>
//         </View>

//         {/* Add New Reminder Button */}
//         <TouchableOpacity
//           onPress={() => router.push("/add-reminder")}
//           style={{
//             backgroundColor: colors.primary,
//             borderRadius: 8,
//             paddingVertical: 12,
//             paddingHorizontal: 16,
//             marginBottom: 6,
//             flexDirection: "row",
//             alignItems: "center",
//             justifyContent: "center",
//           }}
//           activeOpacity={0.8}
//         >
//           <MaterialIcons name="add" size={20} color="#ffffff" />
//           <Text className="text-white font-semibold ml-2">Create New Reminder</Text>
//         </TouchableOpacity>

//         {/* Reminders List */}
//         {loading ? (
//           <View className="flex-1 items-center justify-center">
//             <MaterialIcons name="schedule" size={48} color={colors.muted} />
//             <Text className="text-lg font-semibold text-foreground mt-4">Loading...</Text>
//           </View>
//         ) : reminders.length === 0 ? (
//           <View className="flex-1 items-center justify-center py-8">
//             <MaterialIcons name="schedule" size={48} color={colors.muted} />
//             <Text className="text-lg font-semibold text-foreground mt-4">No Reminders Yet</Text>
//             <Text className="text-sm text-muted text-center mt-2">
//               Create your first recurring reminder to automate fee collection notifications
//             </Text>
//           </View>
//         ) : (
//           <FlatList
//             data={reminders}
//             renderItem={renderReminderItem}
//             keyExtractor={(item) => item.id}
//             scrollEnabled={false}
//             contentContainerStyle={{ flexGrow: 1 }}
//           />
//         )}
//       </ScrollView>
//     </ScreenContainer>
//   );
// }
