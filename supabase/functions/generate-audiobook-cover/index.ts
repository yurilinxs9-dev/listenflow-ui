import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, author } = await req.json();
    
    // Search for the book cover using Google Custom Search API or similar
    const searchQuery = encodeURIComponent(`${title} ${author} book cover`);
    
    // Using DuckDuckGo image search (no API key needed)
    const searchUrl = `https://duckduckgo.com/?q=${searchQuery}&iax=images&ia=images`;
    
    // For now, we'll use a placeholder approach - searching via Google Images URL
    // In production, you'd want to use a proper image search API
    const imageSearchUrl = `https://www.google.com/search?q=${searchQuery}&tbm=isch`;
    
    // Since we can't directly scrape, we'll fetch book cover from Open Library API
    const openLibrarySearch = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=1`
    );
    
    if (openLibrarySearch.ok) {
      const data = await openLibrarySearch.json();
      
      if (data.docs && data.docs.length > 0) {
        const book = data.docs[0];
        const coverId = book.cover_i;
        
        if (coverId) {
          const coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
          
          return new Response(
            JSON.stringify({ imageUrl: coverUrl }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }
    
    // Fallback: Try Google Books API
    const googleBooksSearch = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}&maxResults=1`
    );
    
    if (googleBooksSearch.ok) {
      const data = await googleBooksSearch.json();
      
      if (data.items && data.items.length > 0) {
        const book = data.items[0];
        const thumbnail = book.volumeInfo?.imageLinks?.thumbnail || book.volumeInfo?.imageLinks?.smallThumbnail;
        
        if (thumbnail) {
          // Get higher resolution by modifying the URL
          const highResUrl = thumbnail.replace('zoom=1', 'zoom=2').replace('&edge=curl', '');
          
          return new Response(
            JSON.stringify({ imageUrl: highResUrl }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // If no cover found, return null
    return new Response(
      JSON.stringify({ imageUrl: null }),
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
