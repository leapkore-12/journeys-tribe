import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
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
    const body = await req.json().catch(() => ({}));
    const {
      page = 1,
      limit = 50,
      plan_type,
      search,
      created_after,
      created_before,
    } = body;

    // Validate pagination params
    const validatedPage = Math.max(1, parseInt(String(page)) || 1);
    const validatedLimit = Math.min(100, Math.max(1, parseInt(String(limit)) || 50));
    const offset = (validatedPage - 1) * validatedLimit;

    console.log(`Listing users - page: ${validatedPage}, limit: ${validatedLimit}, filters:`, {
      plan_type,
      search,
      created_after,
      created_before,
    });

    // Build the query
    let query = supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, plan_type, created_at, trips_count, vehicles_count", { count: "exact" });

    // Apply filters
    if (plan_type) {
      query = query.eq("plan_type", plan_type);
    }

    if (search) {
      query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);
    }

    if (created_after) {
      query = query.gte("created_at", created_after);
    }

    if (created_before) {
      query = query.lte("created_at", created_before);
    }

    // Apply pagination and ordering
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + validatedLimit - 1);

    const { data: profiles, error: profilesError, count } = await query;

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch users" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get auth users to match emails
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (authError) {
      console.error("Error fetching auth users:", authError);
    }

    // Create email lookup map
    const emailMap = new Map<string, string>();
    if (authData?.users) {
      for (const user of authData.users) {
        if (user.email) {
          emailMap.set(user.id, user.email);
        }
      }
    }

    // Combine profile data with emails
    const users = (profiles || []).map((profile) => ({
      id: profile.id,
      email: emailMap.get(profile.id) || null,
      username: profile.username,
      display_name: profile.display_name,
      plan_type: profile.plan_type,
      created_at: profile.created_at,
      trips_count: profile.trips_count || 0,
      vehicles_count: profile.vehicles_count || 0,
    }));

    // Get stats
    const { count: totalUsers } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true });

    const { count: paidUsers } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("plan_type", "paid");

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / validatedLimit);

    console.log(`Found ${totalCount} users matching filters`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          users,
          pagination: {
            page: validatedPage,
            limit: validatedLimit,
            total_count: totalCount,
            total_pages: totalPages,
          },
          stats: {
            total_users: totalUsers || 0,
            paid_users: paidUsers || 0,
            free_users: (totalUsers || 0) - (paidUsers || 0),
          },
        },
      }),
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
