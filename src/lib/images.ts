type CloudinaryImageOptions = {
  width?: number
  height?: number
}

export function optimizeCloudinaryImage(url?: string | null, options: CloudinaryImageOptions = {}) {
  if (!url) return url ?? undefined
  if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) return url

  const transforms = ['f_auto', 'q_auto', 'dpr_auto']

  if (options.width) transforms.push(`w_${options.width}`)
  if (options.height) transforms.push(`h_${options.height}`)

  const transformSegment = `${transforms.join(',')}/`
  return url.replace('/image/upload/', `/image/upload/${transformSegment}`)
}
