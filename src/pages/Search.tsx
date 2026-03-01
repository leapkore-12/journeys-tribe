import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search as SearchIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSearchUsers } from '@/hooks/useSearch';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';

const Search = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  
  const handleBack = () => navigate('/feed');
  
  const debouncedQuery = useDebounce(query, 300);
  
  const { data: users, isLoading: usersLoading } = useSearchUsers(debouncedQuery);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={handleBack}
            className="text-foreground min-h-11 min-w-11 flex items-center justify-center active:opacity-70"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search users..."
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
      </header>

      {/* Results */}
      <div className="p-4">
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
      </div>
    </div>
  );
};

export default Search;
