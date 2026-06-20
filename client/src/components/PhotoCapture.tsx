import { useRef, useState, useEffect } from 'react'

interface PhotoCaptureProps {
  onPhotoCapture: (base64: string, file: File) => void
}

function PhotoCapture({ onPhotoCapture }: PhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      // Cleanup camera stream on unmount
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  function startCamera() {
    setCameraError(null)
    setShowCamera(true)

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      })
      .catch((err: Error) => {
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow camera access.'
            : 'Could not access camera: ' + err.message
        )
        setShowCamera(false)
      })
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setShowCamera(false)
  }

  function capturePhoto() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' })
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1]
          onPhotoCapture(base64, file)
          stopCamera()
        }
        reader.readAsDataURL(blob)
      }
    }, 'image/jpeg', 0.8)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum size is 10MB.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1]
      onPhotoCapture(base64, file)
    }
    reader.readAsDataURL(file)

    // Reset input so same file can be selected again
    e.target.value = ''
  }

  return (
    <div>
      {showCamera ? (
        <div style={{ position: 'relative' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', borderRadius: '8px' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '8px',
            }}
          >
            <button
              type="button"
              onClick={capturePhoto}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: 'var(--accent)',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Capture
            </button>
            <button
              type="button"
              onClick={stopCamera}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
          {cameraError && (
            <p
              style={{
                color: 'var(--danger)',
                marginTop: '8px',
                fontSize: '14px',
              }}
            >
              {cameraError}
            </p>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={startCamera}
            style={{
              width: '100%',
              padding: '20px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '15px',
              color: 'var(--text-primary)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
            <div style={{ fontWeight: 600 }}>Take a photo</div>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              padding: '20px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '15px',
              color: 'var(--text-primary)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖼️</div>
            <div style={{ fontWeight: 600 }}>Choose from gallery</div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {cameraError && (
            <p
              style={{
                color: 'var(--danger)',
                fontSize: '14px',
                textAlign: 'center',
              }}
            >
              {cameraError}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default PhotoCapture
