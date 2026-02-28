import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateUser } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Home, Loader2, Eye, EyeOff, Crown } from 'lucide-react';
import { toast } from 'sonner';
import AdminBottomNav from '@/components/admin/AdminBottomNav';

const CreateUser = () => {
  const navigate = useNavigate();
  const createUser = useCreateUser();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [planType, setPlanType] = useState('free');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !username) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await createUser.mutateAsync({
        email,
        password,
        username,
        display_name: displayName || username,
        plan_type: planType,
      });
      
      navigate('/admin/users');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
            <Home className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Create New User</h1>
        </div>
      </header>

      <main className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Account Details</CardTitle>
              <CardDescription>Enter the user's login credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Profile Information</CardTitle>
              <CardDescription>Set up the user's profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="unique_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Only lowercase letters, numbers, and underscores
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Subscription Plan</CardTitle>
              <CardDescription>Choose the user's plan type</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={planType} onValueChange={setPlanType} className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="free" id="free" />
                  <Label htmlFor="free" className="flex-1 cursor-pointer">
                    <span className="font-medium">Free Plan</span>
                    <p className="text-sm text-muted-foreground">
                      Limited features, 2 trips/month
                    </p>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10 cursor-pointer">
                  <RadioGroupItem value="paid" id="paid" />
                  <Label htmlFor="paid" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-400" />
                      <span className="font-medium text-yellow-400">Pro Plan</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      All features, unlimited trips
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full mb-4" 
            disabled={createUser.isPending}
          >
            {createUser.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating User...
              </>
            ) : (
              'Create User'
            )}
          </Button>
        </form>
      </main>

      <AdminBottomNav />
    </div>
  );
};

export default CreateUser;
