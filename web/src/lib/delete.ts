import { env } from '../lib/env'

export async function deleteDocument(filename: string): Promise<void> {
  if (!filename) {
    throw new Error("Filename is required");
  }

  const response = await fetch(
    
    `${env.VITE_API_URL}/api/upload/documents/${encodeURIComponent(filename)}`,
    {
      method: "DELETE",
      credentials: 'include',

    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to delete document");
  }
}