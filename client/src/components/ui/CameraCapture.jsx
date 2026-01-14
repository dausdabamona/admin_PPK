import { useState, useRef, useEffect } from 'react'
import { Camera, X, FlipHorizontal, Check, Upload, Image as ImageIcon } from 'lucide-react'
import Button from './Button'
import Modal, { ModalFooter } from './Modal'
import {
  startCameraStream,
  stopCameraStream,
  capturePhoto,
  getAvailableCameras,
  selectPhotoFromGallery
} from '../../utils/camera'

/**
 * CameraCapture - React Component untuk Capture Foto dari Kamera HP
 *
 * Features:
 * - Open camera modal
 * - Capture photo with preview
 * - Switch front/back camera
 * - Select from gallery
 * - Image preview before upload
 *
 * Usage:
 * <CameraCapture
 *   onCapture={(file) => handleUpload(file)}
 *   maxFiles={5}
 *   buttonText="Ambil Foto"
 * />
 */
export default function CameraCapture({
  onCapture,
  onCancel,
  maxFiles = 1,
  buttonText = 'Ambil Foto Dokumen',
  buttonIcon = Camera,
  buttonVariant = 'primary',
  showGalleryOption = true,
  autoCompress = true,
  quality = 0.8,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [stream, setStream] = useState(null)
  const [capturedImages, setCapturedImages] = useState([])
  const [currentCamera, setCurrentCamera] = useState('environment')
  const [availableCameras, setAvailableCameras] = useState([])
  const [error, setError] = useState(null)

  const videoRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      loadCameras()
    }

    return () => {
      if (stream) {
        stopCameraStream(stream)
      }
    }
  }, [isOpen])

  async function loadCameras() {
    const cameras = await getAvailableCameras()
    setAvailableCameras(cameras)
  }

  async function startCamera() {
    try {
      setError(null)
      const result = await startCameraStream({
        facingMode: currentCamera
      })

      if (result.success) {
        setStream(result.stream)
        setIsCameraActive(true)

        if (videoRef.current) {
          videoRef.current.srcObject = result.stream
          videoRef.current.play()
        }
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Tidak dapat mengakses kamera: ' + err.message)
    }
  }

  function stopCamera() {
    if (stream) {
      stopCameraStream(stream)
      setStream(null)
      setIsCameraActive(false)
    }
  }

  async function handleCapture() {
    if (!videoRef.current || !isCameraActive) return

    const result = await capturePhoto(videoRef.current, {
      quality,
      maxWidth: 1920,
      maxHeight: 1080
    })

    if (result.success) {
      const file = new File([result.blob], `photo-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      })

      if (maxFiles === 1) {
        // Single capture mode
        setCapturedImages([{ file, dataUrl: result.dataUrl }])
        stopCamera()
      } else {
        // Multiple capture mode
        setCapturedImages(prev => {
          if (prev.length >= maxFiles) {
            return prev
          }
          return [...prev, { file, dataUrl: result.dataUrl }]
        })
      }
    }
  }

  async function handleGallerySelect() {
    const result = await selectPhotoFromGallery({
      multiple: maxFiles > 1,
      compress: autoCompress,
      quality
    })

    if (result.success) {
      if (maxFiles === 1) {
        setCapturedImages([{ file: result.file, dataUrl: result.dataUrl }])
      } else {
        setCapturedImages(result.files.map(f => ({
          file: f.file,
          dataUrl: f.dataUrl
        })))
      }
    }
  }

  function handleConfirm() {
    if (capturedImages.length > 0) {
      if (maxFiles === 1) {
        onCapture(capturedImages[0].file)
      } else {
        onCapture(capturedImages.map(img => img.file))
      }
      handleClose()
    }
  }

  function handleClose() {
    stopCamera()
    setIsOpen(false)
    setCapturedImages([])
    setError(null)
    if (onCancel) onCancel()
  }

  function removeImage(index) {
    setCapturedImages(prev => prev.filter((_, i) => i !== index))
  }

  function switchCamera() {
    stopCamera()
    setCurrentCamera(prev => prev === 'environment' ? 'user' : 'environment')
    // Will restart with new camera in useEffect
    setTimeout(() => startCamera(), 100)
  }

  const ButtonIcon = buttonIcon

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant={buttonVariant}
        onClick={() => setIsOpen(true)}
        icon={ButtonIcon}
        className={className}
      >
        {buttonText}
      </Button>

      {/* Camera Modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Ambil Foto Dokumen"
        size="xl"
      >
        <div className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Camera View / Preview */}
          {!isCameraActive && capturedImages.length === 0 && (
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Pilih sumber foto dokumen
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={startCamera} icon={Camera}>
                  Buka Kamera
                </Button>
                {showGalleryOption && (
                  <Button
                    variant="secondary"
                    onClick={handleGallerySelect}
                    icon={ImageIcon}
                  >
                    Pilih dari Galeri
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Active Camera View */}
          {isCameraActive && (
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto max-h-[60vh]"
              />

              {/* Camera Controls Overlay */}
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
                {/* Switch Camera */}
                {availableCameras.length > 1 && (
                  <button
                    onClick={switchCamera}
                    className="p-3 bg-white/90 rounded-full hover:bg-white transition-colors"
                    title="Ganti Kamera"
                  >
                    <FlipHorizontal className="w-6 h-6 text-gray-700" />
                  </button>
                )}

                {/* Capture Button */}
                <button
                  onClick={handleCapture}
                  disabled={capturedImages.length >= maxFiles}
                  className="p-4 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Ambil Foto"
                >
                  <Camera className="w-8 h-8 text-white" />
                </button>

                {/* Close Camera */}
                <button
                  onClick={stopCamera}
                  className="p-3 bg-white/90 rounded-full hover:bg-white transition-colors"
                  title="Tutup Kamera"
                >
                  <X className="w-6 h-6 text-gray-700" />
                </button>
              </div>

              {/* Counter (multiple mode) */}
              {maxFiles > 1 && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-black/70 text-white rounded-full text-sm">
                  {capturedImages.length} / {maxFiles}
                </div>
              )}
            </div>
          )}

          {/* Captured Images Preview */}
          {capturedImages.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  Foto yang Diambil ({capturedImages.length})
                </h4>
                {maxFiles > 1 && capturedImages.length < maxFiles && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => isCameraActive ? null : startCamera()}
                    icon={Camera}
                  >
                    Ambil Lagi
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {capturedImages.map((image, index) => (
                  <div
                    key={index}
                    className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
                  >
                    <img
                      src={image.dataUrl}
                      alt={`Captured ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Hapus"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                      Foto {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={handleClose}>
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={capturedImages.length === 0}
            icon={Check}
          >
            Gunakan Foto ({capturedImages.length})
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}

/**
 * CameraUploadButton - Simple button that opens camera and uploads immediately
 */
export function CameraUploadButton({
  onUpload,
  uploadEndpoint,
  uploadFieldName = 'file',
  onSuccess,
  onError,
  buttonText = 'Upload Foto',
  ...otherProps
}) {
  const [uploading, setUploading] = useState(false)

  async function handleCapture(file) {
    setUploading(true)

    try {
      // Upload file
      const formData = new FormData()
      formData.append(uploadFieldName, file)

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const result = await response.json()

      if (response.ok) {
        if (onSuccess) onSuccess(result)
        if (onUpload) onUpload(result)
      } else {
        throw new Error(result.message || 'Upload gagal')
      }
    } catch (error) {
      console.error('Upload error:', error)
      if (onError) onError(error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <CameraCapture
      onCapture={handleCapture}
      buttonText={uploading ? 'Uploading...' : buttonText}
      buttonIcon={uploading ? Upload : Camera}
      {...otherProps}
    />
  )
}
