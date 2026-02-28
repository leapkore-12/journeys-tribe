

## Save Trip Stops to Database

### 1. Create `trip_stops` table (migration)

```sql
CREATE TABLE public.trip_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  address text NOT NULL,
  latitude double precision,
  longitude double precision,
  stop_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.trip_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trip stops viewable by everyone" ON public.trip_stops FOR SELECT USING (true);
CREATE POLICY "Users can manage own trip stops" ON public.trip_stops FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_stops.trip_id AND trips.user_id = auth.uid()));
```

### 2. Insert stops on trip start (`src/pages/TripReview.tsx`)

After trip creation succeeds (line ~98), insert stops from `tripState.stops` into `trip_stops`:

```ts
if (tripState.stops.length > 0) {
  await supabase.from('trip_stops').insert(
    tripState.stops.map((stop, index) => ({
      trip_id: tripId,
      address: stop.address,
      latitude: stop.coordinates?.[1] ?? null,
      longitude: stop.coordinates?.[0] ?? null,
      stop_order: index,
    }))
  );
}
```

### 3. Fetch stops in trip detail (`src/hooks/useTrips.ts`)

In `useTripById`, join `trip_stops` ordered by `stop_order` and include them in the returned trip object.

### 4. Display stops in TripDetail (`src/pages/TripDetail.tsx`)

After the stats row (~line 305), render stops if present — similar cards with MapPin icon showing each stop address.

