import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Check, AlertCircle, Wifi, WifiOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useOfflineMaps } from '@/hooks/useOfflineMaps';
import { useToast } from '@/hooks/use-toast';

interface OfflineMapDownloadProps {
  routeCoordinates: [number, number][];
  routeDistanceKm?: number;
}

export const OfflineMapDownload = ({
  routeCoordinates,
  routeDistanceKm,
}: OfflineMapDownloadProps) => {
  const { toast } = useToast();
  const {
    isSupported,
    isReady,
    isDownloading,
    downloadProgress,
    downloadFailed,
    cacheStatus,
    downloadRouteArea,
    checkCacheStatus,
    estimateTiles,
  } = useOfflineMaps();

  const [isSkipped, setIsSkipped] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [estimate, setEstimate] = useState<{
    tileCount: number;
    estimatedSize: string;
    routeDistanceKm: number;
  } | null>(null);

  // Calculate estimate when route changes
  useEffect(() => {
    if (routeCoordinates.length > 0) {
      const result = estimateTiles(routeCoordinates);
      setEstimate(result);
    }
  }, [routeCoordinates, estimateTiles]);

  // Check cache status on mount
  useEffect(() => {
    if (isReady && routeCoordinates.length > 0) {
      checkCacheStatus(routeCoordinates).then((status) => {
        if (status && status.percentage >= 95) {
          setIsComplete(true);
        }
      });
    }
  }, [isReady, routeCoordinates, checkCacheStatus]);

  // Handle download
  const handleDownload = async () => {
    try {
      await downloadRouteArea(routeCoordinates);
      setIsComplete(true);
      toast({
        title: 'Maps downloaded',
        description: 'Your route maps are ready for offline use.',
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: 'Download failed',
        description: 'Could not download maps. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle skip
  const handleSkip = () => {
    setIsSkipped(true);
  };

  // Not supported
  if (!isSupported) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-muted/50 p-4"
      >
        <div className="flex items-center gap-3 text-muted-foreground">
          <WifiOff className="h-5 w-5" />
          <span className="text-sm">Offline maps not available in this browser</span>
        </div>
      </motion.div>
    );
  }

  // Skipped
  if (isSkipped) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-muted/30 p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Wifi className="h-5 w-5" />
            <span className="text-sm">Maps will load online during trip</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSkipped(false)}
            className="text-xs"
          >
            Download Instead
          </Button>
        </div>
      </motion.div>
    );
  }

  // Complete
  if (isComplete && !isDownloading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-primary/10 border border-primary/20 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
            <Check className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-primary">Maps ready for offline use</p>
            <p className="text-sm text-muted-foreground">
              {estimate?.estimatedSize || 'Downloaded'} cached for this route
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Downloading
  if (isDownloading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-muted/50 border border-border p-4"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20"
              >
                <Download className="h-4 w-4 text-primary" />
              </motion.div>
              <div>
                <p className="font-medium">Downloading maps...</p>
                <p className="text-sm text-muted-foreground">
                  {downloadProgress}% complete
                </p>
              </div>
            </div>
            {downloadFailed > 0 && (
              <div className="flex items-center gap-1 text-amber-500">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs">{downloadFailed} failed</span>
              </div>
            )}
          </div>
          <Progress value={downloadProgress} className="h-2" />
        </div>
      </motion.div>
    );
  }

  // Ready to download
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-muted/50 border border-border p-4"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Download Maps for Offline</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Route: {routeDistanceKm || estimate?.routeDistanceKm || 0} km • Est. size: ~{estimate?.estimatedSize || 'calculating...'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleDownload}
            disabled={!isReady || !estimate}
            className="flex-1"
            size="sm"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Maps
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSkip}
          >
            Skip
          </Button>
        </div>

        {cacheStatus && cacheStatus.percentage > 0 && cacheStatus.percentage < 95 && (
          <p className="text-xs text-muted-foreground text-center">
            {cacheStatus.percentage}% of this route is already cached
          </p>
        )}
      </div>
    </motion.div>
  );
};
