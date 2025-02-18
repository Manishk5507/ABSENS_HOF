"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, SearchIcon, X } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Loader } from "@/components/ui/loader"

// Define types
interface SearchResult {
  _id: string
  name: string
  age: number
  missingDate: string
  lastSeenLocation: string
  photos: string[]
}

interface MissingPerson {
  _id: string
  name: string
  age: number
  missingDate: string
  lastSeenLocation: string
  photos: string[]
}

interface SearchParams {
  name: string
  description: string
  location: string
}

export default function ReportPage() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchParams, setSearchParams] = useState<SearchParams>({
    name: "",
    description: "",
    location: "",
  })

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingFastAPI, setIsProcessingFastAPI] = useState(false)
  const router = useRouter()
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL

  // Fetch access token from localStorage
  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (token) {
      setAccessToken(token)
    }
  }, [])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSearchParams((prev) => ({ ...prev, [name]: value }))
  }

  // Handle multiple file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length) {
      setSelectedFiles((prevFiles) => [...prevFiles, ...files])
      setPreviewUrls((prevUrls) => [
        ...prevUrls,
        ...files.map((file) => URL.createObjectURL(file)),
      ])
    }
  }

  // Remove a selected image
  const removeImage = (index: number) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index))
    setPreviewUrls((prevUrls) => prevUrls.filter((_, i) => i !== index))
  }

  const callFastAPIBackend = async (person: MissingPerson): Promise<void> => {
    try {
      // Create a FormData instance.
      const formData: FormData = new FormData()
      formData.append("user_id", person._id)

      // Append each image URL to the formData using the same key "image_urls".
      person.photos.forEach((photoUrl: string) => {
        formData.append("image_urls", photoUrl)
      })

      const FIND_MISSING_API_URL = process.env.NEXT_PUBLIC_IMAGE_RECOGNITION_URL

      const response: Response = await fetch(
        `${FIND_MISSING_API_URL}/save-report-missing`,
        {
          method: "POST",
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error("Failed to send image URLs to API")
      }

      const responseData: any = await response.json()
      // console.log("API response:", responseData)
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error in callFastAPIBackend:", error.message)
      } else {
        console.error("Unknown error in callFastAPIBackend")
      }
    }
  }

  // Handle search request (POST request to create sighting report)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const formData = new FormData()

      // Append text fields if they have values
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) formData.append(key, value)
      })

      // Append multiple images
      selectedFiles.forEach((file) => {
        formData.append("photos", file)
      })

      const response = await fetch(`${API_URL}/sightings`, {
        method: "POST",
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
        },
        body: formData,
      })

      if (!response.ok) {
        const errorMessage = await response.text()
        throw new Error(errorMessage || "Failed to submit sighting report")
      }

      const data = await response.json()
      const person = data.data

      // Call the FastAPI backend after the first call succeeds
      setIsProcessingFastAPI(true)
      await callFastAPIBackend(person)
      setIsProcessingFastAPI(false)

      // Only route to next page when both API calls are done
      router.push("/my-reports")
    } catch (error) {
      console.error("Submission error:", error)
      alert("Error: " + error)
    } finally {
      setIsSubmitting(false)
      setIsProcessingFastAPI(false)
    }
  }

  return (
    <div className="container py-10 px-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-center">
          Report Missing Person
        </h1>
        <p className="text-muted-foreground mt-2 text-center">
          Provide details to report a missing person sighting.
        </p>

        {/* Input Fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Enter name (optional)"
              value={searchParams.name}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              placeholder="Enter sighting location"
              value={searchParams.location}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="Additional details"
              value={searchParams.description}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Upload Section */}
        <div className="mt-6">
          <label
            htmlFor="searchPhoto"
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
          >
            {previewUrls.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 p-2">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={url || "/placeholder.svg"}
                      alt={`Selected file ${index + 1}`}
                      className="h-32 w-32 object-cover rounded-lg"
                      height={128}
                      width={128}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="h-12 w-12 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and
                  drop
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported formats: JPG, PNG (MAX. 10MB)
                </p>
              </div>
            )}
            <input
              id="searchPhoto"
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* Loader for FastAPI processing */}
        {isProcessingFastAPI && (
          <div className="text-center mt-4">
            <Loader size="sm" />
            <span>Processing image recognition...</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            className="gap-2"
            onClick={handleSubmit}
            disabled={isSubmitting || isProcessingFastAPI}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <Loader size="sm" />
                <span>Submitting report...</span>
              </div>
            ) : (
              <>
                <SearchIcon className="h-4 w-4" />
                Submit
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
