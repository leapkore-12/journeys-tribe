import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useIsAdmin } from '@/hooks/useAdmin';
import logoWhiteTagline from '@/assets/logo-white-tagline.svg';

const Splash = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [showLogo, setShowLogo] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    const logoTimer = setTimeout(() => setShowLogo(true), 300);
    return () => clearTimeout(logoTimer);
  }, []);

  // Redirect logged-in users once auth resolves
  useEffect(() => {
    if (!authLoading && !adminLoading && user) {
      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/feed', { replace: true });
      }
    }
  }, [user, authLoading, adminLoading, isAdmin, navigate]);

  // Show buttons only after auth resolves and user is NOT logged in
  useEffect(() => {
    if (!authLoading && !adminLoading && !user) {
      const buttonTimer = setTimeout(() => setShowButtons(true), 800);
      return () => clearTimeout(buttonTimer);
    }
  }, [authLoading, adminLoading, user]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center safe-bottom px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={showLogo ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center"
      >
        <motion.img
          src={logoWhiteTagline}
          alt="RoadTribe"
          className="w-64 h-auto"
          initial={{ y: 20 }}
          animate={showLogo ? { y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </motion.div>

      {/* Only show buttons when not logged in */}
      {!authLoading && !adminLoading && !user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={showButtons ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm flex flex-col gap-3 mt-12"
        >
          <Button size="lg" className="w-full" onClick={() => navigate('/login')}>
            Login
          </Button>
          <Button size="lg" variant="outline" className="w-full" onClick={() => navigate('/signup')}>
            Sign Up
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default Splash;
