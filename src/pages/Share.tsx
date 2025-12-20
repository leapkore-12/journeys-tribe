import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockTripPosts, formatDistance, formatDuration } from '@/lib/mock-data';
import logoWhite from '@/assets/logo-white.svg';
import iconWhite from '@/assets/icon-white.svg';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';

const Share = () => {
  const navigate = useNavigate();
  const { postId } = useParams();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  const post = mockTripPosts.find(p => p.id === postId) || mockTripPosts[0];

  // Create slides array: photos first, then map
  const slides = [
    ...post.photos.map(photo => ({ type: 'photo' as const, src: photo })),
    { type: 'map' as const, src: post.mapImage },
  ];

  const onCarouselSelect = useCallback(() => {
    if (!carouselApi) return;
    setCurrentSlide(carouselApi.selectedScrollSnap());
  }, [carouselApi]);

  // Subscribe to carousel events
  useState(() => {
    if (!carouselApi) return;
    carouselApi.on('select', onCarouselSelect);
    return () => {
      carouselApi.off('select', onCarouselSelect);
    };
  });

  const handleInstagramShare = () => {
    console.log('Share to Instagram Story');
    // In production, this would use native sharing APIs
  };

  const handleDownload = () => {
    console.log('Download image');
    // In production, this would generate and download the image with overlay
  };

  const handleConvoyMemberClick = (userId: string) => {
    navigate(`/user/${userId}`);
  };

  return (
    <div className="flex flex-col bg-background safe-top min-h-screen">
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
        <div className="relative flex-1">
          <Carousel
            setApi={setCarouselApi}
            opts={{ loop: false }}
            className="w-full"
          >
            <CarouselContent className="-ml-0">
              {slides.map((slide, idx) => (
                <CarouselItem key={idx} className="pl-0">
                  {/* Image with Overlay */}
                  <div className="relative w-full aspect-[9/16] max-h-[500px] rounded-2xl overflow-hidden bg-secondary">
                    <img
                      src={slide.src}
                      alt={slide.type === 'map' ? 'Route map' : 'Trip photo'}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
                    
                    {/* Top Overlay - Stats */}
                    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between">
                      <div>
                        <span className="text-white/70 text-xs block">Distance</span>
                        <span className="text-white font-bold text-lg">{formatDistance(post.distance)}</span>
                        {slide.type === 'map' && (
                          <span className="text-white/80 text-xs block mt-1">{post.startLocation}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-white/70 text-xs block">Time on road</span>
                        <span className="text-white font-bold text-lg">{formatDuration(post.duration)}</span>
                        {slide.type === 'map' && (
                          <span className="text-white/80 text-xs block mt-1">{post.endLocation}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Bottom Overlay Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-end">
                      {/* Convoy Members */}
                      {post.convoyMembers.length > 0 ? (
                        <div>
                          <span className="text-white/70 text-xs block mb-1">Convoy with</span>
                          <div className="flex -space-x-2">
                            {post.convoyMembers.slice(0, 4).map((member) => (
                              <button
                                key={member.id}
                                onClick={() => handleConvoyMemberClick(member.id)}
                                className="hover:z-10 transition-transform hover:scale-110"
                              >
                                <Avatar className="h-8 w-8 border-2 border-white/30">
                                  <AvatarImage src={member.avatar} alt={member.name} />
                                  <AvatarFallback className="text-xs bg-secondary">{member.name[0]}</AvatarFallback>
                                </Avatar>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div />
                      )}
                      
                      {/* RoadTribe Watermark */}
                      <div className="flex items-center gap-2">
                        <img src={iconWhite} alt="RoadTribe" className="h-6 w-6" />
                        <span className="text-white/90 text-sm font-semibold">RoadTribe</span>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Pagination Dots */}
          {slides.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => carouselApi?.scrollTo(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Share Buttons - Dark Gray Theme */}
        <div className="space-y-3 mt-6">
          <Button
            onClick={handleInstagramShare}
            className="w-full h-12 bg-secondary hover:bg-secondary/80 text-foreground font-semibold"
          >
            Instagram Story
          </Button>
          
          <Button
            onClick={handleDownload}
            variant="outline"
            className="w-full h-12 border-border text-foreground font-semibold"
          >
            Download Image
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Share;
