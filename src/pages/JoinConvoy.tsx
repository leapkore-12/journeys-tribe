import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, MapPin, ArrowRight, Loader2, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConvoyInvites } from '@/hooks/useConvoyInvites';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import logoWhite from '@/assets/logo-white.svg';

const JoinConvoy = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { useInviteByCode, acceptInvite } = useConvoyInvites();

  const { data: invite, isLoading, error } = useInviteByCode(inviteCode || null);

  const handleJoin = async () => {
    if (!inviteCode) return;

    try {
      await acceptInvite.mutateAsync({ inviteCode });
      // Navigate to vehicle selection before joining active trip
      if (invite?.trip_id) {
        navigate(`/convoy-vehicle-select/${invite.trip_id}`);
      } else {
        navigate('/feed');
      }
    } catch (err) {
      // Error handled by mutation
    }
  };

  // If not logged in, redirect to login with return URL
  useEffect(() => {
    if (!user && !isLoading) {
      const returnUrl = `/join-convoy/${inviteCode}`;
      navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`);
    }
  }, [user, isLoading, inviteCode, navigate]);

  // Check if invite is expired
  const isExpired = invite ? new Date(invite.expires_at) < new Date() : false;
  const isAlreadyUsed = invite?.status === 'accepted';

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/feed')} className="p-2">
          <X className="h-6 w-6 text-foreground" />
        </button>
        <img src={logoWhite} alt="RoadTribe" className="h-6" />
        <div className="w-10" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        {isLoading ? (
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin mb-4" />
            <p className="text-muted-foreground">Loading invite...</p>
          </div>
        ) : error || !invite ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-sm"
          >
            <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Invite Not Found
            </h1>
            <p className="text-muted-foreground mb-6">
              This invite link is invalid or has been removed.
            </p>
            <Button onClick={() => navigate('/feed')} className="w-full">
              Go to Feed
            </Button>
          </motion.div>
        ) : isExpired ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-sm"
          >
            <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Invite Expired
            </h1>
            <p className="text-muted-foreground mb-6">
              This invite has expired. Ask the trip organizer for a new invite.
            </p>
            <Button onClick={() => navigate('/feed')} className="w-full">
              Go to Feed
            </Button>
          </motion.div>
        ) : isAlreadyUsed ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-sm"
          >
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Users className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Already Joined
            </h1>
            <p className="text-muted-foreground mb-6">
              You've already joined this convoy!
            </p>
            <Button
              onClick={() => navigate(`/trip/active?convoy=${invite.trip_id}`)}
              className="w-full"
            >
              Go to Trip
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm"
          >
            {/* Invite card */}
            <div className="bg-card rounded-2xl p-6 border border-border shadow-xl">
              {/* Inviter info */}
              <div className="flex items-center gap-3 mb-6">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={invite.inviter?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {invite.inviter?.display_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Invited by</p>
                  <p className="font-semibold text-foreground">
                    {invite.inviter?.display_name || 'A friend'}
                  </p>
                </div>
              </div>

              {/* Convoy icon */}
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-primary" />
              </div>

              <h1 className="text-2xl font-bold text-foreground text-center mb-2">
                Join the Convoy
              </h1>

              {/* Trip info */}
              {invite.trip && (
                <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                  <h2 className="font-semibold text-foreground mb-2">
                    {invite.trip.title}
                  </h2>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p>{invite.trip.start_location || 'Starting point'}</p>
                      <p className="text-primary">→ {invite.trip.end_location || 'Destination'}</p>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-sm text-muted-foreground text-center mb-6">
                Your live location will be shared with convoy members during the trip.
              </p>

              {/* Join button */}
              <Button
                onClick={handleJoin}
                disabled={acceptInvite.isPending}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {acceptInvite.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    Join Convoy
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {/* Decline option */}
            <button
              onClick={() => navigate('/feed')}
              className="w-full mt-4 py-3 text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Maybe later
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default JoinConvoy;
