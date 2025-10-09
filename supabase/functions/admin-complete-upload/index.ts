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
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
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
      return new Response(
        JSON.stringify({ error: 'Acesso negado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const { storageKey, bucket } = await req.json();
    
    if (!storageKey || !bucket) {
      return new Response(
        JSON.stringify({ error: 'storageKey e bucket são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Complete Upload] Validating upload for: ${storageKey}`);

    // Validate that the file exists in storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from(bucket)
      .list(storageKey.split('/')[0], {
        search: storageKey.split('/').pop()
      });

    if (fileError || !fileData || fileData.length === 0) {
      console.error('[Complete Upload] File not found:', storageKey);
      return new Response(
        JSON.stringify({ error: 'Arquivo não encontrado no storage' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get file metadata via HEAD request
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(storageKey);

    // Mark upload as completed in pending_uploads
    const { error: updateError } = await supabase
      .from('pending_uploads')
      .update({ completed: true })
      .eq('storage_key', storageKey)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[Complete Upload] Error marking upload as complete:', updateError);
    }

    // Log successful upload completion
    await supabase.from('upload_logs').insert({
      user_id: user.id,
      action: 'upload_completed',
      target_key: storageKey,
      success: true,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown'
    });

    console.log(`[Complete Upload] Upload validated successfully: ${storageKey}`);

    return new Response(
      JSON.stringify({
        success: true,
        publicUrl: publicUrlData.publicUrl,
        storageKey: storageKey
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Complete Upload] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
