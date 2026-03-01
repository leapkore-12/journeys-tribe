import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Crown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useIsPaidUser, useFeatureAccess, useMonthlyTripLimit } from '@/hooks/useSubscription';
import { useCurrentProfile } from '@/hooks/useProfile';
import { differenceInDays, parseISO, addMonths } from 'date-fns';

const Subscription = () => {
  const navigate = useNavigate();
  const handleBack = () => navigate('/settings');
  const { isPaid, planType } = useIsPaidUser();
  const { isLoading } = useFeatureAccess();
  const { tripsUsed, tripsRemaining } = useMonthlyTripLimit();
  const { data: profile } = useCurrentProfile();

  const maxFreeTrips = 2;
  const tripsProgress = (tripsUsed / maxFreeTrips) * 100;

  // Calculate days until reset
  const getDaysUntilReset = () => {
    if (!profile?.monthly_trip_reset_at) {
      // If no reset date, assume it resets next month from now
      return differenceInDays(addMonths(new Date(), 1), new Date());
    }
    const resetDate = parseISO(profile.monthly_trip_reset_at);
    const days = differenceInDays(resetDate, new Date());
    return Math.max(0, days);
  };

  const features = [
    { name: 'Trips per month', free: '2', premium: 'Unlimited' },
    { name: 'Vehicles', free: '1', premium: 'Unlimited' },
    { name: 'Photos per vehicle', free: '5', premium: 'Unlimited' },
    { name: 'Create Convoy', free: false, premium: true },
    { name: 'Per-trip visibility', free: false, premium: true },
    { name: 'Your Tribe feature', free: false, premium: true },
    { name: 'Live tracking', free: false, premium: true },
    { name: 'Auto-tagging', free: false, premium: true },
  ];

  const handleUpgrade = () => {
    window.open('https://www.roadtribe.io/subscription', '_blank');
  };

  const handleManageSubscription = () => {
    window.open('https://www.roadtribe.io/subscription', '_blank');
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:roadtribe@eyemeetslens.com?subject=Subscription%20Question';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col bg-background min-h-screen">
        <header className="sticky top-0 z-40 bg-background">
          <div className="flex items-center gap-3 px-4 h-14">
            <button onClick={handleBack} className="text-foreground min-h-11 min-w-11 flex items-center justify-center active:opacity-70">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">Subscription</h1>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={handleBack} className="text-foreground min-h-11 min-w-11 flex items-center justify-center active:opacity-70">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Subscription</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-6">
        {/* Current Plan Card */}
        <div className={`rounded-xl p-5 border ${isPaid ? 'border-primary bg-primary/10' : 'border-border bg-secondary'}`}>
          <div className="flex items-center gap-3 mb-3">
            {isPaid && <Crown className="h-6 w-6 text-primary" />}
            <span className={`text-xl font-bold uppercase ${isPaid ? 'text-primary' : 'text-muted-foreground'}`}>
              {isPaid ? 'Premium' : 'Free Plan'}
            </span>
          </div>
          
          {isPaid ? (
            <div className="text-muted-foreground space-y-1">
              <p>You are using the Premium Plan.</p>
              <p>Built for riders and drivers.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Trips this month</span>
                <span className="text-foreground font-medium">{tripsUsed} / {maxFreeTrips}</span>
              </div>
              <Progress value={tripsProgress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {tripsRemaining > 0 
                  ? `${tripsRemaining} trip${tripsRemaining !== 1 ? 's' : ''} remaining`
                  : 'Monthly limit reached'
                } • Resets in {getDaysUntilReset()} days
              </p>
            </div>
          )}
        </div>

        {/* Feature Comparison */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Feature Comparison</h2>
          
          <div className="rounded-xl border border-border overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-3 bg-secondary/50 px-4 py-3 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">Feature</span>
              <span className="text-sm font-medium text-muted-foreground text-center">Free</span>
              <span className="text-sm font-medium text-primary text-center">Premium</span>
            </div>
            
            {/* Feature Rows */}
            {features.map((feature, index) => (
              <div 
                key={feature.name}
                className={`grid grid-cols-3 px-4 py-3 ${index !== features.length - 1 ? 'border-b border-border' : ''}`}
              >
                <span className="text-sm text-foreground">{feature.name}</span>
                <div className="flex justify-center">
                  {typeof feature.free === 'boolean' ? (
                    feature.free ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground" />
                    )
                  ) : (
                    <span className="text-sm text-muted-foreground">{feature.free}</span>
                  )}
                </div>
                <div className="flex justify-center">
                  {typeof feature.premium === 'boolean' ? (
                    feature.premium ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground" />
                    )
                  ) : (
                    <span className="text-sm text-primary font-medium">{feature.premium}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-3">
          {isPaid ? (
            <Button 
              onClick={handleManageSubscription}
              className="w-full h-12"
              variant="outline"
            >
              Manage Subscription
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleUpgrade}
              className="w-full h-12 bg-primary text-primary-foreground"
            >
              <Crown className="h-5 w-5 mr-2" />
              Upgrade to Premium
            </Button>
          )}
        </div>

        {/* Contact Support */}
        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground text-center mb-3">
            Questions about your subscription?
          </p>
          <Button 
            onClick={handleContactSupport}
            variant="ghost"
            className="w-full text-primary"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
