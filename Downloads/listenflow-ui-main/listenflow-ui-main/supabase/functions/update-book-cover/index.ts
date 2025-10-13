import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSecureHeaders } from '../shared/cors.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  const secureHeaders = getSecureHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: secureHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        { headers: secureHeaders, status: 401 }
      );
    }
    
    // SEGURANÇA: Rate limiting para prevenir abuso
    const { data: rateLimitOk, error: rateLimitError } = await supabaseClient
      .rpc('check_rate_limit', {
        _user_id: null,
        _ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        _endpoint: 'update-book-cover',
        _max_requests: 20,
        _window_minutes: 5
      });

    if (rateLimitError || !rateLimitOk) {
      console.warn('[Update Cover] Rate limit exceeded');
      return new Response(
        JSON.stringify({ error: 'Muitas requisições. Aguarde alguns minutos.' }),
        { headers: secureHeaders, status: 429 }
      );
    }

    // Verify user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Sessão inválida' }),
        { headers: secureHeaders, status: 401 }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('[Update Cover] User is not admin:', user.id);
      await supabaseClient.from('upload_logs').insert({
        user_id: user.id,
        action: 'cover_update_denied',
        success: false,
        error_message: 'User is not admin',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown'
      });
      
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem atualizar capas.' }),
        { headers: secureHeaders, status: 403 }
      );
    }

    const { audiobookId, imageBase64 } = await req.json();

    if (!audiobookId || !imageBase64) {
      return new Response(
        JSON.stringify({ error: 'audiobookId e imageBase64 são obrigatórios' }),
        { headers: secureHeaders, status: 400 }
      );
    }

    // Buscar o audiobook
    const { data: audiobook, error: fetchError } = await supabaseClient
      .from('audiobooks')
      .select('user_id, title')
      .eq('id', audiobookId)
      .single();

    if (fetchError || !audiobook) {
      return new Response(
        JSON.stringify({ error: 'Audiobook não encontrado' }),
        { headers: secureHeaders, status: 404 }
      );
    }

    // Converter base64 para array buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload da imagem
    const fileName = `${Date.now()}_${audiobook.title.replace(/[^a-zA-Z0-9]/g, '_')}_cover.jpg`;
    const filePath = `${audiobook.user_id}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('audiobook-covers')
      .upload(filePath, buffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Erro ao fazer upload da imagem', details: uploadError }),
        { headers: secureHeaders, status: 500 }
      );
    }

    // Obter URL pública
    const { data: publicUrlData } = supabaseClient.storage
      .from('audiobook-covers')
      .getPublicUrl(filePath);

    // Atualizar o registro do audiobook
    const { error: updateError } = await supabaseClient
      .from('audiobooks')
      .update({ cover_url: publicUrlData.publicUrl })
      .eq('id', audiobookId);

    if (updateError) {
      console.error('Erro ao atualizar audiobook:', updateError);
      await supabaseClient.from('upload_logs').insert({
        user_id: user.id,
        action: 'cover_update_error',
        target_key: audiobookId,
        success: false,
        error_message: updateError.message,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown'
      });
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar audiobook', details: updateError }),
        { headers: secureHeaders, status: 500 }
      );
    }

    // Log successful cover update
    await supabaseClient.from('upload_logs').insert({
      user_id: user.id,
      action: 'cover_updated',
      target_key: audiobookId,
      success: true,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        coverUrl: publicUrlData.publicUrl 
      }),
      { headers: secureHeaders, status: 200 }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
