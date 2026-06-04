import AsyncStorage from "@react-native-async-storage/async-storage";
import { Class } from "./types";
import { DynamicSupabaseClient } from "./supabase-dynamic-client";
import { v4 as uuidv4 } from "uuid";

const CLASSES_STORAGE_KEY = "classes";

/**
 * Class management service for local and cloud storage
 */
export class ClassService {
  /**
   * Get all classes from local storage
   */
  static async getLocalClasses(): Promise<Class[]> {
    try {
      const data = await AsyncStorage.getItem(CLASSES_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading classes from local storage:", error);
      return [];
    }
  }

  /**
   * Save classes to local storage
   */
  static async saveLocalClasses(classes: Class[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify(classes));
    } catch (error) {
      console.error("Error saving classes to local storage:", error);
      throw error;
    }
  }

  /**
   * Add a new class
   */
  static async addClass(name: string): Promise<Class> {
    const newClass: Class = {
      id: uuidv4(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };

    // Save to local storage
    const classes = await this.getLocalClasses();
    classes.push(newClass);
    await this.saveLocalClasses(classes);

    // Sync to cloud if configured
    if (await DynamicSupabaseClient.isConfigured()) {
      await this.syncClassToCloud(newClass);
    }

    return newClass;
  }

  /**
   * Update a class
   */
  static async updateClass(id: string, name: string): Promise<Class> {
    const classes = await this.getLocalClasses();
    const classIndex = classes.findIndex((c) => c.id === id);

    if (classIndex === -1) {
      throw new Error(`Class with id ${id} not found`);
    }

    const updatedClass: Class = {
      ...classes[classIndex],
      name: name.trim(),
    };

    classes[classIndex] = updatedClass;
    await this.saveLocalClasses(classes);

    // Sync to cloud if configured
    if (await DynamicSupabaseClient.isConfigured()) {
      await this.syncClassToCloud(updatedClass);
    }

    return updatedClass;
  }

  /**
   * Delete a class
   */
  static async deleteClass(id: string): Promise<void> {
    const classes = await this.getLocalClasses();
    const filteredClasses = classes.filter((c) => c.id !== id);
    await this.saveLocalClasses(filteredClasses);

    // Delete from cloud if configured
    if (await DynamicSupabaseClient.isConfigured()) {
      await this.deleteClassFromCloud(id);
    }
  }

  /**
   * Sync class to cloud (Supabase)
   */
  private static async syncClassToCloud(classData: Class): Promise<void> {
    try {
      if (!await DynamicSupabaseClient.isConfigured()) return;
      const client = await DynamicSupabaseClient.getClient();
      if (!client) return;

      const { error } = await client.from("classes").upsert([classData], {
        onConflict: "id",
      });

      if (error) {
        console.error("Error syncing class to cloud:", error);
      }
    } catch (error) {
      console.error("Error syncing class to cloud:", error);
    }
  }

  /**
   * Delete class from cloud (Supabase)
   */
  private static async deleteClassFromCloud(id: string): Promise<void> {
    try {
      if (!await DynamicSupabaseClient.isConfigured()) return;
      const client = await DynamicSupabaseClient.getClient();
      if (!client) return;

      const { error } = await client.from("classes").delete().eq("id", id);

      if (error) {
        console.error("Error deleting class from cloud:", error);
      }
    } catch (error) {
      console.error("Error deleting class from cloud:", error);
    }
  }

  /**
   * Fetch classes from cloud (Supabase)
   */
  static async fetchClassesFromCloud(): Promise<Class[]> {
    try {
      if (!await DynamicSupabaseClient.isConfigured()) {
        return [];
      }

      const client = await DynamicSupabaseClient.getClient();
      if (!client) return [];

      const { data, error } = await client.from("classes").select("*");

      if (error) {
        console.error("Error fetching classes from cloud:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching classes from cloud:", error);
      return [];
    }
  }

  /**
   * Get count of students in a class
   */
  static async getStudentCountInClass(classId: string): Promise<number> {
    try {
      const storage = await import("./storage-safe");
      const students = await storage.getStudents();
      return students.filter((s) => s.class === classId).length;
    } catch (error) {
      console.error("Error getting student count:", error);
      return 0;
    }
  }

  /**
   * Sync classes between local and cloud
   */
  static async syncClasses(): Promise<void> {
    try {
      if (!await DynamicSupabaseClient.isConfigured()) {
        return;
      }

      // Fetch from cloud
      const cloudClasses = await this.fetchClassesFromCloud();

      // Get local classes
      const localClasses = await this.getLocalClasses();

      // Merge: cloud takes precedence for existing classes
      const mergedClasses = [...localClasses];
      for (const cloudClass of cloudClasses) {
        const existingIndex = mergedClasses.findIndex((c) => c.id === cloudClass.id);
        if (existingIndex === -1) {
          mergedClasses.push(cloudClass);
        } else {
          mergedClasses[existingIndex] = cloudClass;
        }
      }

      // Save merged classes to local storage
      await this.saveLocalClasses(mergedClasses);
    } catch (error) {
      console.error("Error syncing classes:", error);
    }
  }
}
