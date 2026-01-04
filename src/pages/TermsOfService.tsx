import { ArrowLeft, ExternalLink, Mail } from 'lucide-react';
import { useSmartBack } from '@/hooks/useSmartBack';
import { ScrollArea } from '@/components/ui/scroll-area';

const TermsOfService = () => {
  const goBack = useSmartBack('/settings');

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={goBack} className="text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Terms of Service</h1>
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
              Welcome to RoadTribe, a product of EyeMeetsLens Creative Media House ("Company," "we," 
              "our," or "us"). By accessing or using RoadTribe ("the App"), you agree to be bound by 
              these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use 
              the App.
            </p>
          </section>

          {/* Eligibility */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Eligibility</h2>
            <p className="text-muted-foreground leading-relaxed">
              You must be at least 18 years of age to use RoadTribe. By using the App, you represent 
              and warrant that you are at least 18 years old and have the legal capacity to enter into 
              these Terms.
            </p>
          </section>

          {/* User Accounts */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and 
              for all activities that occur under your account. You agree to notify us immediately of 
              any unauthorized use of your account.
            </p>
          </section>

          {/* User Content */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">User Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              RoadTribe allows users to create and share content including trips, photos, and comments 
              ("User Content"). You retain ownership of your User Content.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              By submitting User Content, you grant RoadTribe a non-exclusive, royalty-free, worldwide, 
              sublicensable license to use, display, reproduce, and distribute your User Content in 
              connection with operating and promoting the App.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You represent and warrant that you own or have the necessary rights to the User Content 
              you submit and that it does not violate any third-party rights.
            </p>
          </section>

          {/* Acceptable Use */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Post illegal, harmful, or offensive content</li>
              <li>Impersonate others or misrepresent your identity</li>
              <li>Use the App for commercial purposes without authorization</li>
              <li>Attempt to interfere with the proper functioning of the App</li>
              <li>Violate any applicable local, national, or international law</li>
            </ul>
          </section>

          {/* Moderation and Enforcement */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Moderation and Enforcement</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to remove or disable access to any User Content that violates these 
              Terms, and to suspend or terminate accounts of repeat or serious violators without notice.
            </p>
          </section>

          {/* Premium Features */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Premium Features</h2>
            <p className="text-muted-foreground leading-relaxed">
              RoadTribe may offer premium subscriptions with additional features. Subscription fees 
              are billed in advance and are non-refundable unless otherwise required by law. Features 
              and pricing may change at any time. Subscriptions are managed through the App Store or 
              Google Play, as applicable.
            </p>
          </section>

          {/* Disclaimers */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Disclaimers</h2>
            <p className="text-muted-foreground leading-relaxed">
              RoadTribe is provided "as is" and "as available." We do not guarantee uninterrupted or 
              error-free operation of the App. We are not responsible for any loss of data, travel 
              decisions, or outcomes resulting from your use of the App.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the fullest extent permitted by law, EyeMeetsLens Creative Media House shall not be 
              liable for any indirect, incidental, special, consequential, or punitive damages arising 
              from your use of RoadTribe.
            </p>
          </section>

          {/* Governing Law */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of India. 
              Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of 
              the courts located in India.
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms from time to time. Continued use of RoadTribe after changes 
              constitutes acceptance of the revised Terms. We encourage you to review these Terms 
              periodically.
            </p>
          </section>

          {/* Contact Us */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please contact us:
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
              href="https://www.roadtribe.io/terms-of-service"
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

export default TermsOfService;
