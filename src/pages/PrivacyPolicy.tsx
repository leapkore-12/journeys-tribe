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
          <button onClick={goBack} className="text-foreground min-h-11 min-w-11 flex items-center justify-center active:opacity-70">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Privacy Policy</h1>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="px-4 py-6 space-y-6 pb-24">
          {/* Last Updated */}
          <p className="text-sm text-muted-foreground">Last Updated: January 17, 2026</p>

          {/* Introduction */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              RoadTribe ("we," "our," or "us") is a product of EyeMeetsLens Creative Media House. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you use our mobile application.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              By using RoadTribe, you consent to the practices described in this policy. For users in 
              the European Economic Area (EEA), this policy also describes your rights under the 
              General Data Protection Regulation (GDPR).
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

          {/* Lawful Basis for Processing (GDPR) */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Lawful Basis for Processing (GDPR)</h2>
            <p className="text-muted-foreground leading-relaxed">
              For users in the European Economic Area, we process your personal data based on the 
              following legal grounds:
            </p>
            
            <div className="space-y-3 mt-4">
              <div className="bg-secondary/30 p-3 rounded-lg">
                <h3 className="font-medium text-foreground mb-1">Contractual Necessity</h3>
                <p className="text-sm text-muted-foreground">
                  Account creation, trip recording, vehicle management, and social features 
                  (follows, likes, comments) are necessary to provide the RoadTribe service.
                </p>
              </div>
              
              <div className="bg-secondary/30 p-3 rounded-lg">
                <h3 className="font-medium text-foreground mb-1">Consent</h3>
                <p className="text-sm text-muted-foreground">
                  Analytics and usage tracking, marketing communications, and optional location 
                  sharing features require your explicit consent. You can withdraw consent at any 
                  time in Settings.
                </p>
              </div>
              
              <div className="bg-secondary/30 p-3 rounded-lg">
                <h3 className="font-medium text-foreground mb-1">Legitimate Interest</h3>
                <p className="text-sm text-muted-foreground">
                  Security monitoring, fraud prevention, and app performance improvements are 
                  processed under our legitimate interest to maintain a safe and functional service.
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

          {/* Data Retention */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data according to the following schedule:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li><span className="text-foreground">Account data:</span> Retained until you delete your account</li>
              <li><span className="text-foreground">Trip data:</span> Retained until you delete the trip or your account</li>
              <li><span className="text-foreground">Vehicle data:</span> Retained until you delete the vehicle or your account</li>
              <li><span className="text-foreground">System logs:</span> Retained for 90 days for security and debugging</li>
              <li><span className="text-foreground">Crash reports:</span> Retained for 90 days</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              When you delete your account, all your data is permanently removed within 30 days.
            </p>
          </section>

          {/* Your Rights (GDPR) */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Your Rights (GDPR)</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you are located in the European Economic Area, you have the following rights:
            </p>
            
            <div className="space-y-3 mt-4">
              <div className="border-l-2 border-primary pl-3">
                <h3 className="font-medium text-foreground">Right to Access</h3>
                <p className="text-sm text-muted-foreground">
                  You can download a copy of all your data from Settings → Download my data.
                </p>
              </div>
              
              <div className="border-l-2 border-primary pl-3">
                <h3 className="font-medium text-foreground">Right to Rectification</h3>
                <p className="text-sm text-muted-foreground">
                  You can edit your profile, trips, and vehicles at any time in the app.
                </p>
              </div>
              
              <div className="border-l-2 border-primary pl-3">
                <h3 className="font-medium text-foreground">Right to Erasure</h3>
                <p className="text-sm text-muted-foreground">
                  You can delete individual trips or your entire account from Settings → Delete account.
                </p>
              </div>
              
              <div className="border-l-2 border-primary pl-3">
                <h3 className="font-medium text-foreground">Right to Restrict Processing</h3>
                <p className="text-sm text-muted-foreground">
                  You can set your account to private to restrict who can view your content.
                </p>
              </div>
              
              <div className="border-l-2 border-primary pl-3">
                <h3 className="font-medium text-foreground">Right to Data Portability</h3>
                <p className="text-sm text-muted-foreground">
                  Your exported data is provided in JSON format, which can be imported into other services.
                </p>
              </div>
              
              <div className="border-l-2 border-primary pl-3">
                <h3 className="font-medium text-foreground">Right to Object</h3>
                <p className="text-sm text-muted-foreground">
                  You can opt out of analytics and marketing in Settings → Privacy & Data.
                </p>
              </div>
              
              <div className="border-l-2 border-primary pl-3">
                <h3 className="font-medium text-foreground">Right to Withdraw Consent</h3>
                <p className="text-sm text-muted-foreground">
                  You can change your consent preferences at any time in Settings.
                </p>
              </div>
            </div>
          </section>

          {/* Third-Party Services */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Third-Party Services (Data Processors)</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use third-party services to provide RoadTribe:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><span className="text-foreground">Mapbox</span> – Maps, route visualization, and geocoding (USA)</li>
              <li><span className="text-foreground">Cloud infrastructure</span> – Secure data storage and backend services (EU/USA)</li>
              <li><span className="text-foreground">Payment processors</span> – Handling premium subscriptions (when applicable)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              These services operate under their own privacy policies and are bound by data processing 
              agreements that ensure GDPR compliance.
            </p>
          </section>

          {/* International Data Transfers */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data may be transferred to and processed in countries outside the EEA. We ensure 
              adequate protection through Standard Contractual Clauses (SCCs) or other approved 
              transfer mechanisms as required by GDPR.
            </p>
          </section>

          {/* Data Security */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to protect your data, 
              including encryption of data in transit (TLS) and at rest, secure authentication systems, 
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
              app and/or on our website. For material changes affecting your rights, we will notify 
              you via email or in-app notification. Continued use of RoadTribe after changes constitutes 
              your acceptance of the updated policy.
            </p>
          </section>

          {/* Data Protection Officer */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, wish to exercise your GDPR rights, 
              or have concerns about how we handle your data, please contact us:
            </p>
            <a 
              href="mailto:roadtribe@eyemeetslens.com"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              roadtribe@eyemeetslens.com
            </a>
            <p className="text-muted-foreground leading-relaxed mt-2">
              You also have the right to lodge a complaint with your local data protection authority 
              if you believe your rights have been violated.
            </p>
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
