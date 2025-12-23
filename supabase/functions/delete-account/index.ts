import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create client with user's token to get user info
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error("Invalid user token");
    }

    const userId = user.id;

    // Create admin client for deletion operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Delete user data from all related tables in order
    // (respecting foreign key constraints)

    // 1. Delete convoy memberships
    await adminClient
      .from("convoy_members")
      .delete()
      .eq("user_id", userId);

    // 2. Delete notifications (both as user and actor)
    await adminClient
      .from("notifications")
      .delete()
      .or(`user_id.eq.${userId},actor_id.eq.${userId}`);

    // 3. Delete trip likes
    await adminClient
      .from("trip_likes")
      .delete()
      .eq("user_id", userId);

    // 4. Delete comments
    await adminClient
      .from("comments")
      .delete()
      .eq("user_id", userId);

    // 5. Delete trip photos for user's trips
    const { data: userTrips } = await adminClient
      .from("trips")
      .select("id")
      .eq("user_id", userId);

    if (userTrips && userTrips.length > 0) {
      const tripIds = userTrips.map((t) => t.id);
      await adminClient
        .from("trip_photos")
        .delete()
        .in("trip_id", tripIds);
    }

    // 6. Delete trips
    await adminClient
      .from("trips")
      .delete()
      .eq("user_id", userId);

    // 7. Delete vehicle images for user's vehicles
    const { data: userVehicles } = await adminClient
      .from("vehicles")
      .select("id")
      .eq("user_id", userId);

    if (userVehicles && userVehicles.length > 0) {
      const vehicleIds = userVehicles.map((v) => v.id);
      await adminClient
        .from("vehicle_images")
        .delete()
        .in("vehicle_id", vehicleIds);
    }

    // 8. Delete vehicles
    await adminClient
      .from("vehicles")
      .delete()
      .eq("user_id", userId);

    // 9. Delete follows (both directions)
    await adminClient
      .from("follows")
      .delete()
      .or(`follower_id.eq.${userId},following_id.eq.${userId}`);

    // 10. Delete follow requests (both directions)
    await adminClient
      .from("follow_requests")
      .delete()
      .or(`requester_id.eq.${userId},target_id.eq.${userId}`);

    // 11. Delete user roles
    await adminClient
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    // 12. Delete profile
    await adminClient
      .from("profiles")
      .delete()
      .eq("id", userId);

    // 13. Delete storage files (avatars)
    const { data: avatarFiles } = await adminClient.storage
      .from("avatars")
      .list(userId);

    if (avatarFiles && avatarFiles.length > 0) {
      const filePaths = avatarFiles.map((f) => `${userId}/${f.name}`);
      await adminClient.storage.from("avatars").remove(filePaths);
    }

    // 14. Delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      throw deleteError;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error deleting account:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
