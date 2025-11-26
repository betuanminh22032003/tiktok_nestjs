import { storage } from '@/libs/AppWriteClient';

const useChangeUserImage = async (
  file: File,
  cropper: { left: number; top: number; width: number; height: number },
  currentImage: string,
) => {
  const videoId = Math.random().toString(36).slice(2, 22);

  const x = cropper.left;
  const y = cropper.top;
  const width = cropper.width;
  const height = cropper.height;

  try {
    // Create an image element to load the file
    const img = new Image();
    const imageUrl = URL.createObjectURL(file);

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    // Create canvas for cropping and resizing
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Draw the cropped and resized image
    ctx.drawImage(
      img,
      x,
      y,
      width,
      height, // Source rectangle
      0,
      0,
      200,
      200, // Destination rectangle
    );

    // Clean up object URL
    URL.revokeObjectURL(imageUrl);

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/jpeg',
        0.9,
      );
    });

    const finalFile = new File([blob], file.name, { type: 'image/jpeg' });
    const result = await storage.createFile(
      String(process.env.NEXT_PUBLIC_BUCKET_ID),
      videoId,
      finalFile,
    );

    // if current image is not default image delete
    if (currentImage != String(process.env.NEXT_PUBLIC_PLACEHOLDER_DEAFULT_IMAGE_ID)) {
      await storage.deleteFile(String(process.env.NEXT_PUBLIC_BUCKET_ID), currentImage);
    }

    return result?.$id;
  } catch (error) {
    throw error;
  }
};

export default useChangeUserImage;
