import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MobileContainer from "./components/layout/MobileContainer";
import MainLayout from "./components/layout/MainLayout";
import { TripProvider } from "./context/TripContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import Search from "./pages/Search";
import Notifications from "./pages/Notifications";
import Comments from "./pages/Comments";
import Share from "./pages/Share";
import TripPlanner from "./pages/TripPlanner";
import TripReview from "./pages/TripReview";
import ActiveTrip from "./pages/ActiveTrip";
import TripPaused from "./pages/TripPaused";
import TripReached from "./pages/TripReached";
import PostTrip from "./pages/PostTrip";
import TripComplete from "./pages/TripComplete";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Garage from "./pages/Garage";
import EditVehicle from "./pages/EditVehicle";
import Settings from "./pages/Settings";
import ManageConnections from "./pages/ManageConnections";
import ManageTribe from "./pages/ManageTribe";
import EditProfile from "./pages/EditProfile";
import ChangeCredentials from "./pages/ChangeCredentials";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import JoinConvoy from "./pages/JoinConvoy";
import NotFound from "./pages/NotFound";

import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import CreateUser from "./pages/admin/CreateUser";
import EditUser from "./pages/admin/EditUser";
import TripDetail from "./pages/TripDetail";
import EditTrip from "./pages/EditTrip";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Help from "./pages/Help";
import Subscription from "./pages/Subscription";
import BlockedAccounts from "./pages/BlockedAccounts";
import { initCapacitor } from "@/lib/capacitor-init";

const queryClient = new QueryClient();

const App = () => {
  // Initialize Capacitor plugins (StatusBar for iOS safe area)
  useEffect(() => {
    initCapacitor();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <AuthProvider>
          <TripProvider>
            <div className="dark">
              <Toaster />
              <Sonner />
              <MobileContainer>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Splash />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  
                  {/* Protected Routes - Main App with Bottom Navigation */}
                  <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                    <Route path="/feed" element={<Feed />} />
                    <Route path="/trip" element={<TripPlanner />} />
                    <Route path="/profile" element={<Profile />} />
                  </Route>
                  
                  {/* Protected Routes - Trip Flow */}
                  <Route path="/trip/review" element={<ProtectedRoute><TripReview /></ProtectedRoute>} />
                  <Route path="/trip/active" element={<ProtectedRoute><ActiveTrip /></ProtectedRoute>} />
                  <Route path="/trip/paused" element={<ProtectedRoute><TripPaused /></ProtectedRoute>} />
                  <Route path="/trip/reached" element={<ProtectedRoute><TripReached /></ProtectedRoute>} />
                  <Route path="/trip/post" element={<ProtectedRoute><PostTrip /></ProtectedRoute>} />
                  <Route path="/trip/complete" element={<ProtectedRoute><TripComplete /></ProtectedRoute>} />
                  
                  {/* Protected Routes - Standalone Pages */}
                  <Route path="/join-convoy/:inviteCode" element={<ProtectedRoute><JoinConvoy /></ProtectedRoute>} />
                  <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                  <Route path="/trip/:tripId" element={<ProtectedRoute><TripDetail /></ProtectedRoute>} />
                  <Route path="/trip/:tripId/edit" element={<ProtectedRoute><EditTrip /></ProtectedRoute>} />
                  <Route path="/comments/:postId" element={<ProtectedRoute><Comments /></ProtectedRoute>} />
                  <Route path="/share/:postId" element={<ProtectedRoute><Share /></ProtectedRoute>} />
                  <Route path="/user/:userId" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                  <Route path="/garage" element={<ProtectedRoute><Garage /></ProtectedRoute>} />
                  <Route path="/garage/edit/:id?" element={<ProtectedRoute><EditVehicle /></ProtectedRoute>} />
                  <Route path="/manage-followers" element={<ProtectedRoute><ManageConnections /></ProtectedRoute>} />
                  <Route path="/manage-tribe" element={<ProtectedRoute><ManageTribe /></ProtectedRoute>} />
                  <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/settings/credentials" element={<ProtectedRoute><ChangeCredentials /></ProtectedRoute>} />
                  <Route path="/privacy" element={<ProtectedRoute><PrivacyPolicy /></ProtectedRoute>} />
                  <Route path="/terms" element={<ProtectedRoute><TermsOfService /></ProtectedRoute>} />
                  <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
                  <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
                  <Route path="/blocked-accounts" element={<ProtectedRoute><BlockedAccounts /></ProtectedRoute>} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                  <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                  <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
                  <Route path="/admin/users/new" element={<AdminRoute><CreateUser /></AdminRoute>} />
                  <Route path="/admin/users/:id" element={<AdminRoute><EditUser /></AdminRoute>} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MobileContainer>
            </div>
          </TripProvider>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
  );
};

export default App;
