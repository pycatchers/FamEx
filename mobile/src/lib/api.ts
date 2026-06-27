import { File, UploadType } from 'expo-file-system';
import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
};

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}


export async function apiUploadFile<T>(
  endpoint: string,
  file: { uri: string; name: string; type: string },
  fields?: Record<string, string>,
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const srcFile = new File(file.uri);

  const result = await srcFile.upload(`${API_URL}${endpoint}`, {
    uploadType: UploadType.MULTIPART,
    fieldName: 'file',
    mimeType: file.type,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    parameters: fields, // additional form fields, sent alongside the file
  });

  if (result.status < 200 || result.status >= 300) {
    let detail = 'Upload failed';
    try {
      detail = JSON.parse(result.body)?.detail ?? detail;
    } catch {
      // body wasn't JSON
    }
    throw new Error(`${detail} (HTTP ${result.status})`);
  }

  return JSON.parse(result.body) as T;
}
