import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getSecureHeaders } from '../shared/cors.ts';

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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("❌ [AI] LOVABLE_API_KEY not configured");
      return null;
    }
    
    console.log("🎨 [AI] Starting AI generation with Lovable AI");
    console.log("🎨 [AI] Title:", title);
    console.log("🎨 [AI] Author:", author);
    console.log("🎨 [AI] Genre:", genre);

    const prompt = `Create a professional audiobook cover for "${title}" by ${author}. Genre: ${genre}. The cover should be elegant, modern, and visually appealing with the book title prominently displayed. High quality, professional book cover design.`;

    console.log("🎨 [AI] Sending request to Lovable AI...");
    
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

    console.log("🎨 [AI] Response status:", aiResponse.status);
    
    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("❌ [AI] API error:", aiResponse.status, errorText);
      return null;
    }

    const aiData = await aiResponse.json();
    console.log("🎨 [AI] Response data keys:", Object.keys(aiData));
    
    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (imageUrl) {
      console.log("✅ [AI] Cover generated successfully");
      console.log("🎨 [AI] Image URL length:", imageUrl.length);
      console.log("🎨 [AI] Image URL prefix:", imageUrl.substring(0, 50));
      return imageUrl;
    } else {
      console.error("❌ [AI] No image URL in response");
      console.error("❌ [AI] Response structure:", JSON.stringify(aiData, null, 2));
      return null;
    }
  } catch (error) {
    console.error("❌ [AI] Exception during generation:", error);
    return null;
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const secureHeaders = getSecureHeaders(origin);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: secureHeaders });
  }

  try {
    // SEGURANÇA: Rate limiting para prevenir abuso de recursos (chamadas IA custosas)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const tempClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: rateLimitOk, error: rateLimitError } = await tempClient
      .rpc('check_rate_limit', {
        _user_id: null,
        _ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        _endpoint: 'generate-audiobook-cover',
        _max_requests: 30, // 30 gerações por 5 minutos
        _window_minutes: 5
      });

    if (rateLimitError || !rateLimitOk) {
      console.warn('[Generate Cover] Rate limit exceeded');
      return new Response(
        JSON.stringify({ error: 'Muitas requisições. Aguarde alguns minutos.' }),
        { headers: secureHeaders, status: 429 }
      );
    }
    
    const { title, author, genre, audiobookId, userId } = await req.json();
    
    console.log('[Edge] Received request:', { title, author, genre, audiobookId, userId });
    
    console.log(`🔍 [Cover Search] Starting for: "${title}" by ${author} (${genre})`);
    
    // Try multiple sources in order
    console.log('📚 [Cover Search] Step 1: Trying Google Books...');
    let coverUrl = await searchGoogleBooks(title, author);
    
    if (!coverUrl) {
      console.log('📖 [Cover Search] Step 2: Trying Open Library...');
      coverUrl = await searchOpenLibrary(title, author);
    }
    
    if (!coverUrl) {
      console.log('🔢 [Cover Search] Step 3: Trying ISBN search...');
      coverUrl = await searchISBNdb(title, author);
    }
    
    // Download the image and convert to base64 to avoid CORS issues
    let imageBase64 = null;
    let isLowQuality = false;
    let thumbnailUrl = null; // Save thumbnail URL as fallback
    let thumbnailBase64 = null; // Save thumbnail base64 as fallback
    
    if (coverUrl) {
      try {
        console.log("⬇️ [Cover Download] Downloading cover image...");
        const imageResponse = await fetch(coverUrl);
        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer();
          const imageBytes = new Uint8Array(imageBuffer);
          
          console.log(`📦 [Cover Download] Image size: ${imageBytes.byteLength} bytes`);
          
          // Convert to base64 first (as fallback)
          let binary = '';
          for (let i = 0; i < imageBytes.byteLength; i++) {
            binary += String.fromCharCode(imageBytes[i]);
          }
          const base64Image = `data:image/jpeg;base64,${btoa(binary)}`;
          
          // Check if image is too small (likely a thumbnail)
          // Most book covers should be at least 50KB for decent quality
          if (imageBytes.byteLength < 50000) {
            console.log("⚠️ [Cover Download] Image too small (likely thumbnail), will try AI but keeping as fallback");
            isLowQuality = true;
            thumbnailUrl = coverUrl; // Save as fallback
            thumbnailBase64 = base64Image; // Save as fallback
            coverUrl = null; // Reset to trigger AI generation
          } else {
            // Good quality image
            imageBase64 = base64Image;
            console.log("✅ [Cover Download] Good quality cover converted to base64");
          }
        } else {
          console.error(`❌ [Cover Download] Failed to download image: ${imageResponse.status}`);
        }
      } catch (error) {
        console.error("❌ [Cover Download] Error downloading image:", error);
      }
    }
    
    // If cover was too small or not found, generate with AI
    if (!coverUrl || isLowQuality) {
      console.log("🎨 [Cover Generation] Generating high-quality cover with AI...");
      const aiCoverUrl = await generateCoverWithAI(title, author, genre || "Ficção");
      
      if (aiCoverUrl) {
        console.log("✅ [AI Generation] Successfully generated AI cover");
        coverUrl = aiCoverUrl;
        
        // Download the AI-generated image
        try {
          const aiImageResponse = await fetch(aiCoverUrl);
          if (aiImageResponse.ok) {
            const aiImageBuffer = await aiImageResponse.arrayBuffer();
            const aiImageBytes = new Uint8Array(aiImageBuffer);
            
            console.log(`📦 [AI Download] AI image size: ${aiImageBytes.byteLength} bytes`);
            
            // Convert to base64
            let binary = '';
            for (let i = 0; i < aiImageBytes.byteLength; i++) {
              binary += String.fromCharCode(aiImageBytes[i]);
            }
            imageBase64 = `data:image/jpeg;base64,${btoa(binary)}`;
            console.log("✅ [AI Download] AI cover converted to base64");
          }
        } catch (error) {
          console.error("❌ [AI Download] Error downloading AI image:", error);
        }
      } else {
        console.warn("⚠️ [AI Generation] AI generation failed, falling back to thumbnail");
        // Use thumbnail as fallback
        if (thumbnailBase64) {
          imageBase64 = thumbnailBase64;
          coverUrl = thumbnailUrl;
          console.log("✅ [Fallback] Using thumbnail as fallback");
        }
      }
    }
    
    // Upload to Supabase Storage from the edge function
    if (!imageBase64 && !coverUrl) {
      throw new Error('No cover image found or generated');
    }
    
    console.log('[Edge] Uploading to Supabase Storage...');
    
    // Initialize Supabase client with service role for privileged access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Convert base64 to Blob
    const base64Data = (imageBase64 || coverUrl).split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid image data');
    }
    
    // Decode base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create the storage path
    const coverPath = `${userId}/${Date.now()}_${title.replace(/[^a-zA-Z0-9]/g, '_')}_cover.png`;
    console.log('[Edge] Upload path:', coverPath);
    console.log('[Edge] Blob size:', bytes.length, 'bytes');
    
    // Upload to storage
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('audiobook-covers')
      .upload(coverPath, bytes, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      console.error('[Edge] Upload error:', uploadError);
      throw uploadError;
    }
    
    console.log('[Edge] Upload successful:', uploadData);
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('audiobook-covers')
      .getPublicUrl(coverPath);
    
    console.log('[Edge] Public URL:', publicUrl);
    
    // Update audiobook record if audiobookId is provided
    if (audiobookId) {
      console.log('[Edge] Updating audiobook record...');
      const { error: updateError } = await supabase
        .from('audiobooks')
        .update({ cover_url: publicUrl })
        .eq('id', audiobookId);
      
      if (updateError) {
        console.error('[Edge] Database update error:', updateError);
        // Don't throw - return the URL anyway
      } else {
        console.log('[Edge] Database updated successfully');
      }
    }
    
    console.log('[Edge] ✅ Cover generation complete');
    
    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl: publicUrl,
        message: 'Cover uploaded successfully'
      }),
      { headers: secureHeaders }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", imageUrl: null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
