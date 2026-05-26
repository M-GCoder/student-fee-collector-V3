import AsyncStorage from "@react-native-async-storage/async-storage";
import { Announcement } from "./types";
import { DynamicSupabaseClient } from "./supabase-dynamic-client";
import { v4 as uuidv4 } from "uuid";
import * as FileSystem from "expo-file-system/legacy";

const ANNOUNCEMENTS_STORAGE_KEY = "announcements";
const MAX_FILE_SIZE = 12 * 1024 * 1024; // 12MB
const STORAGE_BUCKET = "announcements";

/**
 * Announcement management service for CRUD and expiry handling
 */
export class AnnouncementService {
  /**
   * Get all announcements from local storage
   */
  static async getLocalAnnouncements(): Promise<Announcement[]> {
    try {
      const data = await AsyncStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading announcements from local storage:", error);
      return [];
    }
  }

  /**
   * Save announcements to local storage
   */
  static async saveLocalAnnouncements(announcements: Announcement[]): Promise<void> {
    try {
      await AsyncStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(announcements));
    } catch (error) {
      console.error("Error saving announcements to local storage:", error);
      throw error;
    }
  }

  /**
   * Get active announcements (not expired)
   */
  static async getActiveAnnouncements(): Promise<Announcement[]> {
    const announcements = await this.getLocalAnnouncements();
    const now = new Date();
    return announcements.filter((a) => new Date(a.expiryDate) > now);
  }

  /**
   * Get announcements for a specific class (including "all" announcements)
   */
  static async getAnnouncementsByClass(classId: string): Promise<Announcement[]> {
    const announcements = await this.getActiveAnnouncements();
    return announcements.filter((a) => a.classId === "all" || a.classId === classId);
  }

  /**
   * Validate file size
   */
  static validateFileSize(fileSize: number): boolean {
    return fileSize <= MAX_FILE_SIZE;
  }

  /**
   * Create a new announcement
   */
  static async createAnnouncement(
    title: string,
    description: string,
    classId: string,
    expiryDate: string,
    fileUri?: string,
    fileName?: string,
    fileSize?: number
  ): Promise<Announcement> {
    const announcementId = uuidv4();
    let fileUrl: string | undefined;

    // Upload file if provided
    if (fileUri && fileName && fileSize) {
      if (!this.validateFileSize(fileSize)) {
        throw new Error(`File size exceeds 12MB limit. Current size: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
      }

      try {
        // Read file as base64
        const base64Data = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Upload to Supabase Storage
        if (await DynamicSupabaseClient.isConfigured()) {
          const client = await DynamicSupabaseClient.getClient();
          if (client) {
            const storagePath = `${announcementId}/${fileName}`;
            const { error } = await client.storage
              .from(STORAGE_BUCKET)
              .upload(storagePath, this.base64ToBlob(base64Data, this.getMimeType(fileName)), {
                cacheControl: "3600",
                upsert: false,
              });

            if (error) {
              throw new Error(`File upload failed: ${error.message}`);
            }

            // Get public URL
            const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
            fileUrl = data?.publicUrl;
          }
        }
      } catch (error) {
        console.error("Error uploading announcement file:", error);
        throw error;
      }
    }

    // Create announcement record
    const announcement: Announcement = {
      id: announcementId,
      title: title.trim(),
      description: description.trim(),
      classId,
      fileUrl,
      fileName,
      fileSize,
      expiryDate,
      createdAt: new Date().toISOString(),
    };

    // Save to local storage
    const announcements = await this.getLocalAnnouncements();
    announcements.push(announcement);
    await this.saveLocalAnnouncements(announcements);

    // Sync to cloud if configured
    if (DynamicSupabaseClient.isConfigured()) {
      await this.syncAnnouncementToCloud(announcement);
    }

    return announcement;
  }

  /**
   * Update an announcement
   */
  static async updateAnnouncement(
    id: string,
    title: string,
    description: string,
    classId: string,
    expiryDate: string
  ): Promise<Announcement> {
    const announcements = await this.getLocalAnnouncements();
    const announcementIndex = announcements.findIndex((a) => a.id === id);

    if (announcementIndex === -1) {
      throw new Error(`Announcement with id ${id} not found`);
    }

    const updatedAnnouncement: Announcement = {
      ...announcements[announcementIndex],
      title: title.trim(),
      description: description.trim(),
      classId,
      expiryDate,
    };

    announcements[announcementIndex] = updatedAnnouncement;
    await this.saveLocalAnnouncements(announcements);

    // Sync to cloud if configured
    if (DynamicSupabaseClient.isConfigured()) {
      await this.syncAnnouncementToCloud(updatedAnnouncement);
    }

    return updatedAnnouncement;
  }

  /**
   * Delete an announcement
   */
  static async deleteAnnouncement(id: string, fileName?: string): Promise<void> {
    try {
      // Delete file from storage if it exists
      if (fileName && await DynamicSupabaseClient.isConfigured()) {
        const client = await DynamicSupabaseClient.getClient();
        if (client) {
          const storagePath = `${id}/${fileName}`;
          await client.storage.from(STORAGE_BUCKET).remove([storagePath]);
        }
      }

      // Remove from local storage
      const announcements = await this.getLocalAnnouncements();
      const filteredAnnouncements = announcements.filter((a) => a.id !== id);
      await this.saveLocalAnnouncements(filteredAnnouncements);

      // Delete from cloud if configured
      if (DynamicSupabaseClient.isConfigured()) {
        await this.deleteAnnouncementFromCloud(id);
      }
    } catch (error) {
      console.error("Error deleting announcement:", error);
      throw error;
    }
  }

  /**
   * Auto-delete expired announcements
   */
  static async deleteExpiredAnnouncements(): Promise<void> {
    try {
      const announcements = await this.getLocalAnnouncements();
      const now = new Date();
      const expiredAnnouncements = announcements.filter((a) => new Date(a.expiryDate) <= now);

      for (const announcement of expiredAnnouncements) {
        await this.deleteAnnouncement(announcement.id, announcement.fileName);
      }
    } catch (error) {
      console.error("Error deleting expired announcements:", error);
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
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    return mimeTypes[ext || ""] || "application/octet-stream";
  }

  /**
   * Sync announcement to cloud (Supabase)
   */
  private static async syncAnnouncementToCloud(announcement: Announcement): Promise<void> {
    try {
      if (!await DynamicSupabaseClient.isConfigured()) return;
      const client = await DynamicSupabaseClient.getClient();
      if (!client) return;

      const { error } = await client.from("announcements").upsert([announcement], {
        onConflict: "id",
      });

      if (error) {
        console.error("Error syncing announcement to cloud:", error);
      }
    } catch (error) {
      console.error("Error syncing announcement to cloud:", error);
    }
  }

  /**
   * Delete announcement from cloud (Supabase)
   */
  private static async deleteAnnouncementFromCloud(id: string): Promise<void> {
    try {
      if (!await DynamicSupabaseClient.isConfigured()) return;
      const client = await DynamicSupabaseClient.getClient();
      if (!client) return;

      const { error } = await client.from("announcements").delete().eq("id", id);

      if (error) {
        console.error("Error deleting announcement from cloud:", error);
      }
    } catch (error) {
      console.error("Error deleting announcement from cloud:", error);
    }
  }

  /**
   * Fetch announcements from cloud (Supabase)
   */
  static async fetchAnnouncementsFromCloud(): Promise<Announcement[]> {
    try {
      if (!await DynamicSupabaseClient.isConfigured()) {
        return [];
      }

      const client = await DynamicSupabaseClient.getClient();
      if (!client) return [];

      const { data, error } = await client.from("announcements").select("*");

      if (error) {
        console.error("Error fetching announcements from cloud:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching announcements from cloud:", error);
      return [];
    }
  }

  /**
   * Sync announcements between local and cloud
   */
  static async syncAnnouncements(): Promise<void> {
    try {
      if (!await DynamicSupabaseClient.isConfigured()) {
        return;
      }

      // Delete expired announcements first
      await this.deleteExpiredAnnouncements();

      // Fetch from cloud
      const cloudAnnouncements = await this.fetchAnnouncementsFromCloud();

      // Get local announcements
      const localAnnouncements = await this.getLocalAnnouncements();

      // Merge: cloud takes precedence for existing announcements
      const mergedAnnouncements = [...localAnnouncements];
      for (const cloudAnnouncement of cloudAnnouncements) {
        const existingIndex = mergedAnnouncements.findIndex((a) => a.id === cloudAnnouncement.id);
        if (existingIndex === -1) {
          mergedAnnouncements.push(cloudAnnouncement);
        } else {
          mergedAnnouncements[existingIndex] = cloudAnnouncement;
        }
      }

      // Save merged announcements to local storage
      await this.saveLocalAnnouncements(mergedAnnouncements);
    } catch (error) {
      console.error("Error syncing announcements:", error);
    }
  }
}
