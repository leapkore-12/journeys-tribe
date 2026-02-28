import { useNavigate } from 'react-router-dom';
import { useAdminStats } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Crown, 
  Map, 
  Shield, 
  UserPlus,
  Loader2 
} from 'lucide-react';
import logoWhite from '@/assets/logo-white.svg';
import AdminBottomNav from '@/components/admin/AdminBottomNav';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useAdminStats();

  const statCards = [
    { 
      label: 'Total Users', 
      value: stats?.totalUsers || 0, 
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    { 
      label: 'Pro Users', 
      value: stats?.paidUsers || 0, 
      icon: Crown,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
    },
    { 
      label: 'Free Users', 
      value: stats?.freeUsers || 0, 
      icon: Users,
      color: 'text-gray-400',
      bgColor: 'bg-gray-400/10',
    },
    { 
      label: 'Total Trips', 
      value: stats?.totalTrips || 0, 
      icon: Map,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    { 
      label: 'Admins', 
      value: stats?.totalAdmins || 0, 
      icon: Shield,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <img src={logoWhite} alt="RoadTribe" className="h-8" />
            <div className="flex items-center gap-2 text-primary">
              <Shield className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Admin</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-32">
      <main className="p-4 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage users and monitor app activity</p>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((stat) => (
              <Card key={stat.label} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/admin/users/new')}
            >
              <UserPlus className="h-4 w-4 mr-3" />
              Create New User
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/admin/users')}
            >
              <Users className="h-4 w-4 mr-3" />
              Manage Users
            </Button>
          </CardContent>
        </Card>
      </main>
      </div>

      <AdminBottomNav />
    </div>
  );
};

export default AdminDashboard;
