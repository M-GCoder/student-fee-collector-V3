import AsyncStorage from "@react-native-async-storage/async-storage";
import { Result } from "./types";
import { DynamicSupabaseClient } from "./supabase-dynamic-client";
import { v4 as uuidv4 } from "uuid";
import * as FileSystem from "expo-file-system/legacy";

const RESULTS_STORAGE_KEY = "results";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const STORAGE_BUCKET = "results";

/**
 * Result management service for file uploads and storage
 */
export class ResultService {
  /**
   * Get all results from local storage
   */
  static async getLocalResults(): Promise<Result[]> {
    try {
      const data = await AsyncStorage.getItem(RESULTS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading results from local storage:", error);
      return [];
    }
  }

  /**
   * Save results to local storage
   */
  static async saveLocalResults(results: Result[]): Promise<void> {
    try {
      await AsyncStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(results));
    } catch (error) {
      console.error("Error saving results to local storage:", error);
      throw error;
    }
  }

  /**
   * Get results for a specific class
   */
  static async getResultsByClass(classId: string): Promise<Result[]> {
    const results = await this.getLocalResults();
    return results.filter((r) => r.classId === classId);
  }

  /**
   * Validate file size
   */
  static validateFileSize(fileSize: number): boolean {
    return fileSize <= MAX_FILE_SIZE;
  }

  /**
   * Upload result file to Supabase Storage
   */
  static async uploadResult(
    classId: string,
    examName: string,
    fileUri: string,
    fileName: string,
    fileSize: number
  ): Promise<Result> {
    // Validate file size
    if (!this.validateFileSize(fileSize)) {
      throw new Error(`File size exceeds 5MB limit. Current size: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
    }

    const resultId = uuidv4();
    const storagePath = `${classId}/${resultId}_${fileName}`;

    try {
      // Read file as base64
      const base64Data = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Upload to Supabase Storage
      if (await DynamicSupabaseClient.isConfigured()) {
        const client = await DynamicSupabaseClient.getClient();
        if (client) {
          const { error } = await client.storage
            .from(STORAGE_BUCKET)
            .upload(storagePath, this.base64ToBlob(base64Data, this.getMimeType(fileName)), {
              cacheControl: "3600",
              upsert: false,
            });

          if (error) {
            throw new Error(`Upload failed: ${error.message}`);
          }

          // Get public URL
          const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
          const fileUrl = data?.publicUrl || "";

          // Create result record
          const result: Result = {
            id: resultId,
            classId,
            examName,
            fileName,
            fileUrl,
            fileSize,
            uploadedAt: new Date().toISOString(),
          };

          // Save to local storage
          const results = await this.getLocalResults();
          results.push(result);
          await this.saveLocalResults(results);

          // Sync to cloud
          await this.syncResultToCloud(result);

          return result;
        }
      }

      throw new Error("Supabase not configured");
    } catch (error) {
      console.error("Error uploading result:", error);
      throw error;
    }
  }

  /**
   * Convert base64 to Blob
   */
  private static base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * Get MIME type from file name
   */
  private static getMimeType(fileName: string): string {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };
    return mimeTypes[ext || ""] || "application/octet-stream";
  }

  /**
   * Delete result
   */
  static async deleteResult(resultId: string, classId: string, fileName: string): Promise<void> {
    try {
      // Delete from cloud storage if configured
      if (await DynamicSupabaseClient.isConfigured()) {
        const client = await DynamicSupabaseClient.getClient();
        if (client) {
          const storagePath = `${classId}/${resultId}_${fileName}`;
          await client.storage.from(STORAGE_BUCKET).remove([storagePath]);
        }
      }

      // Remove from local storage
      const results = await this.getLocalResults();
      const filteredResults = results.filter((r) => r.id !== resultId);
      await this.saveLocalResults(filteredResults);
    } catch (error) {
      console.error("Error deleting result:", error);
      throw error;
    }
  }

  /**
   * Sync result to cloud (Supabase)
   */
  private static async syncResultToCloud(result: Result): Promise<void> {
    try {
      if (!await DynamicSupabaseClient.isConfigured()) return;
      const client = await DynamicSupabaseClient.getClient();
      if (!client) return;

      const { error } = await client.from("results").upsert([result], {
        onConflict: "id",
      });

      if (error) {
        console.error("Error syncing result to cloud:", error);
      }
    } catch (error) {
      console.error("Error syncing result to cloud:", error);
    }
  }

  /**
   * Fetch results from cloud (Supabase)
   */
  static async fetchResultsFromCloud(): Promise<Result[]> {
    try {
      if (!await DynamicSupabaseClient.isConfigured()) {
        return [];
      }

      const client = await DynamicSupabaseClient.getClient();
      if (!client) return [];

      const { data, error } = await client.from("results").select("*");

      if (error) {
        console.error("Error fetching results from cloud:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching results from cloud:", error);
      return [];
    }
  }

  /**
   * Sync results between local and cloud
   */
  static async syncResults(): Promise<void> {
    try {
      if (!await DynamicSupabaseClient.isConfigured()) {
        return;
      }

      // Fetch from cloud
      const cloudResults = await this.fetchResultsFromCloud();

      // Get local results
      const localResults = await this.getLocalResults();

      // Merge: cloud takes precedence for existing results
      const mergedResults = [...localResults];
      for (const cloudResult of cloudResults) {
        const existingIndex = mergedResults.findIndex((r) => r.id === cloudResult.id);
        if (existingIndex === -1) {
          mergedResults.push(cloudResult);
        } else {
          mergedResults[existingIndex] = cloudResult;
        }
      }

      // Save merged results to local storage
      await this.saveLocalResults(mergedResults);
    } catch (error) {
      console.error("Error syncing results:", error);
    }
  }
}
