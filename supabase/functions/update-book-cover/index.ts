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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { audiobookId, imageBase64 } = await req.json();

    if (!audiobookId || !imageBase64) {
      return new Response(
        JSON.stringify({ error: 'audiobookId e imageBase64 são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
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
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
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
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
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
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar audiobook', details: updateError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        coverUrl: publicUrlData.publicUrl 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
