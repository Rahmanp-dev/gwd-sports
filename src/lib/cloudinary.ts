import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true,
});

export { cloudinary };

/**
 * Upload an image buffer to Cloudinary.
 * Returns the secure URL, public ID, and image dimensions.
 */
export async function uploadImage(
  buffer: Buffer,
  options: {
    folder: string;
    public_id?: string;
    transformation?: object[];
    maxBytes?: number;
  }
) {
  return new Promise<{ url: string; publicId: string; width: number; height: number }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `gwd/${options.folder}`,
        public_id: options.public_id,
        resource_type: 'image',
        transformation: options.transformation || [],
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      }
    );
    stream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary by its public ID.
 */
export async function deleteImage(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}
