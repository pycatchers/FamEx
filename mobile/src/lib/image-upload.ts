import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';

/**
 * Compress an image to reduce file size before upload.
 * Resizes to max 1200px width and compresses to JPEG quality 0.7.
 */
export async function compressImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

/**
 * Upload an image to Supabase Storage.
 * @param uri - Local file URI
 * @param bucket - Supabase Storage bucket name (e.g., 'medical', 'shopping', 'documents')
 * @param path - Storage path within the bucket (e.g., '{user_id}/prescriptions/{timestamp}.jpg')
 * @returns Public URL of the uploaded file
 */
export async function uploadImage(
  uri: string,
  bucket: string,
  path: string,
): Promise<string> {
  // Fetch the file as a blob
  const response = await fetch(uri);
  const blob = await response.blob();

  // Convert blob to ArrayBuffer for Supabase upload
  const arrayBuffer = await new Response(blob).arrayBuffer();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

/**
 * Compress and upload an image in one step.
 */
export async function compressAndUpload(
  uri: string,
  bucket: string,
  path: string,
): Promise<string> {
  const compressedUri = await compressImage(uri);
  return uploadImage(compressedUri, bucket, path);
}
