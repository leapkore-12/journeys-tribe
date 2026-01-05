import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = Deno.env.get('EXTERNAL_API_KEY');

    if (!apiKey || apiKey !== expectedApiKey) {
      console.error('Invalid or missing API key');
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse request body
    const { user_id, email, plan_type, display_name, username } = await req.json();

    if (!user_id && !email) {
      return new Response(
        JSON.stringify({ error: 'Either user_id or email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate at least one update field is provided
    if (!plan_type && !display_name && !username) {
      return new Response(
        JSON.stringify({ error: 'At least one field to update is required (plan_type, display_name, or username)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let targetUserId = user_id;

    // If email provided, look up user_id
    if (!targetUserId && email) {
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        console.error('Failed to list users:', listError);
        return new Response(
          JSON.stringify({ error: 'Failed to look up user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const user = users.users.find(u => u.email === email);
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      targetUserId = user.id;
    }

    console.log('Updating user:', targetUserId);

    // Check if user exists
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (profileCheckError || !existingProfile) {
      console.error('User profile not found:', profileCheckError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If username is being updated, check for uniqueness
    if (username && username !== existingProfile.username) {
      const { data: existingUsername, error: usernameCheckError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', targetUserId)
        .maybeSingle();

      if (usernameCheckError) {
        console.error('Error checking username:', usernameCheckError);
        return new Response(
          JSON.stringify({ error: 'Failed to validate username' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (existingUsername) {
        return new Response(
          JSON.stringify({ error: 'Username already taken' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Build update object
    const updates: Record<string, string> = {};
    if (plan_type) updates.plan_type = plan_type;
    if (display_name) updates.display_name = display_name;
    if (username) updates.username = username;

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', targetUserId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update profile:', updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user email for response
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(targetUserId);

    console.log('User updated successfully:', targetUserId);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: updatedProfile.id,
          email: authUser?.user?.email || email,
          username: updatedProfile.username,
          display_name: updatedProfile.display_name,
          plan_type: updatedProfile.plan_type
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
