import AsyncStorage from "@react-native-async-storage/async-storage";
import { Timetable } from "./types";
import { v4 as uuidv4 } from "uuid";
import { DynamicSupabaseClient } from "./supabase-dynamic-client";

const TIMETABLE_KEY = "timetables";

/**
 * Service for managing class timetables (subject schedules)
 */
export class TimetableService {
  /**
   * Add a new timetable entry
   */
  static async addTimetable(
    classId: string,
    day: string,
    subject: string,
    startTime: string,
    endTime: string
  ): Promise<Timetable> {
    const timetable: Timetable = {
      id: uuidv4(),
      classId,
      day,
      subject,
      startTime,
      endTime,
      createdAt: new Date().toISOString(),
    };

    try {
      // Save locally
      await this.saveLocalTimetable(timetable);

      // Sync to cloud
      await this.syncTimetableToCloud(timetable);

      return timetable;
    } catch (error) {
      console.error("Error adding timetable:", error);
      throw error;
    }
  }

  /**
   * Get all timetables for a class
   */
  static async getTimetablesForClass(classId: string): Promise<Timetable[]> {
    try {
      const timetables = await this.getLocalTimetables();
      return timetables.filter((t) => t.classId === classId).sort((a, b) => {
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        return days.indexOf(a.day) - days.indexOf(b.day);
      });
    } catch (error) {
      console.error("Error fetching timetables:", error);
      return [];
    }
  }

  /**
   * Update timetable entry
   */
  static async updateTimetable(timetable: Timetable): Promise<void> {
    try {
      const timetables = await this.getLocalTimetables();
      const index = timetables.findIndex((t) => t.id === timetable.id);

      if (index !== -1) {
        timetables[index] = timetable;
        await AsyncStorage.setItem(TIMETABLE_KEY, JSON.stringify(timetables));
        await this.syncTimetableToCloud(timetable);
      }
    } catch (error) {
      console.error("Error updating timetable:", error);
      throw error;
    }
  }

  /**
   * Delete timetable entry
   */
  static async deleteTimetable(id: string): Promise<void> {
    try {
      const timetables = await this.getLocalTimetables();
      const filtered = timetables.filter((t) => t.id !== id);
      await AsyncStorage.setItem(TIMETABLE_KEY, JSON.stringify(filtered));
      await this.deleteTimetableFromCloud(id);
    } catch (error) {
      console.error("Error deleting timetable:", error);
      throw error;
    }
  }

  /**
   * Save timetable locally
   */
  private static async saveLocalTimetable(timetable: Timetable): Promise<void> {
    try {
      const timetables = await this.getLocalTimetables();
      timetables.push(timetable);
      await AsyncStorage.setItem(TIMETABLE_KEY, JSON.stringify(timetables));
    } catch (error) {
      console.error("Error saving timetable locally:", error);
      throw error;
    }
  }

  /**
   * Get all local timetables
   */
  static async getLocalTimetables(): Promise<Timetable[]> {
    try {
      const data = await AsyncStorage.getItem(TIMETABLE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error loading timetables:", error);
      return [];
    }
  }

  /**
   * Sync timetable to cloud (Supabase)
   */
  private static async syncTimetableToCloud(timetable: Timetable): Promise<void> {
    try {
      if (!await DynamicSupabaseClient.isConfigured()) return;
      const client = await DynamicSupabaseClient.getClient();
      if (!client) return;

      const { error } = await client.from("timetables").upsert([timetable], {
        onConflict: "id",
      });

      if (error) {
        console.error("Error syncing timetable to cloud:", error);
      }
    } catch (error) {
      console.error("Error syncing timetable to cloud:", error);
    }
  }

  /**
   * Delete timetable from cloud (Supabase)
   */
  private static async deleteTimetableFromCloud(id: string): Promise<void> {
    try {
      if (!await DynamicSupabaseClient.isConfigured()) return;
      const client = await DynamicSupabaseClient.getClient();
      if (!client) return;

      const { error } = await client.from("timetables").delete().eq("id", id);

      if (error) {
        console.error("Error deleting timetable from cloud:", error);
      }
    } catch (error) {
      console.error("Error deleting timetable from cloud:", error);
    }
  }

  /**
   * Fetch timetables from cloud (Supabase)
   */
  static async fetchTimetablesFromCloud(): Promise<Timetable[]> {
    try {
      if (!await DynamicSupabaseClient.isConfigured()) {
        return [];
      }

      const client = await DynamicSupabaseClient.getClient();
      if (!client) return [];

      const { data, error } = await client.from("timetables").select("*");

      if (error) {
        console.error("Error fetching timetables from cloud:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching timetables from cloud:", error);
      return [];
    }
  }

  /**
   * Sync timetables between local and cloud
   */
  static async syncTimetables(): Promise<void> {
    try {
      if (!await DynamicSupabaseClient.isConfigured()) {
        return;
      }

      // Fetch from cloud
      const cloudTimetables = await this.fetchTimetablesFromCloud();

      // Merge with local (cloud takes precedence)
      const localTimetables = await this.getLocalTimetables();
      const merged = [...localTimetables];

      for (const cloudTimetable of cloudTimetables) {
        const index = merged.findIndex((t) => t.id === cloudTimetable.id);
        if (index !== -1) {
          merged[index] = cloudTimetable;
        } else {
          merged.push(cloudTimetable);
        }
      }

      await AsyncStorage.setItem(TIMETABLE_KEY, JSON.stringify(merged));
    } catch (error) {
      console.error("Error syncing timetables:", error);
    }
  }
}
