"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin, Calendar, User } from "lucide-react";
import Image from "next/image";
import { Loader } from "@/components/ui/loader";

interface MissingPerson {
  _id: string;
  name: string;
  age: number;
  gender: string;
  lastSeenLocation: string;
  missingDate: string;
  description: string;
  photos: string[];
}

export default function MissingPersonDetailPage() {
  const router = useRouter();
  const { id } = useParams(); // Get the missing person ID from the URL
  const [person, setPerson] = useState<MissingPerson | null>(null);
  const [loading, setLoading] = useState(true);
  // Updated state: matchingResult holds a single object (or null)
  const [matchingResult, setMatchingResult] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    if (id) {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        router.push("/login");
        return;
      }
      const fetchPerson = async () => {
        try {
          const response = await fetch(`${API_URL}/missing-persons/${id}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setPerson(data.data);
          } else {
            console.error("Failed to fetch missing person");
          }
        } catch (error) {
          console.error("Error fetching missing person:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchPerson();
    }
  }, [id, router, API_URL]);

  const handleSearchMatches = async (person: MissingPerson): Promise<void> => {
    setIsSearching(true);
    setMatchingResult(null); // Reset matching result
    try {
      const formData: FormData = new FormData();
      formData.append("user_id", person._id);
      person.photos.forEach((photoUrl: string) => {
        formData.append("image_urls", photoUrl);
      });

      const FIND_MISSING_API_URL = process.env.NEXT_PUBLIC_IMAGE_RECOGNITION_URL;
      const response: Response = await fetch(
        `${FIND_MISSING_API_URL}/search-find-missing`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send image URLs to API");
      }
      // console.log("here");
      const responseData: any = await response.json();
      // console.log("API response:", responseData);

      if(responseData.success===false){
        setMatchingResult(null);
        // alert("No matches found");
        return;
      }
      
      
      // Assuming responseData.match is an object and it has an "id" property
      const matchId = responseData.match[0].id;
      if (!matchId) {
        setMatchingResult(null);
        return;
      }

      // Fetch matching result using the received ID
      const matchingResponse = await fetch(`${API_URL}/sightings/${matchId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (!matchingResponse.ok) {
        throw new Error("Failed to fetch matching results");
      }

      const matchingData = await matchingResponse.json();
      // console.log("Matching data:", matchingData.data);
      setMatchingResult(matchingData.data || null);
      // console.log("Matching result:", matchingResult);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error in handleSearchMatches:", error.message);
      } else {
        console.error("Unknown error in handleSearchMatches");
      }
    } finally {
      setIsSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-10">
        <p>Loading...</p>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="container py-10">
        <p>No missing person data found.</p>
        <Button onClick={() => router.push("/my-missing")}>
          Back to My Missing Persons
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10 px-20">
      <Button onClick={() => router.push("/my-missing")} className="mb-6">
        Back to My Missing Persons
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-6 w-6 text-red-500" />
            {person.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                <User className="h-4 w-4" />
                Age: {person.age}, Gender: {person.gender}
              </p>
              <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Last seen: {person.lastSeenLocation}
              </p>
              <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Missing since:{" "}
                {new Date(person.missingDate).toLocaleDateString()}
              </p>
              <p className="text-sm mb-4">{person.description}</p>
            </div>
            <div>
              {person.photos && person.photos.length > 0 ? (
                <div className="grid gap-2 grid-cols-2">
                  {person.photos.map((photo: string, index: number) => (
                    <Image
                      key={index}
                      src={photo || "/placeholder.svg"}
                      alt={`Photo ${index + 1}`}
                      width={200}
                      height={200}
                      className="rounded-lg object-cover"
                      priority
                    />
                  ))}
                </div>
              ) : (
                <p>No photos available</p>
              )}
            </div>
          </div>
          {/* Search for Matches Button */}
          <div className="mt-6">
            <Button
              onClick={() => handleSearchMatches(person)}
              disabled={isSearching}
            >
              {isSearching ? (
                <>
                  <Loader size="sm" />
                  Searching...
                </>
              ) : (
                "Search for Matches"
              )}
            </Button>
          </div>
          {isSearching && (
            <div className="mt-4">
              <Loader size="lg" />
            </div>
          )}
          {!isSearching && (
            <div className="mt-6">
              {matchingResult ? (
                <MatchingResult result={matchingResult} />
              ) : (
                <p className="text-center text-gray-500">No matches found.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const MatchingResult = ({ result }: { result: any | null }) => {
  if (!result) {
    return <p className="text-center text-gray-500">No matches found.</p>;
  }

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold">Matching Result</h3>
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold">{result.name || "Unknown"}</h4>
          <p className="text-sm text-muted-foreground">
            Location: {result.location}
          </p>
          <p className="text-sm text-muted-foreground">
            Reported on: {new Date(result.createdAt).toLocaleDateString()}
          </p>
          <p className="mt-2">{result.description}</p>
          {result.photos && result.photos.length > 0 && (
            <div className="mt-2 flex space-x-2">
              {result.photos.map((photo: string, photoIndex: number) => (
                <Image
                  key={photoIndex}
                  src={photo || "/placeholder.svg"}
                  alt={`Reported photo ${photoIndex + 1}`}
                  width={100}
                  height={100}
                  className="rounded-md object-cover"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
