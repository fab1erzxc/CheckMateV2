interface PhotoPreviewProps {
  imageBase64: string
  mimeType: string
  onRetake: () => void
}

function PhotoPreview({ imageBase64, mimeType, onRetake }: PhotoPreviewProps) {
  const dataUrl = `data:${mimeType};base64,${imageBase64}`

  return (
    <div>
      <img
        src={dataUrl}
        alt="Receipt preview"
        style={{
          width: '100%',
          borderRadius: '8px',
          maxHeight: '300px',
          objectFit: 'contain',
          backgroundColor: 'var(--bg-secondary)',
        }}
      />
      <button
        type="button"
        onClick={onRetake}
        style={{
          width: '100%',
          padding: '12px',
          marginTop: '8px',
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        Take another photo
      </button>
    </div>
  )
}

export default PhotoPreview
