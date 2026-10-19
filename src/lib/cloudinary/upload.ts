const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

if (!CLOUD_NAME || !UPLOAD_PRESET) {
  throw new Error(
    'Cloudinary config মিসিং। .env ফাইলে VITE_CLOUDINARY_CLOUD_NAME এবং VITE_CLOUDINARY_UPLOAD_PRESET আছে কিনা চেক করুন।'
  )
}

const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

export interface CloudinaryUploadResult {
  secureUrl: string
  publicId: string
  width: number
  height: number
}

/**
 * একটা ইমেজ ফাইল Cloudinary-তে আপলোড করে এবং তার URL/মেটাডেটা রিটার্ন করে।
 * শুধু unsigned upload preset ব্যবহার করে — কোনো API secret দরকার হয় না।
 */
async function uploadSourceToCloudinary(
  source: File | string,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  const formData = new FormData()
  formData.append('file', source)
  formData.append('upload_preset', UPLOAD_PRESET)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', UPLOAD_URL)

    xhr.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100)
        onProgress(percent)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText)
        resolve({
          secureUrl: data.secure_url,
          publicId: data.public_id,
          width: data.width,
          height: data.height,
        })
      } else {
        reject(new Error(`Cloudinary আপলোড ব্যর্থ হয়েছে (status ${xhr.status})।`))
      }
    }

    xhr.onerror = () => {
      reject(new Error('Cloudinary আপলোডের সময় নেটওয়ার্ক এরর হয়েছে।'))
    }

    xhr.send(formData)
  })
}

export function uploadImageToCloudinary(
  file: File,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  return uploadSourceToCloudinary(file, onProgress)
}

export function uploadRemoteImageToCloudinary(url: string): Promise<CloudinaryUploadResult> {
  return uploadSourceToCloudinary(url)
}

/**
 * একাধিক ইমেজ একসাথে আপলোড করার জন্য — Admin প্রোডাক্ট ফর্মে একাধিক ছবি আপলোডে কাজে লাগবে।
 */
export async function uploadMultipleImages(
  files: File[],
  onEachProgress?: (index: number, percent: number) => void
): Promise<CloudinaryUploadResult[]> {
  return Promise.all(
    files.map((file, index) =>
      uploadImageToCloudinary(file, (percent) => onEachProgress?.(index, percent))
    )
  )
}