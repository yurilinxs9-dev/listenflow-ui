import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { getSecureHeaders } from '../shared/cors.ts'

serve(async (req) => {
  const origin = req.headers.get('origin');
  const secureHeaders = getSecureHeaders(origin);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: secureHeaders });
  }

  try {
    console.log('[check-admin-status] Starting admin verification');
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[check-admin-status] No authorization header');
      return new Response(
        JSON.stringify({ 
          isAdmin: false,
          error: 'Não autenticado' 
        }),
        {
          headers: secureHeaders,
          status: 401,
        }
      );
    }

    // CRÍTICO: Obter usuário do token JWT (server-side)
    // Isso não pode ser burlado pelo cliente
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('[check-admin-status] Authentication failed:', authError);
      return new Response(
        JSON.stringify({ 
          isAdmin: false,
          error: 'Não autenticado' 
        }),
        {
          headers: secureHeaders,
          status: 401,
        }
      );
    }

    console.log('[check-admin-status] User authenticated:', user.id);

    // RATE LIMITING: Prevenir tentativas de brute force de escalação de privilégios
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    const { data: rateLimitOk, error: rateLimitError } = await supabaseClient
      .rpc('check_rate_limit', {
        _user_id: user.id,
        _ip_address: ipAddress,
        _endpoint: 'check-admin-status',
        _max_requests: 30, // 30 requisições
        _window_minutes: 5  // em 5 minutos
      });

    if (rateLimitError || !rateLimitOk) {
      console.warn('[check-admin-status] Rate limit exceeded:', { user: user.id, ip: ipAddress });
      return new Response(
        JSON.stringify({ 
          isAdmin: false,
          error: 'Muitas tentativas. Tente novamente em alguns minutos.' 
        }),
        {
          headers: secureHeaders,
          status: 429,
        }
      );
    }

    // CRÍTICO: Verificar role de admin diretamente na tabela user_roles
    // usando Service Role Key que bypassa RLS
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    const hasAdminRole = !!roleData;

    if (roleError) {
      console.error('[check-admin-status] Error checking role:', roleError);
      return new Response(
        JSON.stringify({ 
          isAdmin: false,
          error: 'Erro ao verificar permissões' 
        }),
        {
          headers: secureHeaders,
          status: 500,
        }
      );
    }

    console.log('[check-admin-status] Admin check result:', hasAdminRole);

    // Log de auditoria para tentativas de acesso admin
    await supabaseClient.from('security_audit_logs').insert({
      user_id: user.id,
      action: 'admin_check',
      table_name: 'user_roles',
      suspicious: hasAdminRole !== true, // Marcar como suspeito se não é admin
      details: { 
        is_admin: hasAdminRole,
        timestamp: new Date().toISOString(),
        ip: ipAddress
      }
    });

    return new Response(
      JSON.stringify({ 
        isAdmin: hasAdminRole === true,
        userId: user.id 
      }),
      {
        headers: secureHeaders,
        status: 200,
      }
    );

  } catch (error) {
    console.error('[check-admin-status] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        isAdmin: false,
        error: 'Erro interno do servidor' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});