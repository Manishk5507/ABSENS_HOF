"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/ui/loader";

type MissingPerson = {
  _id: string;
  name: string;
  age: number;
  lastSeenLocation: string;
  missingDate: string;
  description: string;
  photos: string[];
};

export default function FindPage() {
  const router = useRouter();
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingFastAPI, setIsProcessingFastAPI] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    lastSeenLocation: "",
    missingDate: "",
    description: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setSelectedFiles([...selectedFiles, ...newFiles]);
      const newUrls = newFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls([...previewUrls, ...newUrls]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const callFastAPIBackend = async (person: MissingPerson): Promise<void> => {
    try {
      const formData: FormData = new FormData();
      formData.append("user_id", person._id);

      person.photos.forEach((photoUrl: string) => {
        formData.append("image_urls", photoUrl);
      });

      const FIND_MISSING_API_URL = process.env.NEXT_PUBLIC_IMAGE_RECOGNITION_URL;

      const response: Response = await fetch(
        `${FIND_MISSING_API_URL}/save-find-missing`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send image URLs to API");
      }

      const responseData: any = await response.json();
      // console.log("FastAPI response:", responseData);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error in callFastAPIBackend:", error.message);
      } else {
        console.error("Unknown error in callFastAPIBackend");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      alert("You must be logged in to submit a report.");
      return;
    }

    setIsSubmitting(true);

    const reportData = new FormData();
    reportData.append("name", `${formData.firstName} ${formData.lastName}`);
    reportData.append("age", formData.age);
    reportData.append("gender", formData.gender);
    reportData.append("missingDate", formData.missingDate);
    reportData.append("lastSeenLocation", formData.lastSeenLocation);
    reportData.append("description", formData.description);
    const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

    selectedFiles.forEach((file) => {
      reportData.append("photos", file);
    });

    try {
      const response = await fetch(`${API_URL}/missing-persons/`, {
        method: "POST",
        body: reportData,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // console.log("Raw Response:", response);
      const data = await response.json();

      if (response.ok) {
        // Call FastAPI backend with returned data and wait for it to finish
        setIsProcessingFastAPI(true);
        await callFastAPIBackend(data.data);
        setIsProcessingFastAPI(false);
        router.push("/my-missing");
      } else {
        alert(data || "Failed to submit report.");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
      setIsProcessingFastAPI(false);
    }
  };

  return (
    <div className="container max-w-7xl px-4 sm:px-6 lg:px-40 py-10">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Find Missing Person
          </h1>
          <p className="text-muted-foreground mt-2">
            Please provide as much information as possible.
          </p>
        </div>

        {/* Personal Information */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Personal Information</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <Input
              id="firstName"
              placeholder="First Name"
              onChange={handleChange}
            />
            <Input
              id="lastName"
              placeholder="Last Name"
              onChange={handleChange}
            />
            <Input
              id="age"
              type="number"
              placeholder="Age"
              onChange={handleChange}
            />
            <Input
              id="gender"
              placeholder="Gender"
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Last Seen Information */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Last Seen Information</h2>
          <Input
            id="lastSeenLocation"
            placeholder="Last Known Location"
            onChange={handleChange}
          />
          <Input id="missingDate" type="date" onChange={handleChange} />
          <Textarea
            id="description"
            placeholder="Description..."
            rows={4}
            onChange={handleChange}
          />
        </div>

        {/* Photo Upload */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Photos</h2>
          <div className="flex flex-wrap gap-4">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative w-32 h-32">
                <Image
                  src={url || "/placeholder.svg"}
                  alt="Preview"
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg"
                />
                <button
                  type="button"
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  onClick={() => handleRemoveImage(index)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
          <label className="flex items-center gap-4 cursor-pointer border-2 border-dashed p-4 rounded-lg hover:bg-muted/50">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span>Click to upload photos</span>
            <input
              id="photo"
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
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
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || isProcessingFastAPI}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <Loader size="sm" />
              <span>Submitting...</span>
            </div>
          ) : (
            "Submit Report"
          )}
        </Button>
      </form>
    </div>
  );
}
