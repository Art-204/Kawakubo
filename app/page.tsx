// app/page.tsx
'use client'
import { useState, FormEvent, ChangeEvent } from 'react'
import { Upload, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react'
import { Design, DesignResponse, ApiError } from './lib/types'

export default function Home() {
  const [designDescription, setDesignDescription] = useState<string>('')
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [designs, setDesigns] = useState<Design[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size too large. Please upload an image under 10MB.')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setReferenceImage(reader.result as string)
        setError(null)
      }
      reader.onerror = () => {
        setError('Error reading file. Please try another image.')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setDesigns(null)

    try {
      const response = await fetch('/api/generate-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: designDescription,
          referenceImage: referenceImage,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json() as ApiError
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json() as DesignResponse

      if (!data.designs || data.designs.length === 0) {
        throw new Error('No designs were generated')
      }

      setDesigns(data.designs)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      console.error('Error generating design:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Kawakubo AI Designer</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Describe your desired clothing item
          </label>
          <textarea
            id="description"
            value={designDescription}
            onChange={(e) => setDesignDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg 
              bg-white text-gray-900 placeholder-gray-500
              shadow-sm
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
              min-h-[100px]"
            style={{
              WebkitTextFillColor: '#111827',
              opacity: '1'
            }}
            rows={4}
            placeholder="E.g., A minimalist white silk summer dress with a flowing A-line silhouette, thin straps, and a subtle ruffle detail at the hem..."
            required
            autoComplete="off"
            spellCheck="false"
          />
          <p className="mt-2 text-sm text-gray-500">
            Be specific about the style, fabric, color, and details you want in your design.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Reference Image (recommended)
          </label>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Tips for reference images:</h4>
            <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
              <li>Choose clear, well-lit photos</li>
              <li>Product photos work better than lifestyle shots</li>
              <li>Images should clearly show the style elements you want to incorporate</li>
              <li>Avoid busy backgrounds or multiple items in one image</li>
            </ul>
          </div>

          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
            <div className="space-y-1 text-center">
              {referenceImage ? (
                <ImageIcon className="mx-auto h-12 w-12 text-green-500" />
              ) : (
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
              )}
              <div className="flex text-sm text-gray-600 justify-center">
                <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                  <span>{referenceImage ? 'Change image' : 'Upload a file'}</span>
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
                {!referenceImage && <p className="pl-1">or drag and drop</p>}
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        </div>

        {referenceImage && (
          <div className="mt-4 p-4 bg-white rounded-lg shadow">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Reference Image</h4>
            <div className="relative">
              <img
                src={referenceImage}
                alt="Reference"
                className="w-full max-w-md mx-auto rounded-lg"
              />
              <button
                type="button"
                onClick={() => setReferenceImage(null)}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-lg hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium 
            text-white bg-blue-600 hover:bg-blue-700 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
            disabled:opacity-50 
            flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Generating your design...
            </>
          ) : (
            'Generate Design'
          )}
        </button>
      </form>

      {designs && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Your Generated Design</h2>
          <div className="max-w-3xl mx-auto">
            {designs.map((design, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gray-50 p-4 sm:p-6">
                  <img
                    src={design.url}
                    alt={`Generated clothing design`}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Design Details</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Based on your description: &quot;{designDescription}&quot;
                  </p>
                  {design.revised_prompt && (
                    <p className="mt-2 text-sm text-gray-500">
                      AI interpretation: {design.revised_prompt}
                    </p>
                  )}
                  <div className="mt-4 flex justify-end">
                    <a
                      href={design.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Full Size
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
      </div>
    </div>
  )
}