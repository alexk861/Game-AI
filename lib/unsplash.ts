// lib/unsplash.ts

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

export interface UnsplashPhoto {
  id: string;
  created_at: string;
  width: number;
  height: number;
  color: string;
  description: string | null;
  alt_description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  links: {
    self: string;
    html: string;
    download: string;
    download_location: string;
  };
  user: {
    id: string;
    username: string;
    name: string;
    portfolio_url: string | null;
    links: {
      html: string;
    };
  };
}

export interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

export async function fetchUnsplashCandidates(query: string, count: number = 5): Promise<UnsplashPhoto[]> {
  if (!UNSPLASH_ACCESS_KEY) {
    throw new Error('UNSPLASH_ACCESS_KEY is not defined');
  }

  // Use a random page between 1 and 10 to get variety
  const randomPage = Math.floor(Math.random() * 10) + 1;
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&page=${randomPage}&orientation=landscape`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      'Accept-Version': 'v1'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Unsplash API error: ${response.status} - ${errorText}`);
  }

  const data: UnsplashSearchResponse = await response.json();
  return data.results;
}

/**
 * Trigger the Unsplash download endpoint.
 * This MUST be called when a photo is approved to be used in the app (e.g. moved to challenges table)
 * or when it is actually shown to the user in a production setting.
 * According to Unsplash guidelines, we must hit this endpoint to increment the photographer's download count.
 */
export async function triggerUnsplashDownload(downloadLocation: string): Promise<boolean> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.error('UNSPLASH_ACCESS_KEY is not defined');
    return false;
  }

  try {
    const response = await fetch(downloadLocation, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to trigger Unsplash download: ${response.status}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error triggering Unsplash download:', error);
    return false;
  }
}
