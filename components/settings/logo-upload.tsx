"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X } from 'lucide-react';
import Image from "next/image";
import { useRouter } from 'next/navigation';

interface LogoUploadProps {
  admin: any;
}

export default function LogoUpload({ admin }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(admin?.logo_url || "");
  const router = useRouter();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB");
      return;
    }

    try {
      setUploading(true);
      const supabase = createClient();

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${admin.id}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Create bucket if it doesn't exist
      const { data: buckets } = await supabase.storage.listBuckets();
      const logoBucket = buckets?.find((b) => b.name === "company-logos");

      if (!logoBucket) {
        await supabase.storage.createBucket("company-logos", {
          public: true,
        });
      }

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("company-logos").getPublicUrl(filePath);

      // Update admin profile
      const { error: updateError } = await supabase
        .from("admins")
        .update({ logo_url: publicUrl })
        .eq("id", admin.id);

      if (updateError) throw updateError;

      setLogoUrl(publicUrl);
      router.refresh();
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert("Failed to upload logo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      setUploading(true);
      const supabase = createClient();

      // Update admin profile to remove logo
      const { error } = await supabase
        .from("admins")
        .update({ logo_url: null })
        .eq("id", admin.id);

      if (error) throw error;

      setLogoUrl("");
      router.refresh();
    } catch (error) {
      console.error("Error removing logo:", error);
      alert("Failed to remove logo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border border-border rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Company Logo</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Upload your company logo to appear in emails and reports
      </p>

      <div className="flex items-start gap-6">
        {logoUrl ? (
          <div className="relative">
            <div className="w-32 h-32 border border-border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
              <Image
                src={logoUrl || "/placeholder.svg"}
                alt="Company Logo"
                width={128}
                height={128}
                className="object-contain"
              />
            </div>
            <button
              onClick={handleRemoveLogo}
              disabled={uploading}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted">
            <Upload className="w-8 h-8 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="logo-upload"
          />
          <label htmlFor="logo-upload">
            <Button asChild disabled={uploading}>
              <span className="cursor-pointer">
                {uploading ? "Uploading..." : logoUrl ? "Change Logo" : "Upload Logo"}
              </span>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground mt-2">
            PNG, JPG or GIF (max. 2MB)
          </p>
        </div>
      </div>
    </div>
  );
}
