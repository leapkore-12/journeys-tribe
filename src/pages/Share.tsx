import { useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSmartBack } from '@/hooks/useSmartBack';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useTripById } from '@/hooks/useTrips';
import { toast } from 'sonner';
import logoWhite from '@/assets/logo-white.svg';
import iconWhite from '@/assets/icon-white.svg';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';

// Helper functions
const formatDistance = (km: number | null) => {
  if (!km) return '0 km';
  return `${Math.round(km)} km`;
};

const formatDuration = (minutes: number | null) => {
  if (!minutes) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
};

interface SlideData {
  type: 'vehicle' | 'map';
  src: string;
}

const Share = () => {
  const navigate = useNavigate();
  const goBack = useSmartBack('/feed');
  const { postId } = useParams();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: trip, isLoading } = useTripById(postId);

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

  // Build slides array from real trip data
  const slides: SlideData[] = [];
  
  // Slide 1: Vehicle primary image (first image is primary due to sorting)
  if (trip?.vehicle?.images?.[0]) {
    slides.push({ type: 'vehicle', src: trip.vehicle.images[0] });
  }
  
  // Slide 2: Route map
  if (trip?.map_image_url) {
    slides.push({ type: 'map', src: trip.map_image_url });
  }

  const handleInstagramShare = async () => {
    if (!trip) return;
    
    const shareText = `${trip.start_location || 'Start'} → ${trip.end_location || 'End'} | ${formatDistance(trip.distance_km)} | RoadTribe`;
    const shareUrl = window.location.href;

    // Check if Web Share API is available
    if (navigator.share && navigator.canShare) {
      try {
        await navigator.share({
          title: 'Check out my road trip!',
          text: shareText,
          url: shareUrl,
        });
        toast.success('Shared successfully!');
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name !== 'AbortError') {
          // Fallback to clipboard
          await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
          toast.success('Link copied! Share it on Instagram.');
        }
      }
    } else {
      // Fallback: Copy link to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        toast.success('Link copied! Share it on Instagram.');
      } catch {
        toast.error('Failed to copy link');
      }
    }
  };

  const handleDownload = async () => {
    if (!trip || slides.length === 0) return;
    
    const currentSlideData = slides[currentSlide];
    if (!currentSlideData) return;

    setIsDownloading(true);

    try {
      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // Set canvas to 9:16 aspect ratio (story format)
      const width = 1080;
      const height = 1920;
      canvas.width = width;
      canvas.height = height;

      // Load and draw background image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = currentSlideData.src;
      });

      // Draw image covering canvas
      const imgRatio = img.width / img.height;
      const canvasRatio = width / height;
      
      let drawWidth, drawHeight, drawX, drawY;
      if (imgRatio > canvasRatio) {
        drawHeight = height;
        drawWidth = height * imgRatio;
        drawX = (width - drawWidth) / 2;
        drawY = 0;
      } else {
        drawWidth = width;
        drawHeight = width / imgRatio;
        drawX = 0;
        drawY = (height - drawHeight) / 2;
      }
      
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      // Draw gradient overlays
      const topGradient = ctx.createLinearGradient(0, 0, 0, 400);
      topGradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      topGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = topGradient;
      ctx.fillRect(0, 0, width, 400);

      const bottomGradient = ctx.createLinearGradient(0, height - 400, 0, height);
      bottomGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      bottomGradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ctx.fillStyle = bottomGradient;
      ctx.fillRect(0, height - 400, width, 400);

      // Draw text overlays
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '28px Inter, sans-serif';
      
      // Top-left: Distance
      ctx.textAlign = 'left';
      ctx.fillText('Distance', 60, 100);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px Inter, sans-serif';
      ctx.fillText(formatDistance(trip.distance_km), 60, 160);
      
      // Location on map slide
      if (currentSlideData.type === 'map' && trip.start_location) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '24px Inter, sans-serif';
        ctx.fillText(trip.start_location, 60, 200);
      }

      // Top-right: Time on road
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '28px Inter, sans-serif';
      ctx.fillText('Time on road', width - 60, 100);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px Inter, sans-serif';
      ctx.fillText(formatDuration(trip.duration_minutes), width - 60, 160);
      
      // End location on map slide
      if (currentSlideData.type === 'map' && trip.end_location) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '24px Inter, sans-serif';
        ctx.fillText(trip.end_location, width - 60, 200);
      }

      // Bottom-left: Convoy members
      if (trip.convoy_members && trip.convoy_members.length > 0) {
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '24px Inter, sans-serif';
        ctx.fillText('Convoy with', 60, height - 140);
        
        // Draw convoy member names
        const names = trip.convoy_members.slice(0, 3).map(m => m.profile?.display_name || 'User').join(', ');
        ctx.fillStyle = 'white';
        ctx.font = '28px Inter, sans-serif';
        ctx.fillText(names, 60, height - 100);
      }

      // Bottom-right: RoadTribe logo text
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 32px Inter, sans-serif';
      ctx.fillText('RoadTribe', width - 60, height - 80);

      // Trigger download
      const link = document.createElement('a');
      link.download = `roadtribe-trip-${trip.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('Image downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleConvoyMemberClick = (userId: string) => {
    navigate(`/user/${userId}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col bg-background safe-top min-h-screen">
        <header className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="flex items-center justify-between px-4 h-14">
            <button onClick={goBack} className="text-foreground p-2 -ml-2">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <img src={logoWhite} alt="RoadTribe" className="h-6" />
            <div className="w-10" />
          </div>
        </header>
        <div className="flex-1 flex flex-col px-4 py-6">
          <Skeleton className="w-full aspect-[9/16] max-h-[500px] rounded-2xl" />
          <div className="space-y-3 mt-6">
            <Skeleton className="w-full h-12 rounded-lg" />
            <Skeleton className="w-full h-12 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex flex-col bg-background safe-top min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Trip not found</p>
        <Button variant="ghost" onClick={goBack} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="flex flex-col bg-background safe-top min-h-screen items-center justify-center">
        <p className="text-muted-foreground">No images available to share</p>
        <Button variant="ghost" onClick={goBack} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background safe-top min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={goBack}
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
                      alt={slide.type === 'map' ? 'Route map' : 'Vehicle'}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
                    
                    {/* Top Overlay - Stats */}
                    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between">
                      <div>
                        <span className="text-white/70 text-xs block">Distance</span>
                        <span className="text-white font-bold text-lg">{formatDistance(trip.distance_km)}</span>
                        {slide.type === 'map' && trip.start_location && (
                          <span className="text-white/80 text-xs block mt-1">{trip.start_location}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-white/70 text-xs block">Time on road</span>
                        <span className="text-white font-bold text-lg">{formatDuration(trip.duration_minutes)}</span>
                        {slide.type === 'map' && trip.end_location && (
                          <span className="text-white/80 text-xs block mt-1">{trip.end_location}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Bottom Overlay Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-end">
                      {/* Convoy Members */}
                      {trip.convoy_members && trip.convoy_members.length > 0 ? (
                        <div>
                          <span className="text-white/70 text-xs block mb-1">Convoy with</span>
                          <div className="flex -space-x-2">
                            {trip.convoy_members.slice(0, 4).map((member) => (
                              <button
                                key={member.user_id}
                                onClick={() => handleConvoyMemberClick(member.user_id)}
                                className="hover:z-10 transition-transform hover:scale-110"
                              >
                                <Avatar className="h-8 w-8 border-2 border-white/30">
                                  <AvatarImage src={member.profile?.avatar_url || ''} alt={member.profile?.display_name || 'User'} />
                                  <AvatarFallback className="text-xs bg-secondary">
                                    {(member.profile?.display_name || 'U')[0]}
                                  </AvatarFallback>
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
            disabled={isDownloading}
            variant="outline"
            className="w-full h-12 border-border text-foreground font-semibold"
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              'Download Image'
            )}
          </Button>
        </div>
      </div>
      
      {/* Hidden canvas for download */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default Share;
