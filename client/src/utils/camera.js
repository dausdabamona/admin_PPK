/**
 * Camera Utilities for Mobile Photo Capture
 *
 * Features:
 * - Camera access dengan permission handling
 * - Photo capture dengan preview
 * - Image compression untuk optimize upload
 * - Multiple capture mode (single/multiple)
 * - Front/back camera switch
 */

/**
 * Check if device has camera
 */
export async function hasCameraAccess() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return false
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.some(device => device.kind === 'videoinput')
  } catch (error) {
    console.error('Error checking camera access:', error)
    return false
  }
}

/**
 * Request camera permission
 */
export async function requestCameraPermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    })

    // Stop stream immediately (we just wanted permission)
    stream.getTracks().forEach(track => track.stop())

    return {
      granted: true,
      message: 'Akses kamera diberikan'
    }
  } catch (error) {
    console.error('Camera permission denied:', error)
    return {
      granted: false,
      error: error.name,
      message: error.name === 'NotAllowedError'
        ? 'Akses kamera ditolak. Mohon berikan izin di pengaturan browser.'
        : 'Tidak dapat mengakses kamera. Pastikan perangkat memiliki kamera.'
    }
  }
}

/**
 * Get available cameras
 */
export async function getAvailableCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const cameras = devices.filter(device => device.kind === 'videoinput')

    return cameras.map((camera, index) => ({
      id: camera.deviceId,
      label: camera.label || `Camera ${index + 1}`,
      facing: camera.label.toLowerCase().includes('back') ? 'environment' : 'user'
    }))
  } catch (error) {
    console.error('Error getting cameras:', error)
    return []
  }
}

/**
 * Start camera stream
 */
export async function startCameraStream(options = {}) {
  const {
    facingMode = 'environment', // 'user' for front camera, 'environment' for back
    width = 1920,
    height = 1080,
    deviceId = null
  } = options

  try {
    const constraints = {
      video: deviceId
        ? { deviceId: { exact: deviceId } }
        : {
            facingMode,
            width: { ideal: width },
            height: { ideal: height }
          },
      audio: false
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    return {
      success: true,
      stream
    }
  } catch (error) {
    console.error('Error starting camera:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Capture photo from video stream
 */
export function capturePhoto(videoElement, options = {}) {
  const {
    quality = 0.9,
    format = 'image/jpeg',
    maxWidth = 1920,
    maxHeight = 1080
  } = options

  try {
    // Create canvas
    const canvas = document.createElement('canvas')
    const video = videoElement

    // Calculate dimensions
    let width = video.videoWidth
    let height = video.videoHeight

    // Scale down if needed
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height)
      width = width * ratio
      height = height * ratio
    }

    canvas.width = width
    canvas.height = height

    // Draw video frame to canvas
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, width, height)

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          const dataUrl = canvas.toDataURL(format, quality)
          resolve({
            success: true,
            blob,
            dataUrl,
            width,
            height,
            size: blob.size
          })
        },
        format,
        quality
      )
    })
  } catch (error) {
    console.error('Error capturing photo:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Compress image
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'image/jpeg'
  } = options

  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        // Calculate dimensions
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = width * ratio
          height = height * ratio
        }

        // Create canvas
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        // Draw image
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            resolve({
              success: true,
              blob,
              dataUrl: canvas.toDataURL(format, quality),
              originalSize: file.size,
              compressedSize: blob.size,
              compressionRatio: ((1 - blob.size / file.size) * 100).toFixed(2)
            })
          },
          format,
          quality
        )
      }

      img.src = e.target.result
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Stop camera stream
 */
export function stopCameraStream(stream) {
  if (stream && stream.getTracks) {
    stream.getTracks().forEach(track => track.stop())
  }
}

/**
 * Take photo using mobile camera (simplified API)
 */
export async function takePhoto(options = {}) {
  const {
    facingMode = 'environment',
    quality = 0.9,
    compress = true
  } = options

  try {
    // Start camera
    const { success, stream, error } = await startCameraStream({ facingMode })
    if (!success) {
      return { success: false, error }
    }

    // Create video element
    const video = document.createElement('video')
    video.srcObject = stream
    video.setAttribute('playsinline', 'true') // Important for iOS
    video.play()

    // Wait for video to be ready
    await new Promise((resolve) => {
      video.onloadedmetadata = resolve
    })

    // Capture photo
    const result = await capturePhoto(video, { quality })

    // Stop camera
    stopCameraStream(stream)

    // Compress if needed
    if (compress && result.success) {
      const compressed = await compressImage(result.blob, { quality })
      return {
        ...result,
        blob: compressed.blob,
        dataUrl: compressed.dataUrl,
        originalSize: result.size,
        compressedSize: compressed.compressedSize,
        compressionRatio: compressed.compressionRatio
      }
    }

    return result
  } catch (error) {
    console.error('Error taking photo:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Select photo from gallery (file input)
 */
export function selectPhotoFromGallery(options = {}) {
  const {
    accept = 'image/*',
    multiple = false,
    compress = true,
    quality = 0.8
  } = options

  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = multiple

    input.onchange = async (e) => {
      const files = Array.from(e.target.files)

      if (files.length === 0) {
        resolve({ success: false, error: 'No file selected' })
        return
      }

      if (!multiple) {
        // Single file
        const file = files[0]
        if (compress) {
          const compressed = await compressImage(file, { quality })
          resolve({
            success: true,
            file: new File([compressed.blob], file.name, { type: compressed.blob.type }),
            dataUrl: compressed.dataUrl,
            originalSize: compressed.originalSize,
            compressedSize: compressed.compressedSize
          })
        } else {
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve({
              success: true,
              file,
              dataUrl: e.target.result
            })
          }
          reader.readAsDataURL(file)
        }
      } else {
        // Multiple files
        const processedFiles = await Promise.all(
          files.map(async (file) => {
            if (compress) {
              const compressed = await compressImage(file, { quality })
              return {
                file: new File([compressed.blob], file.name, { type: compressed.blob.type }),
                dataUrl: compressed.dataUrl,
                originalSize: compressed.originalSize,
                compressedSize: compressed.compressedSize
              }
            } else {
              return new Promise((resolveFile) => {
                const reader = new FileReader()
                reader.onload = (e) => {
                  resolveFile({
                    file,
                    dataUrl: e.target.result
                  })
                }
                reader.readAsDataURL(file)
              })
            }
          })
        )

        resolve({
          success: true,
          files: processedFiles
        })
      }
    }

    input.click()
  })
}
