import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function searchOpenLibrary(title: string, author: string) {
  try {
    console.log("Searching Open Library...");
    const response = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=5`
    );
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.docs && data.docs.length > 0) {
        for (const book of data.docs) {
          if (book.cover_i) {
            const coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
            console.log("Found cover in Open Library:", coverUrl);
            return coverUrl;
          }
        }
      }
    }
  } catch (error) {
    console.error("Open Library error:", error);
  }
  return null;
}

async function searchGoogleBooks(title: string, author: string) {
  try {
    console.log("Searching Google Books...");
    // Try with author
    let response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}&maxResults=5`
    );
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        for (const book of data.items) {
          const imageLinks = book.volumeInfo?.imageLinks;
          if (imageLinks) {
            const coverUrl = imageLinks.large || imageLinks.medium || imageLinks.thumbnail || imageLinks.smallThumbnail;
            if (coverUrl) {
              // Get highest quality
              const highResUrl = coverUrl.replace('zoom=1', 'zoom=3').replace('&edge=curl', '');
              console.log("Found cover in Google Books:", highResUrl);
              return highResUrl;
            }
          }
        }
      }
    }
    
    // Try without author if no results
    response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=5`
    );
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        for (const book of data.items) {
          const imageLinks = book.volumeInfo?.imageLinks;
          if (imageLinks) {
            const coverUrl = imageLinks.large || imageLinks.medium || imageLinks.thumbnail;
            if (coverUrl) {
              const highResUrl = coverUrl.replace('zoom=1', 'zoom=3').replace('&edge=curl', '');
              console.log("Found cover in Google Books (title only):", highResUrl);
              return highResUrl;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Google Books error:", error);
  }
  return null;
}

async function searchISBNdb(title: string, author: string) {
  try {
    console.log("Searching via ISBN alternative sources...");
    // Try ISBN search through Open Library's ISBN API
    const searchResponse = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(title + ' ' + author)}&limit=5`
    );
    
    if (searchResponse.ok) {
      const data = await searchResponse.json();
      
      if (data.docs && data.docs.length > 0) {
        for (const book of data.docs) {
          if (book.isbn && book.isbn.length > 0) {
            const isbn = book.isbn[0];
            const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
            console.log("Found cover via ISBN:", coverUrl);
            return coverUrl;
          }
        }
      }
    }
  } catch (error) {
    console.error("ISBN search error:", error);
  }
  return null;
}

async function generateCoverWithAI(title: string, author: string, genre: string) {
  try {
    console.log("Generating cover with AI as fallback...");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return null;
    }

    const prompt = `Create a professional audiobook cover for "${title}" by ${author}. Genre: ${genre}. The cover should be elegant, modern, and visually appealing with the book title prominently displayed. High quality, professional book cover design.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (imageUrl) {
        console.log("AI cover generated successfully");
        return imageUrl;
      }
    }
  } catch (error) {
    console.error("AI generation error:", error);
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, author, genre } = await req.json();
    
    console.log(`Searching cover for: "${title}" by ${author}`);
    
    // Try multiple sources in order
    let coverUrl = await searchGoogleBooks(title, author);
    
    if (!coverUrl) {
      coverUrl = await searchOpenLibrary(title, author);
    }
    
    if (!coverUrl) {
      coverUrl = await searchISBNdb(title, author);
    }
    
    // If no real cover found, generate with AI
    if (!coverUrl) {
      console.log("No real cover found, generating with AI...");
      coverUrl = await generateCoverWithAI(title, author, genre || "Ficção");
    }
    
    return new Response(
      JSON.stringify({ imageUrl: coverUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", imageUrl: null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
