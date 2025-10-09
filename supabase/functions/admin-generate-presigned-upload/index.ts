import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[Presigned Upload] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[Presigned Upload] Invalid token:', authError);
      return new Response(
        JSON.stringify({ error: 'Sessão inválida' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('[Presigned Upload] User is not admin:', user.id);
      await supabase.from('upload_logs').insert({
        user_id: user.id,
        action: 'presigned_upload_denied',
        success: false,
        error_message: 'User is not admin',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown'
      });
      
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem fazer upload.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit (10 requests per 5 minutes)
    const rateLimitOk = await supabase.rpc('check_rate_limit', {
      _user_id: user.id,
      _ip_address: req.headers.get('x-forwarded-for') || null,
      _endpoint: 'presigned_upload',
      _max_requests: 10,
      _window_minutes: 5
    });

    if (!rateLimitOk.data) {
      console.error('[Presigned Upload] Rate limit exceeded for user:', user.id);
      return new Response(
        JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const { filename, bucket, expectedSize } = await req.json();
    
    if (!filename || !bucket) {
      return new Response(
        JSON.stringify({ error: 'filename e bucket são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate bucket
    if (!['audiobooks', 'audiobook-covers'].includes(bucket)) {
      return new Response(
        JSON.stringify({ error: 'Bucket inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize filename
    const sanitizedFilename = filename
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');

    // Generate unique key
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = sanitizedFilename.split('.').pop();
    const nameWithoutExt = sanitizedFilename.replace(`.${extension}`, '');
    const storageKey = `${user.id}/${timestamp}_${nameWithoutExt}_${randomSuffix}.${extension}`;

    console.log(`[Presigned Upload] Generating presigned upload URL for: ${storageKey}`);

    // Generate presigned upload URL (expires in 30 minutes)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(storageKey);

    if (uploadError || !uploadData) {
      console.error('[Presigned Upload] Error generating presigned URL:', uploadError);
      await supabase.from('upload_logs').insert({
        user_id: user.id,
        action: 'presigned_upload_error',
        target_key: storageKey,
        success: false,
        error_message: uploadError?.message || 'Unknown error',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown'
      });
      
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar URL de upload' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store pending upload in database
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await supabase.from('pending_uploads').insert({
      user_id: user.id,
      storage_key: storageKey,
      filename: sanitizedFilename,
      expected_size: expectedSize || null,
      expires_at: expiresAt.toISOString()
    });

    // Log successful presigned URL generation
    await supabase.from('upload_logs').insert({
      user_id: user.id,
      action: 'presigned_upload_generated',
      target_key: storageKey,
      success: true,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown'
    });

    console.log(`[Presigned Upload] Successfully generated presigned URL for admin ${user.id}`);

    return new Response(
      JSON.stringify({
        uploadUrl: uploadData.signedUrl,
        storageKey: storageKey,
        token: uploadData.token,
        expiresIn: 1800 // 30 minutes in seconds
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Presigned Upload] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
