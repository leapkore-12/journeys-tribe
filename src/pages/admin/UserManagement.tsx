import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllUsers } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Home,
  Search, 
  UserPlus, 
  Crown, 
  Shield, 
  ChevronRight,
  Loader2 
} from 'lucide-react';
import AdminBottomNav from '@/components/admin/AdminBottomNav';

const UserManagement = () => {
  const navigate = useNavigate();
  const { data: users, isLoading } = useAllUsers();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users?.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.username?.toLowerCase().includes(query) ||
      user.display_name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
              <Home className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">User Management</h1>
          </div>
          <Button size="sm" onClick={() => navigate('/admin/users/new')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
      <main className="p-4 pb-20 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* User List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2">
            {filteredUsers?.map((user) => (
              <Card 
                key={user.id} 
                className="border-border/50 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(`/admin/users/${user.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{user.username || 'Unknown'}</p>
                        {user.roles?.includes('admin') && (
                          <Shield className="h-4 w-4 text-purple-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.display_name || user.username}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {user.roles?.includes('admin') ? (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            <Shield className="h-3 w-3 mr-1" />
                            ADMIN
                          </Badge>
                        ) : (
                          <>
                            <Badge 
                              variant={user.plan_type === 'paid' ? 'default' : 'secondary'}
                              className={user.plan_type === 'paid' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : ''}
                            >
                              {user.plan_type === 'paid' ? (
                                <>
                                  <Crown className="h-3 w-3 mr-1" />
                                  PRO
                                </>
                              ) : (
                                'FREE'
                              )}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {user.trips_count} trips
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredUsers?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        )}
      </main>
      </div>

      <AdminBottomNav />
    </div>
  );
};

export default UserManagement;
