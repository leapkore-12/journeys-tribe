import { ArrowLeft, ExternalLink, Mail } from 'lucide-react';
import { useSmartBack } from '@/hooks/useSmartBack';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

const Help = () => {
  const goBack = useSmartBack('/settings');

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={goBack} className="text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Help & Support</h1>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="px-4 py-6 space-y-6 pb-24">
          {/* Last Updated */}
          <p className="text-sm text-muted-foreground">Last Updated: January 02, 2026</p>

          {/* Getting Started */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Getting Started</h2>
            <p className="text-muted-foreground leading-relaxed">
              RoadTribe is a mobile app for recording, sharing, and experiencing road trips. An account 
              is required to use the app.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Accounts are created using a valid email address. Social logins are not supported at this time.
            </p>
          </section>

          {/* Trip Recording & Location Access */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Trip Recording & Location Access</h2>
            <p className="text-muted-foreground leading-relaxed">
              RoadTribe uses location access to record trips and, where applicable, enable live tracking features.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Location access is optional and permission-based</li>
              <li>Location is used only during active trip recording</li>
              <li>If location access is denied, trip recording features may be limited</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Location permissions can be managed through your device settings.
            </p>
          </section>

          {/* Convoy & Live Tracking */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Convoy & Live Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              Live convoy tracking allows users to see each other's location in real time during a shared trip.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Convoy and live tracking features are available only to Premium users</li>
              <li>Live tracking works only when users are part of the same convoy</li>
              <li>Location sharing starts when the trip begins and ends automatically when the trip ends</li>
            </ul>
          </section>

          {/* Privacy & Visibility */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Privacy & Visibility</h2>
            <p className="text-muted-foreground leading-relaxed">
              RoadTribe gives users control over how their profile and trips are shared.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>All users can set their profile to public or private</li>
              <li>Only Premium users can control visibility on a per-trip basis</li>
              <li>Free users follow their profile-level visibility setting for all trips</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Privacy settings and account controls are managed via the app settings.
            </p>
          </section>

          {/* Account & Data Deletion */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Account & Data Deletion</h2>
            <p className="text-muted-foreground leading-relaxed">
              You may request account deletion at any time. This will remove your personal data from 
              our systems, subject to legal and operational requirements.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Manage your account in the app settings. To manage your subscription, visit the RoadTribe 
              website. For account deletion, either use the option in the settings or send a request 
              to the email below.
            </p>
          </section>

          {/* Contact Support */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Contact Support</h2>
            <p className="text-muted-foreground leading-relaxed">
              For support or account-related inquiries, contact us:
            </p>
            <Button
              asChild
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <a href="mailto:roadtribe@eyemeetslens.com">
                <Mail className="h-4 w-4 mr-2" />
                Email Support
              </a>
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              roadtribe@eyemeetslens.com
            </p>
          </section>

          {/* View on Website */}
          <section className="pt-4 border-t border-border">
            <a 
              href="https://www.roadtribe.io/help-support"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View on website
            </a>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Help;
