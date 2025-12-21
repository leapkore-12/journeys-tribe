import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MobileContainer from "./components/layout/MobileContainer";
import MainLayout from "./components/layout/MainLayout";
import { TripProvider } from "./context/TripContext";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <TripProvider>
          <div className="dark">
            <Toaster />
            <Sonner />
            <MobileContainer>
              <Routes>
                {/* Entry Flow */}
                <Route path="/" element={<Splash />} />
                <Route path="/login" element={<Login />} />
                
                {/* Main App with Bottom Navigation */}
                <Route element={<MainLayout />}>
                  <Route path="/feed" element={<Feed />} />
                  <Route path="/trip" element={<TripPlanner />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>
                
                {/* Trip Flow */}
                <Route path="/trip/review" element={<TripReview />} />
                <Route path="/trip/active" element={<ActiveTrip />} />
                <Route path="/trip/paused" element={<TripPaused />} />
                <Route path="/trip/reached" element={<TripReached />} />
                <Route path="/trip/post" element={<PostTrip />} />
                <Route path="/trip/complete" element={<TripComplete />} />
                
                {/* Standalone Pages */}
                <Route path="/search" element={<Search />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/comments/:postId" element={<Comments />} />
                <Route path="/share/:postId" element={<Share />} />
                <Route path="/user/:userId" element={<UserProfile />} />
                <Route path="/garage" element={<Garage />} />
                <Route path="/garage/edit/:id?" element={<EditVehicle />} />
                <Route path="/settings" element={<Settings />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </MobileContainer>
          </div>
        </TripProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
