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
    const { user_id, email } = await req.json();

    if (!user_id && !email) {
      return new Response(
        JSON.stringify({ error: 'Either user_id or email is required' }),
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

    console.log('Starting cascading deletion for user:', targetUserId);

    // Cascading deletion - same order as delete-account function
    
    // 1. Delete convoy_members
    const { error: convoyError } = await supabaseAdmin
      .from('convoy_members')
      .delete()
      .eq('user_id', targetUserId);
    if (convoyError) console.error('Error deleting convoy_members:', convoyError);

    // 2. Delete notifications
    const { error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', targetUserId);
    if (notificationsError) console.error('Error deleting notifications:', notificationsError);

    // 3. Delete trip_likes
    const { error: likesError } = await supabaseAdmin
      .from('trip_likes')
      .delete()
      .eq('user_id', targetUserId);
    if (likesError) console.error('Error deleting trip_likes:', likesError);

    // 4. Delete comments
    const { error: commentsError } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('user_id', targetUserId);
    if (commentsError) console.error('Error deleting comments:', commentsError);

    // 5. Get user's trips for photo deletion
    const { data: userTrips } = await supabaseAdmin
      .from('trips')
      .select('id')
      .eq('user_id', targetUserId);

    // 6. Delete trip_photos for user's trips
    if (userTrips && userTrips.length > 0) {
      const tripIds = userTrips.map(t => t.id);
      const { error: photosError } = await supabaseAdmin
        .from('trip_photos')
        .delete()
        .in('trip_id', tripIds);
      if (photosError) console.error('Error deleting trip_photos:', photosError);
    }

    // 7. Delete trips
    const { error: tripsError } = await supabaseAdmin
      .from('trips')
      .delete()
      .eq('user_id', targetUserId);
    if (tripsError) console.error('Error deleting trips:', tripsError);

    // 8. Get user's vehicles for image deletion
    const { data: userVehicles } = await supabaseAdmin
      .from('vehicles')
      .select('id')
      .eq('user_id', targetUserId);

    // 9. Delete vehicle_images
    if (userVehicles && userVehicles.length > 0) {
      const vehicleIds = userVehicles.map(v => v.id);
      const { error: vehicleImagesError } = await supabaseAdmin
        .from('vehicle_images')
        .delete()
        .in('vehicle_id', vehicleIds);
      if (vehicleImagesError) console.error('Error deleting vehicle_images:', vehicleImagesError);
    }

    // 10. Delete vehicles
    const { error: vehiclesError } = await supabaseAdmin
      .from('vehicles')
      .delete()
      .eq('user_id', targetUserId);
    if (vehiclesError) console.error('Error deleting vehicles:', vehiclesError);

    // 11. Delete follows (both directions)
    const { error: followsError1 } = await supabaseAdmin
      .from('follows')
      .delete()
      .eq('follower_id', targetUserId);
    if (followsError1) console.error('Error deleting follows (follower):', followsError1);

    const { error: followsError2 } = await supabaseAdmin
      .from('follows')
      .delete()
      .eq('following_id', targetUserId);
    if (followsError2) console.error('Error deleting follows (following):', followsError2);

    // 12. Delete follow_requests (both directions)
    const { error: requestsError1 } = await supabaseAdmin
      .from('follow_requests')
      .delete()
      .eq('requester_id', targetUserId);
    if (requestsError1) console.error('Error deleting follow_requests (requester):', requestsError1);

    const { error: requestsError2 } = await supabaseAdmin
      .from('follow_requests')
      .delete()
      .eq('target_id', targetUserId);
    if (requestsError2) console.error('Error deleting follow_requests (target):', requestsError2);

    // 13. Delete blocked_users (both directions)
    const { error: blockedError1 } = await supabaseAdmin
      .from('blocked_users')
      .delete()
      .eq('blocker_id', targetUserId);
    if (blockedError1) console.error('Error deleting blocked_users (blocker):', blockedError1);

    const { error: blockedError2 } = await supabaseAdmin
      .from('blocked_users')
      .delete()
      .eq('blocked_id', targetUserId);
    if (blockedError2) console.error('Error deleting blocked_users (blocked):', blockedError2);

    // 14. Delete tribe_members
    const { error: tribeError1 } = await supabaseAdmin
      .from('tribe_members')
      .delete()
      .eq('user_id', targetUserId);
    if (tribeError1) console.error('Error deleting tribe_members (user):', tribeError1);

    const { error: tribeError2 } = await supabaseAdmin
      .from('tribe_members')
      .delete()
      .eq('member_id', targetUserId);
    if (tribeError2) console.error('Error deleting tribe_members (member):', tribeError2);

    // 15. Delete active_trips
    const { error: activeTripsError } = await supabaseAdmin
      .from('active_trips')
      .delete()
      .eq('user_id', targetUserId);
    if (activeTripsError) console.error('Error deleting active_trips:', activeTripsError);

    // 16. Delete road_hazards
    const { error: hazardsError } = await supabaseAdmin
      .from('road_hazards')
      .delete()
      .eq('reporter_id', targetUserId);
    if (hazardsError) console.error('Error deleting road_hazards:', hazardsError);

    // 17. Delete user_roles
    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', targetUserId);
    if (rolesError) console.error('Error deleting user_roles:', rolesError);

    // 18. Delete avatar from storage
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('avatar_url')
      .eq('id', targetUserId)
      .single();

    if (profile?.avatar_url) {
      const avatarPath = profile.avatar_url.split('/').pop();
      if (avatarPath) {
        const { error: storageError } = await supabaseAdmin.storage
          .from('avatars')
          .remove([avatarPath]);
        if (storageError) console.error('Error deleting avatar:', storageError);
      }
    }

    // 19. Delete profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', targetUserId);
    if (profileError) console.error('Error deleting profile:', profileError);

    // 20. Delete auth user
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (deleteUserError) {
      console.error('Failed to delete auth user:', deleteUserError);
      return new Response(
        JSON.stringify({ error: deleteUserError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User deleted successfully:', targetUserId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User deleted successfully',
        user_id: targetUserId
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
