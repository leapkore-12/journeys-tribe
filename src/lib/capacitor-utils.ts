import { Capacitor } from '@capacitor/core';

// Helper function to convert base64 to Blob
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

export async function pickPhoto(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
      });
      return image.webPath || null;
    } catch (error) {
      console.error('Camera error:', error);
      return null;
    }
  } else {
    // Web fallback - use file input
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          resolve(URL.createObjectURL(file));
        } else {
          resolve(null);
        }
      };
      input.click();
    });
  }
}

// Returns a File object suitable for upload to Supabase storage
export async function pickPhotoAsFile(): Promise<File | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt,
      });
      
      if (image.base64String) {
        const format = image.format || 'jpeg';
        const blob = base64ToBlob(image.base64String, `image/${format}`);
        return new File([blob], `photo_${Date.now()}.${format}`, { type: `image/${format}` });
      }
      return null;
    } catch (error) {
      console.error('Camera error:', error);
      return null;
    }
  } else {
    // Web fallback - use file input returning actual File
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0] || null;
        resolve(file);
      };
      input.click();
    });
  }
}

// Pick multiple photos - returns array of File objects
export async function pickMultiplePhotosAsFiles(): Promise<File[]> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Camera } = await import('@capacitor/camera');
      const result = await Camera.pickImages({
        quality: 80,
        limit: 20,
      });
      
      const files: File[] = [];
      for (const photo of result.photos) {
        if (photo.webPath) {
          const response = await fetch(photo.webPath);
          const blob = await response.blob();
          const format = photo.format || 'jpeg';
          files.push(new File([blob], `photo_${Date.now()}_${files.length}.${format}`, { type: `image/${format}` }));
        }
      }
      return files;
    } catch (error) {
      console.error('Camera error:', error);
      return [];
    }
  } else {
    // Web: Multi-file input for bulk selection
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        resolve(files);
      };
      input.click();
    });
  }
}
