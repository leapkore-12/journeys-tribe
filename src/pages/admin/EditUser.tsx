import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminUser, useAdminUpdateProfile, useToggleAdminRole, useDeleteUser } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  ArrowLeft,
  Home, 
  Loader2, 
  Crown, 
  Shield, 
  Trash2, 
  Map, 
  Car, 
  Users 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AdminBottomNav from '@/components/admin/AdminBottomNav';

const EditUser = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { data: user, isLoading } = useAdminUser(id);
  const updateProfile = useAdminUpdateProfile();
  const toggleAdmin = useToggleAdminRole();
  const deleteUser = useDeleteUser();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [planType, setPlanType] = useState('free');
  const [isAdmin, setIsAdmin] = useState(false);
  const [monthlyTripCount, setMonthlyTripCount] = useState(0);

  const isCurrentUser = currentUser?.id === id;

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setDisplayName(user.display_name || '');
      setPlanType(user.plan_type || 'free');
      setIsAdmin(user.roles?.includes('admin') || false);
      setMonthlyTripCount(user.monthly_trip_count || 0);
    }
  }, [user]);

  const handleSave = async () => {
    if (!id) return;
    
    await updateProfile.mutateAsync({
      userId: id,
      updates: {
        username,
        display_name: displayName,
        plan_type: planType,
        monthly_trip_count: monthlyTripCount,
      },
    });
  };

  const handleToggleAdmin = async () => {
    if (!id || isCurrentUser) return;
    
    await toggleAdmin.mutateAsync({
      userId: id,
      isAdmin: !isAdmin,
    });
    setIsAdmin(!isAdmin);
  };

  const handleDelete = async () => {
    if (!id) return;
    
    await deleteUser.mutateAsync(id);
    navigate('/admin/users');
  };

  const handleResetMonthlyTrips = async () => {
    if (!id) return;
    
    await updateProfile.mutateAsync({
      userId: id,
      updates: { monthly_trip_count: 0 },
    });
    setMonthlyTripCount(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
              <Home className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Edit User</h1>
          </div>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* User Header */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {user.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">{user.display_name || user.username}</h2>
            <p className="text-muted-foreground">@{user.username}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <Map className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold">{user.trips_count || 0}</p>
              <p className="text-xs text-muted-foreground">Trips</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <Car className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold">{user.vehicles_count || 0}</p>
              <p className="text-xs text-muted-foreground">Vehicles</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <Users className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold">{user.followers_count || 0}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </CardContent>
          </Card>
        </div>

        {/* Profile Info */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plan */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Subscription Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={planType} onValueChange={setPlanType} className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="free" id="free" />
                <Label htmlFor="free" className="flex-1 cursor-pointer">
                  <span className="font-medium">Free Plan</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10 cursor-pointer">
                <RadioGroupItem value="paid" id="paid" />
                <Label htmlFor="paid" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-400" />
                    <span className="font-medium text-yellow-400">Pro Plan</span>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Monthly Trips (for Free users) */}
        {planType === 'free' && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Monthly Trip Count</CardTitle>
              <CardDescription>
                Free users are limited to 2 trips per month
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current count:</span>
                <span className="font-bold">{monthlyTripCount} / 2</span>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleResetMonthlyTrips}
                disabled={updateProfile.isPending}
              >
                Reset Monthly Count
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Admin Role */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-400" />
              Admin Access
            </CardTitle>
            <CardDescription>
              Grant or revoke admin privileges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Admin Role</p>
                <p className="text-sm text-muted-foreground">
                  {isCurrentUser ? "You cannot modify your own admin status" : "Can access admin dashboard"}
                </p>
              </div>
              <Switch
                checked={isAdmin}
                onCheckedChange={handleToggleAdmin}
                disabled={isCurrentUser || toggleAdmin.isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        {!isCurrentUser && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete User?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {user.display_name || user.username}'s account and all their data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        )}
      </main>

      <AdminBottomNav />
    </div>
  );
};

export default EditUser;
