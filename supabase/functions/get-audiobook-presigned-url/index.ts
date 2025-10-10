import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[Presigned URL] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Login necessário para ouvir este audiobook.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[Presigned URL] Invalid token:', authError);
      return new Response(
        JSON.stringify({ error: 'Sessão inválida. Faça login novamente.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get audiobook ID from request
    const { audiobookId } = await req.json();
    if (!audiobookId) {
      return new Response(
        JSON.stringify({ error: 'ID do audiobook não fornecido.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Presigned URL] User ${user.id} requesting presigned URL for audiobook ${audiobookId}`);

    // Get audiobook from database
    const { data: audiobook, error: dbError } = await supabase
      .from('audiobooks')
      .select('id, audio_url, require_login, min_subscription_level, user_id')
      .eq('id', audiobookId)
      .single();

    if (dbError || !audiobook) {
      console.error('[Presigned URL] Audiobook not found:', dbError);
      return new Response(
        JSON.stringify({ error: 'Audiobook não encontrado.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if audiobook requires login
    if (audiobook.require_login) {
      console.log('[Presigned URL] Audiobook requires login - OK');
    }

    // TODO: Implement subscription level check if needed
    // if (audiobook.min_subscription_level === 'premium') {
    //   // Check if user has premium subscription
    // }

    // Extract bucket and path from audio_url
    // Assuming audio_url format: https://{project}.supabase.co/storage/v1/object/public/audiobooks/{file}
    const urlParts = audiobook.audio_url.split('/storage/v1/object/public/');
    if (urlParts.length !== 2) {
      console.error('[Presigned URL] Invalid audio_url format:', audiobook.audio_url);
      return new Response(
        JSON.stringify({ error: 'URL de áudio inválida.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const [bucketAndPath] = urlParts[1].split('/');
    const bucket = bucketAndPath;
    const path = urlParts[1].substring(bucket.length + 1);

    console.log(`[Presigned URL] Generating presigned URL for bucket: ${bucket}, path: ${path}`);

    // Generate presigned URL with 30 minutes expiration for better streaming
    // This reduces the need for frequent URL refreshes during playback
    const { data: signedUrl, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 1800); // 1800 seconds = 30 minutes

    if (signError || !signedUrl) {
      console.error('[Presigned URL] Error generating presigned URL:', signError);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar URL de acesso.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Presigned URL] Successfully generated presigned URL for user ${user.id}`);

    // Log access for analytics (optional)
    // You could insert into an access_logs table here

    return new Response(
      JSON.stringify({ 
        url: signedUrl.signedUrl, 
        expiresIn: 1800,
        // Metadata for optimization
        streaming: {
          preload: 'auto',
          bufferSize: 5 * 1024 * 1024, // 5MB
          cacheControl: 'public, max-age=1800'
        }
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          // Add cache control for CDN optimization
          'Cache-Control': 'private, max-age=300' // Cache response for 5 minutes
        } 
      }
    );

  } catch (error) {
    console.error('[Presigned URL] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});