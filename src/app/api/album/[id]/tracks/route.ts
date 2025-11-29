// File: src/app/api/album/[id]/tracks/route.ts
//
// Proxy endpoint for Deezer album tracks
// This fixes CORS issues by proxying the request through our backend

import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const albumId = parseInt(id, 10);

  if (isNaN(albumId)) {
    return NextResponse.json(
      { error: "Invalid album ID" },
      { status: 400 }
    );
  }

  try {
    // Fetch both album info and tracks in parallel
    const [albumResponse, tracksResponse] = await Promise.all([
      fetch(`https://api.deezer.com/album/${albumId}`, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(10000),
      }),
      fetch(`https://api.deezer.com/album/${albumId}/tracks`, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(10000),
      }),
    ]);

    if (!tracksResponse.ok) {
      const errorText = await tracksResponse.text().catch(() => "Unknown error");
      console.error(`[Album Tracks API] Deezer API error: ${tracksResponse.status} ${tracksResponse.statusText}`, errorText);
      return NextResponse.json(
        { error: `Deezer API error: ${tracksResponse.status}`, details: errorText },
        { status: tracksResponse.status }
      );
    }

    const tracksData = await tracksResponse.json() as { data: unknown[]; total?: number };
    type AlbumData = { id?: number; title?: string; cover?: string; cover_small?: string; cover_medium?: string; cover_big?: string; cover_xl?: string; md5_image?: string; [key: string]: unknown };
    let albumData: AlbumData | null = null;

    // Try to get album info if available
    if (albumResponse.ok) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        albumData = await albumResponse.json() as AlbumData;
      } catch (err) {
        console.warn("[Album Tracks API] Failed to parse album info:", err);
      }
    }

    // Extract album info values for type safety
    const albumIdValue = albumData?.id;
    const albumTitleValue = albumData?.title;

    // Enrich tracks with album info if available
    const enrichedTracks = (tracksData.data || []).map((track: unknown) => {
      if (albumData && typeof track === "object" && track !== null && 
          typeof albumIdValue === "number" && typeof albumTitleValue === "string") {
        const trackObj = track as { album?: unknown; [key: string]: unknown };
        // Only add album info if it's missing
        if (!trackObj.album) {
          // Create a properly typed album object
          // All values are safely converted to strings with fallbacks
          /* eslint-disable @typescript-eslint/no-unsafe-assignment */
          const albumInfo = {
            id: albumIdValue,
            title: String(albumTitleValue),
            cover: String(albumData.cover ?? ""),
            cover_small: String(albumData.cover_small ?? ""),
            cover_medium: String(albumData.cover_medium ?? ""),
            cover_big: String(albumData.cover_big ?? ""),
            cover_xl: String(albumData.cover_xl ?? ""),
            md5_image: String(albumData.md5_image ?? ""),
            tracklist: `https://api.deezer.com/album/${albumId}/tracks`,
            type: "album" as const,
          };
          /* eslint-enable @typescript-eslint/no-unsafe-assignment */
          // Use spread operator to create a new object with album property
          return { ...trackObj, album: albumInfo };
        }
      }
      return track;
    });

    console.log(`[Album Tracks API] Successfully fetched ${enrichedTracks.length} tracks for album ${albumId}`);
    
    // Return the enriched data with proper CORS headers
    return NextResponse.json(
      { data: enrichedTracks, total: tracksData.total ?? enrichedTracks.length },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("[Album Tracks API] Error fetching album tracks:", error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isTimeout = error instanceof Error && (error.name === "AbortError" || error.message.includes("timeout"));
    
    return NextResponse.json(
      { 
        error: "Failed to fetch album tracks",
        message: errorMessage,
        type: isTimeout ? "timeout" : "fetch_error",
      },
      { status: 500 }
    );
  }
}

