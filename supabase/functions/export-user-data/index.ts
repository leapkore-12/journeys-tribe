import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate JWT using getClaims (works with signing-keys)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      throw new Error("Invalid user token");
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;

    // Create admin client for reading all data
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Starting data export for user: ${userId}`);

    // 1. Get profile data
    const { data: profile } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // 2. Get all trips
    const { data: trips } = await adminClient
      .from("trips")
      .select("*")
      .eq("user_id", userId);

    // 3. Get trip photos
    const tripIds = trips?.map((t) => t.id) || [];
    const { data: tripPhotos } = tripIds.length > 0
      ? await adminClient
          .from("trip_photos")
          .select("*")
          .in("trip_id", tripIds)
      : { data: [] };

    // 4. Get all vehicles
    const { data: vehicles } = await adminClient
      .from("vehicles")
      .select("*")
      .eq("user_id", userId);

    // 5. Get vehicle images
    const vehicleIds = vehicles?.map((v) => v.id) || [];
    const { data: vehicleImages } = vehicleIds.length > 0
      ? await adminClient
          .from("vehicle_images")
          .select("*")
          .in("vehicle_id", vehicleIds)
      : { data: [] };

    // 6. Get comments made by user
    const { data: comments } = await adminClient
      .from("comments")
      .select("*")
      .eq("user_id", userId);

    // 7. Get trip likes by user
    const { data: tripLikes } = await adminClient
      .from("trip_likes")
      .select("*")
      .eq("user_id", userId);

    // 8. Get following relationships
    const { data: following } = await adminClient
      .from("follows")
      .select("following_id, created_at")
      .eq("follower_id", userId);

    // 9. Get followers
    const { data: followers } = await adminClient
      .from("follows")
      .select("follower_id, created_at")
      .eq("following_id", userId);

    // 10. Get tribe members
    const { data: tribeMembers } = await adminClient
      .from("tribe_members")
      .select("member_id, created_at")
      .eq("user_id", userId);

    // 11. Get blocked users
    const { data: blockedUsers } = await adminClient
      .from("blocked_users")
      .select("blocked_id, created_at")
      .eq("blocker_id", userId);

    // 12. Get convoy memberships
    const { data: convoyMemberships } = await adminClient
      .from("convoy_members")
      .select("*")
      .eq("user_id", userId);

    // 13. Get notifications (received)
    const { data: notifications } = await adminClient
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100); // Limit to last 100 notifications

    // 14. Get active trips
    const { data: activeTrips } = await adminClient
      .from("active_trips")
      .select("*")
      .eq("user_id", userId);

    // Compile all data
    const exportData = {
      exportDate: new Date().toISOString(),
      userId: userId,
      email: userEmail,
      
      profile: profile ? {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        is_private: profile.is_private,
        plan_type: profile.plan_type,
        trips_count: profile.trips_count,
        followers_count: profile.followers_count,
        following_count: profile.following_count,
        vehicles_count: profile.vehicles_count,
        tribe_count: profile.tribe_count,
        total_distance_km: profile.total_distance_km,
        total_duration_minutes: profile.total_duration_minutes,
        analytics_consent: profile.analytics_consent,
        marketing_consent: profile.marketing_consent,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      } : null,

      trips: trips?.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        start_location_name: t.start_location_name,
        end_location_name: t.end_location_name,
        start_coords: t.start_coords,
        end_coords: t.end_coords,
        route_geometry: t.route_geometry,
        distance_km: t.distance_km,
        duration_minutes: t.duration_minutes,
        visibility: t.visibility,
        status: t.status,
        likes_count: t.likes_count,
        comments_count: t.comments_count,
        started_at: t.started_at,
        completed_at: t.completed_at,
        created_at: t.created_at,
      })) || [],

      tripPhotos: tripPhotos?.map((p) => ({
        id: p.id,
        trip_id: p.trip_id,
        photo_url: p.photo_url,
        caption: p.caption,
        created_at: p.created_at,
      })) || [],

      vehicles: vehicles?.map((v) => ({
        id: v.id,
        name: v.name,
        make: v.make,
        model: v.model,
        year: v.year,
        color: v.color,
        created_at: v.created_at,
      })) || [],

      vehicleImages: vehicleImages?.map((i) => ({
        id: i.id,
        vehicle_id: i.vehicle_id,
        image_url: i.image_url,
        is_primary: i.is_primary,
        created_at: i.created_at,
      })) || [],

      comments: comments?.map((c) => ({
        id: c.id,
        trip_id: c.trip_id,
        content: c.content,
        parent_id: c.parent_id,
        created_at: c.created_at,
      })) || [],

      tripLikes: tripLikes?.map((l) => ({
        trip_id: l.trip_id,
        created_at: l.created_at,
      })) || [],

      following: following?.map((f) => ({
        following_id: f.following_id,
        created_at: f.created_at,
      })) || [],

      followers: followers?.map((f) => ({
        follower_id: f.follower_id,
        created_at: f.created_at,
      })) || [],

      tribeMembers: tribeMembers?.map((t) => ({
        member_id: t.member_id,
        created_at: t.created_at,
      })) || [],

      blockedUsers: blockedUsers?.map((b) => ({
        blocked_id: b.blocked_id,
        created_at: b.created_at,
      })) || [],

      convoyMemberships: convoyMemberships?.map((c) => ({
        trip_id: c.trip_id,
        is_leader: c.is_leader,
        status: c.status,
        joined_at: c.joined_at,
      })) || [],

      recentNotifications: notifications?.map((n) => ({
        type: n.type,
        message: n.message,
        is_read: n.is_read,
        created_at: n.created_at,
      })) || [],

      activeTrips: activeTrips?.map((a) => ({
        id: a.id,
        trip_id: a.trip_id,
        status: a.status,
        started_at: a.started_at,
      })) || [],
    };

    console.log(`Data export completed for user: ${userId}`);

    return new Response(
      JSON.stringify(exportData, null, 2),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="roadtribe-data-export-${new Date().toISOString().split('T')[0]}.json"`,
          ...corsHeaders 
        },
      }
    );
  } catch (error: any) {
    console.error("Error exporting user data:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
