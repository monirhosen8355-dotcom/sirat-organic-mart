const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

interface TransformOptions {
  width?: number
  height?: number
  quality?: 'auto' | number
  crop?: 'fill' | 'fit' | 'scale' | 'thumb'
}

/**
 * একটা Cloudinary secure URL থেকে একটা optimized/resized ভার্সনের URL বানায়।
 * মূল ইমেজ পাল্টায় না — শুধু নতুন transformation URL রিটার্ন করে।
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  { width, height, quality = 'auto', crop = 'fill' }: TransformOptions = {}
): string {
  if (!originalUrl.includes('/upload/')) {
    // Cloudinary URL না হলে (যেমন placeholder), যা আছে তাই রিটার্ন করে দিন
    return originalUrl
  }

  const transformations: string[] = [`q_${quality}`, 'f_auto']

  if (width) transformations.push(`w_${width}`)
  if (height) transformations.push(`h_${height}`)
  if (width || height) transformations.push(`c_${crop}`)

  const transformString = transformations.join(',')

  return originalUrl.replace('/upload/', `/upload/${transformString}/`)
}

/** প্রোডাক্ট কার্ড থাম্বনেইলের জন্য প্রি-সেট সাইজ */
export function getThumbnailUrl(originalUrl: string): string {
  return getOptimizedImageUrl(originalUrl, { width: 400, height: 400, crop: 'fill' })
}

/** প্রোডাক্ট ডিটেইল পেজের বড় গ্যালারি ছবির জন্য প্রি-সেট সাইজ */
export function getDetailImageUrl(originalUrl: string): string {
  return getOptimizedImageUrl(originalUrl, { width: 1000, quality: 'auto', crop: 'fit' })
}

export { CLOUD_NAME }