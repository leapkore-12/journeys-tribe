import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import logoWhite from '@/assets/logo-white.svg';

const Splash = () => {
  const navigate = useNavigate();
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    // Show logo after initial delay
    const logoTimer = setTimeout(() => setShowLogo(true), 300);
    
    // Navigate to login after animation
    const navTimer = setTimeout(() => {
      navigate('/login');
    }, 2500);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center safe-top safe-bottom">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={showLogo ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center"
      >
        <motion.img
          src={logoWhite}
          alt="RoadTribe"
          className="w-64 h-auto"
          initial={{ y: 20 }}
          animate={showLogo ? { y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        />
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={showLogo ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 1 }}
          className="mt-12"
        >
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Splash;
