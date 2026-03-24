import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

export interface DragDropFileUploadProps {
  onFileSelected: (file: File | null) => void;
  acceptedFormats?: string[];
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Drag-and-drop file upload component
 * Works on web and provides fallback for mobile
 */
export function DragDropFileUpload({
  onFileSelected,
  acceptedFormats = [".xlsx", ".xls", ".csv"],
  disabled = false,
  loading = false,
}: DragDropFileUploadProps) {
  const colors = useColors();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Handle drag over (web only)
  const handleDragOver = (e: any) => {
    if (Platform.OS === "web" && !disabled) {
      e.preventDefault?.();
      e.stopPropagation?.();
      setIsDragging(true);
    }
  };

  // Handle drag leave (web only)
  const handleDragLeave = (e: any) => {
    if (Platform.OS === "web") {
      e.preventDefault?.();
      e.stopPropagation?.();
      setIsDragging(false);
    }
  };

  // Handle drop (web only)
  const handleDrop = (e: any) => {
    if (Platform.OS === "web") {
      e.preventDefault?.();
      e.stopPropagation?.();
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

        // Validate file format
        if (acceptedFormats.includes(fileExtension)) {
          onFileSelected(file);
        } else {
          alert(`Invalid file format. Accepted formats: ${acceptedFormats.join(", ")}`);
          onFileSelected(null);
        }
      }
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: any) => {
    const files = e.target?.files;
    if (files && files.length > 0) {
      const file = files[0];
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

      // Validate file format
      if (acceptedFormats.includes(fileExtension)) {
        onFileSelected(file);
      } else {
        alert(`Invalid file format. Accepted formats: ${acceptedFormats.join(", ")}`);
        onFileSelected(null);
      }
    }
  };

  // Handle click to open file picker
  const handleClick = () => {
    if (!disabled && !loading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // On web, render drag-drop area with web-specific props
  if (Platform.OS === "web") {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          borderWidth: 2,
          borderStyle: isDragging ? "solid" : "dashed",
          borderColor: isDragging ? colors.primary : colors.border,
          borderRadius: 12,
          padding: 24,
          backgroundColor: isDragging ? `${colors.primary}10` : colors.surface,
          opacity: disabled || loading ? 0.6 : 1,
          cursor: disabled || loading ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
        } as React.CSSProperties}
      >
        <TouchableOpacity
          onPress={handleClick}
          disabled={disabled || loading}
          activeOpacity={0.7}
          style={{ alignItems: "center" }}
        >
          <MaterialIcons
            name="cloud-upload"
            size={48}
            color={isDragging ? colors.primary : colors.muted}
            style={{ marginBottom: 12 }}
          />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.foreground,
              marginBottom: 4,
              textAlign: "center",
            }}
          >
            {loading ? "Processing..." : "Drag and drop your file here"}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.muted,
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            or click to browse
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.muted,
              textAlign: "center",
            }}
          >
            Supported formats: {acceptedFormats.join(", ")}
          </Text>
        </TouchableOpacity>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(",")}
          onChange={handleFileInputChange}
          style={{ display: "none" }}
        />
      </div>
    );
  }

  // On mobile, render button-based upload
  return (
    <TouchableOpacity
      onPress={handleClick}
      disabled={disabled || loading}
      style={{
        backgroundColor: colors.primary,
        borderRadius: 8,
        paddingVertical: 16,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled || loading ? 0.6 : 1,
      }}
      activeOpacity={0.8}
    >
      <MaterialIcons name="cloud-upload" size={24} color="#ffffff" />
      <Text style={{ color: "#ffffff", fontWeight: "600", marginLeft: 12 }}>
        {loading ? "Processing..." : "Select File to Upload"}
      </Text>
    </TouchableOpacity>
  );
}
