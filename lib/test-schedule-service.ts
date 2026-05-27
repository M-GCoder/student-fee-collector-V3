import AsyncStorage from "@react-native-async-storage/async-storage";
import { TestSchedule } from "./types";
import { v4 as uuidv4 } from "uuid";
import { DynamicSupabaseClient } from "./supabase-dynamic-client";

const TEST_SCHEDULE_KEY = "test_schedules";

/**
 * Service for managing class test schedules
 */
export class TestScheduleService {
  /**
   * Add a new test schedule
   */
  static async addTestSchedule(
    classId: string,
    subject: string,
    testDate: string,
    startTime?: string,
    endTime?: string
  ): Promise<TestSchedule> {
    const testSchedule: TestSchedule = {
      id: uuidv4(),
      classId,
      subject,
      testDate,
      startTime,
      endTime,
      createdAt: new Date().toISOString(),
    };

    try {
      // Save locally
      await this.saveLocalTestSchedule(testSchedule);

      // Sync to cloud
      await this.syncTestScheduleToCloud(testSchedule);

      return testSchedule;
    } catch (error) {
      console.error("Error adding test schedule:", error);
      throw error;
    }
  }

  /**
   * Get all test schedules for a class
   */
  static async getTestSchedulesForClass(classId: string): Promise<TestSchedule[]> {
    try {
      const schedules = await this.getLocalTestSchedules();
      return schedules
        .filter((t) => t.classId === classId)
        .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime());
    } catch (error) {
      console.error("Error fetching test schedules:", error);
      return [];
    }
  }

  /**
   * Update test schedule
   */
  static async updateTestSchedule(testSchedule: TestSchedule): Promise<void> {
    try {
      const schedules = await this.getLocalTestSchedules();
      const index = schedules.findIndex((t) => t.id === testSchedule.id);

      if (index !== -1) {
        schedules[index] = testSchedule;
        await AsyncStorage.setItem(TEST_SCHEDULE_KEY, JSON.stringify(schedules));
        await this.syncTestScheduleToCloud(testSchedule);
      }
    } catch (error) {
      console.error("Error updating test schedule:", error);
      throw error;
    }
  }

  /**
   * Delete test schedule
   */
  static async deleteTestSchedule(id: string): Promise<void> {
    try {
      const schedules = await this.getLocalTestSchedules();
      const filtered = schedules.filter((t) => t.id !== id);
      await AsyncStorage.setItem(TEST_SCHEDULE_KEY, JSON.stringify(filtered));
      await this.deleteTestScheduleFromCloud(id);
    } catch (error) {
      console.error("Error deleting test schedule:", error);
      throw error;
    }
  }

  /**
   * Save test schedule locally
   */
  private static async saveLocalTestSchedule(testSchedule: TestSchedule): Promise<void> {
    try {
      const schedules = await this.getLocalTestSchedules();
      schedules.push(testSchedule);
      await AsyncStorage.setItem(TEST_SCHEDULE_KEY, JSON.stringify(schedules));
    } catch (error) {
      console.error("Error saving test schedule locally:", error);
      throw error;
    }
  }

  /**
   * Get all local test schedules
   */
  static async getLocalTestSchedules(): Promise<TestSchedule[]> {
    try {
      const data = await AsyncStorage.getItem(TEST_SCHEDULE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error loading test schedules:", error);
      return [];
    }
  }

  /**
   * Sync test schedule to cloud (Supabase)
   */
  private static async syncTestScheduleToCloud(testSchedule: TestSchedule): Promise<void> {
    try {
      if (!await DynamicSupabaseClient.isConfigured()) return;
      const client = await DynamicSupabaseClient.getClient();
      if (!client) return;

      const { error } = await client.from("test_schedules").upsert([testSchedule], {
        onConflict: "id",
      });

      if (error) {
        console.error("Error syncing test schedule to cloud:", error);
      }
    } catch (error) {
      console.error("Error syncing test schedule to cloud:", error);
    }
  }

  /**
   * Delete test schedule from cloud (Supabase)
   */
  private static async deleteTestScheduleFromCloud(id: string): Promise<void> {
    try {
      if (!await DynamicSupabaseClient.isConfigured()) return;
      const client = await DynamicSupabaseClient.getClient();
      if (!client) return;

      const { error } = await client.from("test_schedules").delete().eq("id", id);

      if (error) {
        console.error("Error deleting test schedule from cloud:", error);
      }
    } catch (error) {
      console.error("Error deleting test schedule from cloud:", error);
    }
  }

  /**
   * Fetch test schedules from cloud (Supabase)
   */
  static async fetchTestSchedulesFromCloud(): Promise<TestSchedule[]> {
    try {
      if (!await DynamicSupabaseClient.isConfigured()) {
        return [];
      }

      const client = await DynamicSupabaseClient.getClient();
      if (!client) return [];

      const { data, error } = await client.from("test_schedules").select("*");

      if (error) {
        console.error("Error fetching test schedules from cloud:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching test schedules from cloud:", error);
      return [];
    }
  }

  /**
   * Sync test schedules between local and cloud
   */
  static async syncTestSchedules(): Promise<void> {
    try {
      if (!await DynamicSupabaseClient.isConfigured()) {
        return;
      }

      // Fetch from cloud
      const cloudSchedules = await this.fetchTestSchedulesFromCloud();

      // Merge with local (cloud takes precedence)
      const localSchedules = await this.getLocalTestSchedules();
      const merged = [...localSchedules];

      for (const cloudSchedule of cloudSchedules) {
        const index = merged.findIndex((t) => t.id === cloudSchedule.id);
        if (index !== -1) {
          merged[index] = cloudSchedule;
        } else {
          merged.push(cloudSchedule);
        }
      }

      await AsyncStorage.setItem(TEST_SCHEDULE_KEY, JSON.stringify(merged));
    } catch (error) {
      console.error("Error syncing test schedules:", error);
    }
  }
}
