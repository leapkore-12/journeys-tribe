import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockTripPosts } from '@/lib/mock-data';
import TripCard from '@/components/TripCard';
import logoWhite from '@/assets/logo-white.svg';

const Feed = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState(mockTripPosts);

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    }));
  };

  return (
    <div className="flex flex-col bg-background safe-top">
      {/* Header - Search Left, Logo Center, Bell Right */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Search Icon - Left */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/search')}
            className="text-foreground"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Logo - Center */}
          <img src={logoWhite} alt="RoadTribe" className="h-6" />

          {/* Bell Icon - Right */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/notifications')}
            className="relative text-foreground"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </Button>
        </div>
      </header>

      {/* Feed */}
      <div>
        <AnimatePresence>
          {posts.map((post, index) => (
            <TripCard 
              key={post.id} 
              post={post} 
              index={index}
              onLike={() => handleLike(post.id)}
              onComment={() => navigate(`/comments/${post.id}`)}
              onShare={() => navigate(`/share/${post.id}`)}
              onUserClick={() => navigate(`/user/${post.user.id}`)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Feed;
