import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSmartBack } from '@/hooks/useSmartBack';
import { ArrowLeft, Search as SearchIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSearchUsers, useSearchTrips } from '@/hooks/useSearch';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';

const Search = () => {
  const navigate = useNavigate();
  const goBack = useSmartBack('/feed');
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'trips'>('users');
  
  const debouncedQuery = useDebounce(query, 300);
  
  const { data: users, isLoading: usersLoading } = useSearchUsers(debouncedQuery);
  const { data: trips, isLoading: tripsLoading } = useSearchTrips(debouncedQuery);

  return (
    <div className="flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={goBack}
            className="text-foreground"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search users, trips, locations..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-9 h-10 bg-secondary border-0 text-foreground"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'trips'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground'
            }`}
          >
            Trips
          </button>
        </div>
      </header>

      {/* Results */}
      <div className="p-4">
        {activeTab === 'users' ? (
          <div className="space-y-3">
            {usersLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))
            ) : users && users.length > 0 ? (
              users.map(user => (
                <button
                  key={user.id}
                  onClick={() => navigate(`/user/${user.id}`)}
                  className="w-full flex items-center gap-3 p-3 bg-card rounded-lg hover:bg-secondary transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url || undefined} alt={user.display_name || 'User'} />
                    <AvatarFallback>{user.display_name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{user.display_name || 'User'}</p>
                    <p className="text-sm text-muted-foreground">@{user.username || 'user'}</p>
                  </div>
                </button>
              ))
            ) : debouncedQuery ? (
              <p className="text-center text-muted-foreground py-8">
                No users found for "{debouncedQuery}"
              </p>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Search for users by name or username
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {tripsLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3 p-3">
                  <Skeleton className="w-20 h-20 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : trips && trips.length > 0 ? (
              trips.map(trip => (
                <button
                  key={trip.id}
                  onClick={() => navigate(`/comments/${trip.id}`)}
                  className="w-full flex gap-3 p-3 bg-card rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="w-20 h-20 bg-secondary rounded-lg flex-shrink-0 overflow-hidden">
                    {trip.image ? (
                      <img 
                        src={trip.image} 
                        alt={trip.title} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{trip.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {trip.start_location} → {trip.end_location}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      by {trip.profile?.display_name || 'Unknown'}
                    </p>
                  </div>
                </button>
              ))
            ) : debouncedQuery ? (
              <p className="text-center text-muted-foreground py-8">
                No trips found for "{debouncedQuery}"
              </p>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Search for trips by title or location
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
