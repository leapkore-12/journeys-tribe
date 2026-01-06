import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    const apiKey = req.headers.get("x-api-key");
    const expectedApiKey = Deno.env.get("EXTERNAL_API_KEY");

    if (!apiKey || apiKey !== expectedApiKey) {
      console.error("Invalid or missing API key");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized: Invalid API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Parse request body
    const body = await req.json();
    const { user_id, email } = body;

    // Validate input - need either user_id or email
    if (!user_id && !email) {
      return new Response(
        JSON.stringify({ success: false, error: "Either user_id or email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let targetUserId = user_id;
    let userEmail = email;

    // If email provided, look up user_id from auth
    if (!targetUserId && userEmail) {
      console.log(`Looking up user by email: ${userEmail}`);
      
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1,
      });

      if (authError) {
        console.error("Error listing users:", authError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to look up user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find user by email in the list
      const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const foundUser = allUsers?.users?.find(u => u.email?.toLowerCase() === userEmail.toLowerCase());

      if (!foundUser) {
        return new Response(
          JSON.stringify({ success: false, error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      targetUserId = foundUser.id;
      userEmail = foundUser.email;
    }

    console.log(`Fetching details for user: ${targetUserId}`);

    // Fetch profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .single();

    if (profileError || !profile) {
      console.error("Profile not found:", profileError);
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get auth user email if not already fetched
    if (!userEmail) {
      const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
      if (!authUserError && authUser?.user) {
        userEmail = authUser.user.email;
      }
    }

    // Fetch recent trips (last 10)
    const { data: trips, error: tripsError } = await supabaseAdmin
      .from("trips")
      .select(`
        id,
        title,
        description,
        status,
        start_location,
        end_location,
        distance_km,
        duration_minutes,
        likes_count,
        comments_count,
        map_image_url,
        started_at,
        completed_at,
        created_at,
        visibility
      `)
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (tripsError) {
      console.error("Error fetching trips:", tripsError);
    }

    // Fetch all vehicles with their images
    const { data: vehicles, error: vehiclesError } = await supabaseAdmin
      .from("vehicles")
      .select(`
        id,
        name,
        make,
        model,
        year,
        color,
        license_plate,
        is_primary,
        created_at,
        vehicle_images (
          id,
          image_url,
          is_primary,
          display_order
        )
      `)
      .eq("user_id", targetUserId)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false });

    if (vehiclesError) {
      console.error("Error fetching vehicles:", vehiclesError);
    }

    // Format vehicles with images array
    const formattedVehicles = (vehicles || []).map(vehicle => ({
      id: vehicle.id,
      name: vehicle.name,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      license_plate: vehicle.license_plate,
      is_primary: vehicle.is_primary,
      created_at: vehicle.created_at,
      images: (vehicle.vehicle_images || [])
        .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
        .map((img: any) => ({
          id: img.id,
          url: img.image_url,
          is_primary: img.is_primary
        }))
    }));

    // Build response
    const response = {
      success: true,
      user: {
        id: profile.id,
        email: userEmail,
        username: profile.username,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        is_private: profile.is_private,
        plan_type: profile.plan_type,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        monthly_trip_count: profile.monthly_trip_count,
        monthly_trip_reset_at: profile.monthly_trip_reset_at,
        stats: {
          trips_count: profile.trips_count || 0,
          followers_count: profile.followers_count || 0,
          following_count: profile.following_count || 0,
          vehicles_count: profile.vehicles_count || 0,
          tribe_count: profile.tribe_count || 0,
          total_distance_km: profile.total_distance_km || 0,
          total_duration_minutes: profile.total_duration_minutes || 0
        },
        recent_trips: trips || [],
        vehicles: formattedVehicles
      }
    };

    console.log(`Successfully fetched details for user: ${targetUserId}`);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
