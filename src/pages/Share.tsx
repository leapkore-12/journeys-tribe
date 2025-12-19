import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockTripPosts, formatDistance, formatDuration } from '@/lib/mock-data';
import logoWhite from '@/assets/logo-white.svg';
import iconWhite from '@/assets/icon-white.svg';

const Share = () => {
  const navigate = useNavigate();
  const { postId } = useParams();
  const [currentSlide, setCurrentSlide] = useState(0);

  const post = mockTripPosts.find(p => p.id === postId) || mockTripPosts[0];

  // Create slides array: photos first, then map
  const slides = [
    ...post.photos.map(photo => ({ type: 'photo' as const, src: photo })),
    { type: 'map' as const, src: post.mapImage },
  ];

  const handleInstagramShare = () => {
    console.log('Share to Instagram Story');
    // In production, this would use native sharing APIs
  };

  const handleDownload = () => {
    console.log('Download image');
    // In production, this would generate and download the image with overlay
  };

  return (
    <div className="flex flex-col bg-background safe-top">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="text-foreground p-2 -ml-2"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <img src={logoWhite} alt="RoadTribe" className="h-6" />
          <div className="w-10" />
        </div>
      </header>

      {/* Swipeable Media Carousel */}
      <div className="flex-1 flex flex-col px-4 py-6">
        <div className="relative flex-1 max-h-[500px]">
          {/* Image with Overlay */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-secondary">
            <img
              src={slides[currentSlide].src}
              alt={slides[currentSlide].type === 'map' ? 'Route map' : 'Trip photo'}
              className="w-full h-full object-cover"
            />
            
            {/* Stats Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            {/* Bottom Overlay Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              {/* Trip Title */}
              <h2 className="text-white font-bold text-xl mb-2">{post.title}</h2>
              
              {/* Stats Row */}
              <div className="flex items-center gap-4 text-white/90 text-sm mb-4">
                <div>
                  <span className="text-white/60 text-xs block">Distance</span>
                  <span className="font-semibold">{formatDistance(post.distance)}</span>
                </div>
                <div>
                  <span className="text-white/60 text-xs block">Time</span>
                  <span className="font-semibold">{formatDuration(post.duration)}</span>
                </div>
              </div>
              
              {/* RoadTribe Watermark */}
              <div className="flex items-center gap-2">
                <img src={iconWhite} alt="RoadTribe" className="h-5 w-5" />
                <span className="text-white/80 text-sm font-medium">RoadTribe</span>
              </div>
            </div>
          </div>

          {/* Pagination Dots */}
          {slides.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Share Buttons */}
        <div className="space-y-3 mt-6">
          <Button
            onClick={handleInstagramShare}
            className="w-full h-12 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90 text-white font-semibold"
          >
            <Instagram className="h-5 w-5 mr-2" />
            Share to Instagram Story
          </Button>
          
          <Button
            onClick={handleDownload}
            variant="outline"
            className="w-full h-12 border-border text-foreground font-semibold"
          >
            <Download className="h-5 w-5 mr-2" />
            Download Image
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Share;
