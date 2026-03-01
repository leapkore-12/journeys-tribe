import { useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload, Link as LinkIcon, MessageCircle, MoreHorizontal } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useTripById } from '@/hooks/useTrips';
import { useDeviceSpacing } from '@/hooks/useDeviceInfo';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
// logo-white removed — header eliminated for immersive view
import iconWhite from '@/assets/icon-white.svg';
import rWhitePng from '@/assets/r-white.png';
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

// Custom SVG icons for social platforms
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

// Reusable share option component
interface ShareOptionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  bgColor?: string;
}

const ShareOption = ({ icon, label, onClick, bgColor = 'bg-secondary' }: ShareOptionProps) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2"
  >
    <div className={`w-14 h-14 rounded-full ${bgColor} flex items-center justify-center`}>
      {icon}
    </div>
    <span className="text-xs text-foreground">{label}</span>
  </button>
);

const Share = () => {
  const navigate = useNavigate();
  const { safeAreaTop } = useDeviceSpacing();
  const handleBack = () => navigate('/feed');
  const { postId } = useParams();
  const { user } = useAuth();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: trip, isLoading } = useTripById(postId);

  // Determine if user can share as their own trip
  const isOwner = user?.id === trip?.user_id;
  const isConvoyMember = trip?.convoy_members?.some(
    member => member.user_id === user?.id
  );
  const canShareAsOwn = isOwner || isConvoyMember;

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

  // Shared canvas rendering logic for both Download and Instagram Story
  const generateStoryImage = async (): Promise<Blob | null> => {
    if (!trip || slides.length === 0) return null;
    
    const currentSlideData = slides[currentSlide];
    if (!currentSlideData) return null;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

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

      // Gradient overlays
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

      // Text overlays
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '28px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Distance', 60, 100);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px Inter, sans-serif';
      ctx.fillText(formatDistance(trip.distance_km), 60, 160);

      if (currentSlideData.type === 'map' && trip.start_location) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '24px Inter, sans-serif';
        ctx.fillText(trip.start_location, 60, 200);
      }

      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '28px Inter, sans-serif';
      ctx.fillText('Time on road', width - 60, 100);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px Inter, sans-serif';
      ctx.fillText(formatDuration(trip.duration_minutes), width - 60, 160);

      if (currentSlideData.type === 'map' && trip.end_location) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '24px Inter, sans-serif';
        ctx.fillText(trip.end_location, width - 60, 200);
      }

      // Convoy members
      if (trip.convoy_members && trip.convoy_members.length > 0) {
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '24px Inter, sans-serif';
        ctx.fillText('Convoy with', 60, height - 140);
        const names = trip.convoy_members.slice(0, 3).map(m => m.profile?.display_name || 'User').join(', ');
        ctx.fillStyle = 'white';
        ctx.font = '28px Inter, sans-serif';
        ctx.fillText(names, 60, height - 100);
      }

      // RoadTribe logo
      const logoIcon = new Image();
      logoIcon.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        logoIcon.onload = () => resolve();
        logoIcon.onerror = () => resolve();
        logoIcon.src = rWhitePng;
      });

      const iconSize = 90;
      const paddingRight = 60;
      const paddingBottom = 80;
      const gap = 30;
      ctx.font = '600 54px Inter, sans-serif';
      const textWidth = ctx.measureText('RoadTribe').width;
      const textX = width - paddingRight;
      const textY = height - paddingBottom;

      if (logoIcon.complete && logoIcon.naturalWidth > 0) {
        const iconX = textX - textWidth - gap - iconSize;
        const iconY = textY - iconSize + 18;
        ctx.drawImage(logoIcon, iconX, iconY, iconSize, iconSize);
      }

      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText('RoadTribe', textX, textY);

      // Convert to blob
      return await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      });
    } catch (error) {
      console.error('Image generation error:', error);
      return null;
    }
  };

  const handleInstagramShare = async () => {
    if (!trip || slides.length === 0) return;

    setIsGeneratingStory(true);
    try {
    const imageBlob = await generateStoryImage();
    if (!imageBlob) {
      toast.error('Failed to generate image');
      return;
    }

    const file = new File([imageBlob], 'roadtribe-story.png', { type: 'image/png' });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'RoadTribe Trip' });
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        toast.error('Failed to share');
      }
    } else {
      // Fallback: copy link and try Instagram URL scheme
      const shareUrl = `${window.location.origin}/trip/${trip.id}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch { /* ignore */ }
      window.location.href = 'instagram://story-camera';
      setTimeout(() => {
        window.open('https://www.instagram.com/', '_blank');
      }, 2000);
      toast.success('Link copied! Share it on Instagram.');
    }
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // 3rd party sharing - copy link
  const handleCopyLink = async () => {
    if (!trip) return;
    try {
      const shareUrl = `${window.location.origin}/trip/${trip.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  // Generate share URL and text
  const getShareData = () => {
    const shareUrl = `${window.location.origin}/trip/${trip?.id}`;
    const shareText = `Check out this road trip on RoadTribe: ${trip?.title || 'Amazing Journey'}`;
    return { shareUrl, shareText };
  };

  // WhatsApp share
  const handleWhatsAppShare = () => {
    const { shareUrl, shareText } = getShareData();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank');
    setIsShareSheetOpen(false);
  };

  // Twitter/X share
  const handleTwitterShare = () => {
    const { shareUrl, shareText } = getShareData();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
    setIsShareSheetOpen(false);
  };

  // SMS/Messages share
  const handleMessagesShare = () => {
    const { shareUrl, shareText } = getShareData();
    const smsUrl = `sms:?body=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.location.href = smsUrl;
    setIsShareSheetOpen(false);
  };

  // Native share (More options)
  const handleNativeShare = async () => {
    const { shareUrl, shareText } = getShareData();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'RoadTribe Trip',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    }
    setIsShareSheetOpen(false);
  };

  const handleDownload = async () => {
    if (!trip || slides.length === 0) return;

    setIsDownloading(true);

    try {
      const imageBlob = await generateStoryImage();
      if (!imageBlob) throw new Error('Failed to generate image');

      const file = new File([imageBlob], `roadtribe-trip-${trip.id}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'RoadTribe Trip' });
        toast.success('Image shared!');
      } else {
        // Desktop fallback
        const dataUrl = URL.createObjectURL(imageBlob);
        const link = document.createElement('a');
        link.download = `roadtribe-trip-${trip.id}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(dataUrl);
        toast.success('Image downloaded!');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Download error:', error);
        toast.error('Failed to download image');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleConvoyMemberClick = (userId: string) => {
    navigate(`/user/${userId}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-black items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex flex-col bg-background items-center justify-center">
        <p className="text-muted-foreground">Trip not found</p>
        <Button variant="ghost" onClick={handleBack} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="flex flex-col bg-background items-center justify-center">
        <p className="text-muted-foreground">No images available to share</p>
        <Button variant="ghost" onClick={handleBack} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col bg-black"
      style={{
        height: `calc(100vh + env(safe-area-inset-top, ${safeAreaTop}px))`,
        marginTop: `calc(-1 * env(safe-area-inset-top, ${safeAreaTop}px))`,
      }}
    >
      {/* Floating Back Button */}
      <button
        onClick={handleBack}
        className="absolute left-4 z-50 min-h-11 min-w-11 flex items-center justify-center rounded-full bg-black/40 text-white"
        style={{ top: `calc(max(env(safe-area-inset-top, ${safeAreaTop}px), 16px) + 8px)` }}
      >
        <ArrowLeft className="h-6 w-6" />
      </button>

      {/* Full-screen Image Carousel */}
      <div className="flex-1 relative">
        <Carousel
          setApi={setCarouselApi}
          opts={{ loop: false }}
          className="h-full"
        >
          <CarouselContent className="-ml-0 h-full">
            {slides.map((slide, idx) => (
              <CarouselItem key={idx} className="pl-0 h-full">
                <div className="relative w-full h-full overflow-hidden">
                  <img
                    src={slide.src}
                    alt={slide.type === 'map' ? 'Route map' : 'Vehicle'}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
                  
                  {/* Top Overlay - Stats */}
                  <div className="absolute top-0 left-0 right-0 p-4 pt-16 flex justify-between">
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

        {/* Pagination Dots - overlaid on image */}
        {slides.length > 1 && (
          <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-2 z-10">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => carouselApi?.scrollTo(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="p-4 pb-6 space-y-3 bg-black/80 backdrop-blur-sm">
        {canShareAsOwn ? (
          <>
            <Button
              onClick={handleInstagramShare}
              disabled={isGeneratingStory}
              className="w-full h-12 bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20"
            >
              {isGeneratingStory ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                'Instagram Story'
              )}
            </Button>
            
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full h-12 bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20"
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
          </>
        ) : (
          <>
            <Button
              onClick={() => setIsShareSheetOpen(true)}
              className="w-full h-12 bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20"
            >
              <Upload className="mr-2 h-4 w-4" />
              Share
            </Button>
            
            <Button
              onClick={handleCopyLink}
              className="w-full h-12 bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20"
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
          </>
        )}
      </div>
      
      {/* Hidden canvas for download */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Share Sheet for 3rd party users */}
      <Sheet open={isShareSheetOpen} onOpenChange={setIsShareSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle>Share to</SheetTitle>
          </SheetHeader>
          
          <div className="flex justify-around py-4">
            <ShareOption
              icon={<WhatsAppIcon className="h-6 w-6 text-white" />}
              label="WhatsApp"
              onClick={handleWhatsAppShare}
              bgColor="bg-[#25D366]"
            />
            
            <ShareOption
              icon={<TwitterIcon className="h-6 w-6 text-white" />}
              label="Twitter"
              onClick={handleTwitterShare}
              bgColor="bg-foreground"
            />
            
            <ShareOption
              icon={<MessageCircle className="h-6 w-6 text-white" />}
              label="Messages"
              onClick={handleMessagesShare}
              bgColor="bg-[#34C759]"
            />
            
            <ShareOption
              icon={<MoreHorizontal className="h-6 w-6 text-foreground" />}
              label="More"
              onClick={handleNativeShare}
              bgColor="bg-secondary"
            />
          </div>
          
          <Button
            onClick={() => {
              handleCopyLink();
              setIsShareSheetOpen(false);
            }}
            variant="outline"
            className="w-full h-12 mt-4 border-border text-foreground font-semibold"
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            Copy Link
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Share;
