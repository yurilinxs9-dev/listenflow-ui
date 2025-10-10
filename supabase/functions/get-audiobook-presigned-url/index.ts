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

    // Verify user from JWT (SERVER-SIDE - não pode ser burlado)
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[Presigned URL] Invalid token:', authError);
      return new Response(
        JSON.stringify({ error: 'Sessão inválida. Faça login novamente.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // RATE LIMITING: Prevenir brute force e abuso
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    const { data: rateLimitOk, error: rateLimitError } = await supabase
      .rpc('check_rate_limit', {
        _user_id: user.id,
        _ip_address: ipAddress,
        _endpoint: 'get-audiobook-presigned-url',
        _max_requests: 60, // 60 requisições
        _window_minutes: 5  // em 5 minutos
      });

    if (rateLimitError || !rateLimitOk) {
      console.warn('[Presigned URL] Rate limit exceeded:', { user: user.id, ip: ipAddress });
      return new Response(
        JSON.stringify({ error: 'Muitas requisições. Tente novamente em alguns minutos.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Get audiobook from database - SEM FILTROS MANIPULÁVEIS NA URL
    // A verificação de acesso é feita no servidor
    const { data: audiobook, error: dbError } = await supabase
      .from('audiobooks')
      .select('id, audio_url, require_login, min_subscription_level, user_id, is_global')
      .eq('id', audiobookId)
      .single();

    if (dbError || !audiobook) {
      console.error('[Presigned URL] Audiobook not found:', dbError);
      return new Response(
        JSON.stringify({ error: 'Audiobook não encontrado.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SEGURANÇA CRÍTICA: Verificar status do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('[Presigned URL] Failed to fetch user profile:', profileError);
      
      await supabase.from('security_audit_logs').insert({
        user_id: user.id,
        action: 'ACCESS_DENIED',
        table_name: 'audiobooks',
        suspicious: true,
        details: { 
          reason: 'profile_not_found',
          audiobook_id: audiobookId,
          ip: ipAddress
        }
      });
      
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Perfil não encontrado.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Bloquear usuários não aprovados
    if (profile.status !== 'approved') {
      console.warn('[Presigned URL] Unapproved user access attempt:', { 
        user: user.id, 
        status: profile.status,
        audiobook: audiobookId
      });
      
      await supabase.from('security_audit_logs').insert({
        user_id: user.id,
        action: 'ACCESS_DENIED',
        table_name: 'audiobooks',
        suspicious: true,
        details: { 
          reason: 'user_not_approved',
          user_status: profile.status,
          audiobook_id: audiobookId,
          ip: ipAddress
        }
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Sua conta ainda não foi aprovada. Aguarde aprovação do administrador.' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Presigned URL] User approved, checking audiobook access');

    // SEGURANÇA: Verificar se usuário tem acesso ao audiobook
    // Permitir acesso se:
    // 1. O audiobook é global (is_global = true) 
    // 2. O usuário é o dono (user_id = audiobook.user_id)
    const hasAccess = audiobook.is_global || audiobook.user_id === user.id;
    
    if (!hasAccess) {
      console.warn('[Presigned URL] Unauthorized access attempt:', { 
        user: user.id, 
        audiobook: audiobookId,
        owner: audiobook.user_id,
        is_global: audiobook.is_global
      });
      
      // Log de auditoria para tentativa de acesso não autorizado
      await supabase.from('security_audit_logs').insert({
        user_id: user.id,
        action: 'unauthorized_audiobook_access',
        table_name: 'audiobooks',
        record_id: audiobookId,
        suspicious: true,
        details: { 
          audiobook_id: audiobookId,
          owner_id: audiobook.user_id,
          is_global: audiobook.is_global,
          ip: ipAddress
        }
      });
      
      return new Response(
        JSON.stringify({ error: 'Este audiobook é privado. Apenas o proprietário pode acessá-lo.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[Presigned URL] Access granted - Global: ${audiobook.is_global}, Owner: ${audiobook.user_id === user.id}`);

    // Check if audiobook requires login
    if (audiobook.require_login) {
      console.log('[Presigned URL] Audiobook requires login - OK');
    }

    // Extract bucket and path from audio_url
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

    // Generate presigned URL with 30 minutes expiration
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

    // Log acesso para analytics
    await supabase.from('security_audit_logs').insert({
      user_id: user.id,
      action: 'audiobook_access',
      table_name: 'audiobooks',
      record_id: audiobookId,
      details: { 
        audiobook_id: audiobookId,
        ip: ipAddress,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({ 
        url: signedUrl.signedUrl, 
        expiresIn: 1800,
        streaming: {
          preload: 'auto',
          bufferSize: 5 * 1024 * 1024,
          cacheControl: 'public, max-age=1800'
        }
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=300'
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