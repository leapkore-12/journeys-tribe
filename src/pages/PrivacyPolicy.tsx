import { ArrowLeft, ExternalLink, Mail } from 'lucide-react';
import { useSmartBack } from '@/hooks/useSmartBack';
import { ScrollArea } from '@/components/ui/scroll-area';

const PrivacyPolicy = () => {
  const goBack = useSmartBack('/settings');

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={goBack} className="text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Privacy Policy</h1>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="px-4 py-6 space-y-6 pb-24">
          {/* Last Updated */}
          <p className="text-sm text-muted-foreground">Last Updated: January 02, 2026</p>

          {/* Introduction */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              RoadTribe ("we," "our," or "us") is a product of EyeMeetsLens Creative Media House. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you use our mobile application.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              By using RoadTribe, you consent to the practices described in this policy.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Information We Collect</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-foreground mb-1">Account Information</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Email address (for authentication and communication), display name, username, 
                  profile photo (optional), and bio (optional).
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-foreground mb-1">User Content</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Trip data (start/end locations, routes, timestamps), photos uploaded to trips, 
                  vehicle details (make, model, year, name), and comments.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-foreground mb-1">Location Data</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Real-time GPS location (only while recording a trip or using convoy features), 
                  and trip routes and destination data.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-foreground mb-1">Usage Data</h3>
                <p className="text-muted-foreground leading-relaxed">
                  App interaction logs, device type and operating system, and crash reports.
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">How We Use Your Information</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>To provide and operate the app's features</li>
              <li>To record, store, and share your trip data based on your settings</li>
              <li>To allow real-time location sharing with convoy members (if enabled)</li>
              <li>To communicate with you about your account or support requests</li>
              <li>To monitor and improve app performance</li>
              <li>To enforce our Terms of Service</li>
            </ul>
          </section>

          {/* Location Data */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Location Data</h2>
            <p className="text-muted-foreground leading-relaxed">
              Location access is required for core trip-related features. We only access your location 
              when recording a trip or using convoy/live-tracking features. You can revoke location 
              access through your device settings at any time. We do not sell or share your location 
              data with advertisers.
            </p>
          </section>

          {/* Third-Party Services */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use third-party services for specific purposes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><span className="text-foreground">Mapbox</span> – for maps, route visualization, and geocoding</li>
              <li><span className="text-foreground">Cloud infrastructure providers</span> – for secure data storage and backend services</li>
              <li><span className="text-foreground">Payment processors</span> – for handling premium subscriptions (when applicable)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              These services operate under their own privacy policies.
            </p>
          </section>

          {/* Data Retention and Control */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Data Retention and Control</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data as long as your account is active. You may delete individual 
              trips at any time, and you may request full account deletion, which will permanently 
              remove your data. Requests for account deletion can be made through the app or by 
              contacting us directly.
            </p>
          </section>

          {/* Data Security */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to protect your data, 
              including encryption of data in transit and at rest, secure authentication systems, 
              and access controls. However, no system is completely secure, and we cannot guarantee 
              absolute data security.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              RoadTribe is intended for users aged 18 and above. We do not knowingly collect personal 
              information from minors. If we learn that we have collected data from a child, we will 
              delete it promptly.
            </p>
          </section>

          {/* Changes to This Privacy Policy */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. Changes will be posted within the 
              app and/or on our website. Continued use of RoadTribe after changes constitutes your 
              acceptance of the updated policy.
            </p>
          </section>

          {/* Contact Us */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions or concerns about this Privacy Policy, please contact us:
            </p>
            <a 
              href="mailto:roadtribe@eyemeetslens.com"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              roadtribe@eyemeetslens.com
            </a>
          </section>

          {/* View on Website */}
          <section className="pt-4 border-t border-border">
            <a 
              href="https://www.roadtribe.io/privacy-policy"
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

export default PrivacyPolicy;
