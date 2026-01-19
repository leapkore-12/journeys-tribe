import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const ChangeCredentials = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isSendingResetLink, setIsSendingResetLink] = useState(false);

  const handleEmailChange = async () => {
    setEmailError('');

    // Validate email
    const emailValidation = emailSchema.safeParse(newEmail);
    if (!emailValidation.success) {
      setEmailError(emailValidation.error.errors[0].message);
      return;
    }

    if (newEmail === user?.email) {
      setEmailError('New email must be different from current email');
      return;
    }

    setIsChangingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;

      toast({
        title: 'Confirmation email sent',
        description: 'Please check your new email inbox to confirm the change.',
      });
      setNewEmail('');
    } catch (error: any) {
      toast({
        title: 'Failed to update email',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');

    // Validate new password
    const passwordValidation = passwordSchema.safeParse(newPassword);
    if (!passwordValidation.success) {
      setPasswordError(passwordValidation.error.errors[0].message);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }

    setIsChangingPassword(true);
    try {
      // First verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        setPasswordError('Current password is incorrect');
        setIsChangingPassword(false);
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Failed to update password',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleForgotCurrentPassword = async () => {
    if (!user?.email) {
      toast({
        title: 'Unable to send reset link',
        description: 'No email address found for your account.',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingResetLink(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: 'Reset link sent',
        description: 'Check your email inbox for a link to reset your password.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to send reset link',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSendingResetLink(false);
    }
  };

  return (
    <div className="flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate('/settings')} className="text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Account Security</h1>
        </div>
      </header>

      <div className="flex-1 px-4 py-6 space-y-8">
        {/* Current Email Display */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-sm">Current email</Label>
          <p className="text-foreground">{user?.email}</p>
        </div>

        {/* Change Email Section */}
        <div className="space-y-4 pb-6 border-b border-border">
          <h2 className="text-foreground font-medium">Change Email</h2>
          <div className="space-y-2">
            <Label htmlFor="newEmail" className="text-muted-foreground text-sm">
              New email address
            </Label>
            <Input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                setEmailError('');
              }}
              placeholder="Enter new email"
              className="bg-secondary border-border text-foreground"
            />
            {emailError && (
              <p className="text-xs text-destructive">{emailError}</p>
            )}
          </div>
          <Button
            onClick={handleEmailChange}
            disabled={isChangingEmail || !newEmail}
            className="w-full"
          >
            {isChangingEmail ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Email'
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            A confirmation link will be sent to your new email address.
          </p>
        </div>

        {/* Change Password Section */}
        <div className="space-y-4">
          <h2 className="text-foreground font-medium">Change Password</h2>
          
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-muted-foreground text-sm">
              Current password
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder="Enter current password"
                className="bg-secondary border-border text-foreground pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button
              type="button"
              onClick={handleForgotCurrentPassword}
              disabled={isSendingResetLink}
              className="text-xs text-primary hover:underline disabled:opacity-50"
            >
              {isSendingResetLink ? 'Sending...' : 'Forgot your current password?'}
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-muted-foreground text-sm">
              New password
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder="Enter new password"
                className="bg-secondary border-border text-foreground pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-muted-foreground text-sm">
              Confirm new password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder="Confirm new password"
                className="bg-secondary border-border text-foreground pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {passwordError && (
            <p className="text-xs text-destructive">{passwordError}</p>
          )}

          <Button
            onClick={handlePasswordChange}
            disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="w-full"
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Password'
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Password must be at least 6 characters long.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChangeCredentials;
