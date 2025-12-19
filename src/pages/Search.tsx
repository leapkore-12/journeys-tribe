import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search as SearchIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockUsers, mockTripPosts } from '@/lib/mock-data';

const Search = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'trips'>('users');

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(query.toLowerCase()) ||
    user.username.toLowerCase().includes(query.toLowerCase())
  );

  const filteredTrips = mockTripPosts.filter(post =>
    post.title.toLowerCase().includes(query.toLowerCase()) ||
    post.startLocation.toLowerCase().includes(query.toLowerCase()) ||
    post.endLocation.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background safe-top">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => navigate(-1)}
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
              className="pl-9 pr-9 h-10 bg-secondary border-0"
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
            {filteredUsers.map(user => (
              <button
                key={user.id}
                onClick={() => navigate(`/user/${user.id}`)}
                className="w-full flex items-center gap-3 p-3 bg-card rounded-lg hover:bg-secondary transition-colors"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="font-semibold text-foreground">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.username}</p>
                </div>
              </button>
            ))}
            {filteredUsers.length === 0 && query && (
              <p className="text-center text-muted-foreground py-8">
                No users found for "{query}"
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTrips.map(trip => (
              <button
                key={trip.id}
                onClick={() => navigate(`/post/${trip.id}`)}
                className="w-full flex gap-3 p-3 bg-card rounded-lg hover:bg-secondary transition-colors"
              >
                <div className="w-20 h-20 bg-secondary rounded-lg flex-shrink-0 overflow-hidden">
                  {trip.photos[0] ? (
                    <img src={trip.photos[0]} alt={trip.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{trip.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {trip.startLocation} → {trip.endLocation}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    by {trip.user.name}
                  </p>
                </div>
              </button>
            ))}
            {filteredTrips.length === 0 && query && (
              <p className="text-center text-muted-foreground py-8">
                No trips found for "{query}"
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
