import React, { useState, useRef, useEffect } from "react";
import { View, StatusBar, Alert, BackHandler, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as NavigationBar from "expo-navigation-bar";
import theme from "./app/theme";

import SplashScreen from "./app/screens/SplashScreen";
import OnboardingScreen from "./app/screens/OnboardingScreen";

import CreateAccountChoiceScreen from "./app/screens/CreateAccountChoiceScreen";

import PhoneRegisterScreen from "./app/screens/PhoneRegisterScreen";
import SignInScreen from "./app/screens/SignInScreen";
import FundiProfileSetupScreen from "./app/screens/FundiProfileSetupScreen";
import OtpScreen from "./app/screens/OtpScreen";
import LocationPermissionScreen from "./app/screens/LocationPermissionScreen";
import SetLocationScreen from "./app/screens/SetLocationScreen";
import HomeScreen from "./app/screens/HomeScreen";
import BrowseArtisansScreen from "./app/screens/BrowseArtisansScreen";
import FundiDashboardScreen from "./app/screens/FundiDashboardScreen";
import ArtisanProfileScreen from "./app/screens/ArtisanProfileScreen";
import RequestServiceScreen from "./app/screens/RequestServiceScreen";
import PaymentScreen from "./app/screens/PaymentScreen";
import BookingConfirmationScreen from "./app/screens/BookingConfirmationScreen";
import LiveTrackingScreen from "./app/screens/LiveTrackingScreen";
import JobInProgressScreen from "./app/screens/JobInProgressScreen";
import RateExperienceScreen from "./app/screens/RateExperienceScreen";
import BookingHistoryScreen from "./app/screens/BookingHistoryScreen";
import BookingsScreen from "./app/screens/BookingsScreen";
import ChatScreen from "./app/screens/ChatScreen";
import NotificationsScreen from "./app/screens/NotificationsScreen";
import ProfileScreen from "./app/screens/ProfileScreen";
import EditProfileScreen from "./app/screens/EditProfileScreen";
import SettingsScreen from "./app/screens/SettingsScreen";
import PaymentMethodsScreen from "./app/screens/PaymentMethodsScreen";
import HelpSupportScreen from "./app/screens/HelpSupportScreen";
import WalletHomeScreen from "./app/screens/WalletHomeScreen";
import DepositScreen from "./app/screens/DepositScreen";
import WithdrawScreen from "./app/screens/WithdrawScreen";
import TransactionHistoryScreen from "./app/screens/TransactionHistoryScreen";
import TransferScreen from "./app/screens/TransferScreen";
import {
  sendOtp,
  verifyOtpRegister,
  verifyOtpLogin,
  applyAuthSession,
  clearAuthSession,
  restoreAuthSession,
  getErrorMessage,
  normalizeUgandaPhone,
} from "./services/authApi";
import { setAuthToken as setApiAuthToken } from "./services/api";
import {
  createReview,
  updateReview,
  getMyReviews,
  getErrorMessage as reviewError,
} from "./services/reviewsApi";
import { updateJobStatus } from "./services/jobsApi";
import { defaultActiveJob, buildBookingFromRequest } from "./app/utils/ratings";
import BookingSubmittedScreen from "./app/screens/BookingSubmittedScreen";
import BookingWaitingScreen from "./app/screens/BookingWaitingScreen";
import FundiBookingDetailScreen from "./app/screens/FundiBookingDetailScreen";
import SkillsPortfolioScreen from "./app/screens/SkillsPortfolioScreen";
import BottomNav from "./app/components/BottomNav";
import { LocationProvider, useLocation } from "./context/LocationContext";
import { BookingProvider } from "./context/BookingContext";
import { ChatProvider } from "./context/ChatContext";

/** Screens only clients should use (browse, book, pay). */

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
const CLIENT_ONLY_SCREENS = new Set([
  "home",
  "browse",
  "artisan",
  "request",
  "bookingSubmitted",
  "bookingWaiting",
  "payment",
  "confirm",
  "tracking",
  "jobInProgress",
  "rateExperience",
  "bookingHistory",
]);

function AppContent() {
  const [screen, setScreen] = useState("splash");
  const [userRole, setUserRole] = useState("customer");
  const [userName, setUserName] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [pendingRole, setPendingRole] = useState("customer");
  const [selectedRole, setSelectedRole] = useState("");
  const [googleNewUserProfile, setGoogleNewUserProfile] = useState(null);
  const [googleNewUserOrigin, setGoogleNewUserOrigin] = useState("signin");

  const [signupData, setSignupData] = useState(null);
  const [otpPurpose, setOtpPurpose] = useState("register");
  const [otpPhone, setOtpPhone] = useState("");
  const [otpExpiresIn, setOtpExpiresIn] = useState(600);
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [browseCategory, setBrowseCategory] = useState("all");
  const [selectedArtisan, setSelectedArtisan] = useState(null);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [activeJob, setActiveJob] = useState(null);
  const [reviewHistory, setReviewHistory] = useState([]);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState("");
  // simple navigation history stack (stores previous screen keys)
  const historyRef = useRef([]);
  const { ensureLocationForLogin, setAuthTokenForSync, coords } = useLocation();
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [clientBookingDraft, setClientBookingDraft] = useState(null);
  const [chatTargetUserId, setChatTargetUserId] = useState(null);

  // push current screen into history and navigate
  const pushAndNavigate = (next) => {
    // don't push if same as current
    if (screen && screen !== next) {
      historyRef.current.push(screen);
    }
    setScreen(next);
  };

  const goHome = (role = userRole) => {
    // reset history when going to home/dashboard
    historyRef.current = [];
    setScreen(role === "fundi" ? "fundiDashboard" : "home");
  };

  const handleLogout = async () => {
    // Clear API token and local auth state
    try {
      await clearAuthSession();
      setApiAuthToken("");
    } catch (e) {
      // ignore
    }
    setAuthToken("");
    setAuthTokenForSync("");
    setUserName("");
    setUserFullName("");
    setUserEmail("");
    setUserId("");
    setUserRole("customer");
    historyRef.current = [];
    setScreen("onboarding");
  };

  const proceedAfterLogin = async (data, role) => {
    if (role === "fundi" && !data.user?.onboardingComplete) {
      setScreen("fundiProfileSetup");
      return;
    }
    setScreen("locationPermission");
  };

  const afterAuth = async (data) => {
    const role = await applySession(data);
    setAuthTokenForSync(data.token || "");
    const locationOk = await ensureLocationForLogin();
    if (!locationOk) {
      Alert.alert(
        "Location required",
        "FundiLink needs location access to show nearby services.",
      );
      handleLogout();
      return role;
    }
    await proceedAfterLogin(data, role);
    return role;
  };

  const applySession = async (data) => {
    await applyAuthSession(data);
    setAuthToken(data.token || "");
    setUserId(data.user?.id || data.user?._id || "");
    setUserName(
      data.user?.firstName || data.user?.name?.split(" ")[0] || "User",
    );
    setUserFullName(data.user?.name || "");
    setUserEmail(data.user?.email || "");
    const role = data.user?.role || "customer";
    setUserRole(role);
    return role;
  };

  const handleNavigate = (key, params) => {
    if (userRole === "fundi" && CLIENT_ONLY_SCREENS.has(key)) {
      Alert.alert(
        "Client feature",
        "Browsing artisans and booking jobs are for clients. Use your Fundi dashboard and Jobs tab.",
      );
      return;
    }
    if (userRole === "customer" && key === "fundiDashboard") {
      return setScreen("home");
    }

    if (key === "home") return goHome();
    if (key === "fundiDashboard") return pushAndNavigate("fundiDashboard");
    if (key === "browse") {
      if (params?.category) setBrowseCategory(params.category);
      return pushAndNavigate("browse");
    }
    if (key === "bookings") return setScreen("bookings");
    if (key === "profile") return setScreen("profile");
    if (key === "chat") {
      if (params?.targetUserId) setChatTargetUserId(params.targetUserId);
      return setScreen("chat");
    }
    if (key === "notifications") return setScreen("notifications");
    if (key === "editProfile") return setScreen("editProfile");
    if (key === "skillsPortfolio") return setScreen("skillsPortfolio");
    if (key === "settings") return setScreen("settings");
    if (key === "payments") return setScreen("payments");
    if (key === "wallet") return setScreen("wallet");
    if (key === "deposit") return setScreen("deposit");
    if (key === "withdraw") return setScreen("withdraw");
    if (key === "transfer") return setScreen("transfer");
    if (key === "transactionHistory") return setScreen("transactionHistory");
    if (key === "help") return setScreen("help");
    if (key === "createAccount") return setScreen("createAccount");
    if (key === "signIn") {
      if (!selectedRole) {
        setSelectedRole("client");
        setPendingRole("client");
      }
      return setScreen("signIn");
    }
    if (key === "tracking") return pushAndNavigate("tracking");
    if (key === "jobInProgress") {
      if (params?.job) setActiveJob(params.job);
      else if (!activeJob) {
        setActiveJob(defaultActiveJob(pendingBooking, selectedArtisan || {}));
      }
      return pushAndNavigate("jobInProgress");
    }
    if (key === "rateExperience") {
      if (params?.review) setEditingReview(params.review);
      if (params?.job) setActiveJob(params.job);
      return pushAndNavigate("rateExperience");
    }
    if (key === "bookingHistory") return pushAndNavigate("bookingHistory");
    if (key === "payment") {
      if (params?.booking) {
        setPendingBooking(params.booking);
        setActiveJob(
          defaultActiveJob(
            params.booking,
            params.booking.artisan || selectedArtisan || {},
          ),
        );
      }
      return pushAndNavigate("payment");
    }

    if (key === "book") return pushAndNavigate("request");
    if (key === "artisan") {
      if (params?.artisan) setSelectedArtisan(params.artisan);
      return pushAndNavigate("artisan");
    }
    if (key === "request") {
      if (params?.artisan) setSelectedArtisan(params.artisan);
      return pushAndNavigate("request");
    }
    if (key === "confirm") {
      if (params?.booking) setPendingBooking(params.booking);
      setActiveJob(
        defaultActiveJob(
          params?.booking || pendingBooking,
          selectedArtisan || {},
        ),
      );
      return pushAndNavigate("confirm");
    }
    if (key === "bookingSubmitted") {
      if (params?.booking) {
        setClientBookingDraft(params.booking);
        setPendingBooking(params.booking);
      }
      return pushAndNavigate("bookingSubmitted");
    }
    if (key === "bookingWaiting") {
      if (params?.booking) {
        setClientBookingDraft(params.booking);
        setPendingBooking(params.booking);
      }
      return pushAndNavigate("bookingWaiting");
    }
    if (key === "fundiBookingDetail") {
      if (params?.bookingId) setSelectedBookingId(params.bookingId);
      return pushAndNavigate("fundiBookingDetail");
    }
  };

  const bookingWrap = (el) => (
    <BookingProvider
      userId={userId}
      authToken={authToken}
      userRole={userRole}
      fundiCoords={coords}
      onNavigate={handleNavigate}
    >
      {el}
    </BookingProvider>
  );

  // Bottom tab bar layout: content on top, dark navbar pinned to the bottom.
  const tabLayout = (el, active) => (
    <View style={{ flex: 1 }}>
      {el}
      <BottomNav
        active={active}
        onNavigate={(key) => {
          if (key === "home") {
            goHome();
            return;
          }
          historyRef.current = [];
          setScreen(key);
        }}
      />
    </View>
  );

  // Clear chat target when leaving chat screen
  useEffect(() => {
    if (screen !== "chat") setChatTargetUserId(null);
  }, [screen]);

  // Make the Android system navigation bar dark so no light strip shows
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync("#000000");
      NavigationBar.setButtonStyleAsync("light");
    }
  }, []);

  // Handle Android hardware back button by popping history
  useEffect(() => {
    const onBackPress = () => {
      const h = historyRef.current;
      if (h.length === 0) {
        // if at root screens like home/onboarding/splash, let system handle it (exit)
        if (
          screen === "home" ||
          screen === "fundiDashboard" ||
          screen === "onboarding" ||
          screen === "splash" ||
          screen === "createAccount" ||
          screen === "signIn"
        ) {
          return false; // allow default behavior
        }
        // otherwise, go home
        goHome();
        return true;
      }
      const prev = h.pop();
      historyRef.current = h;
      setScreen(prev || "home");
      return true; // handled
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => {
      // use the subscription remove() method which is the supported API
      if (sub && typeof sub.remove === "function") sub.remove();
    };
  }, [screen]);

  const handleJobComplete = async (job) => {
    const completed = {
      ...job,
      status: "completed",
      releasedAt: Date.now(),
    };
    setActiveJob(completed);

    if (authToken && job.id && !String(job.id).startsWith("demo")) {
      try {
        await updateJobStatus(job.id, "completed");
      } catch {
        /* demo/offline — continue flow */
      }
    }

    setEditingReview(null);
    pushAndNavigate("rateExperience");
  };

  const handleReviewSubmit = async ({
    rating,
    comment,
    photoUrls,
    reviewId,
  }) => {
    const job = activeJob || defaultActiveJob(pendingBooking, selectedArtisan);
    const payload = {
      fundiId: job.fundiId,
      rating,
      comment,
      photoUrls,
      jobId: String(job.id).startsWith("demo") ? undefined : job.id,
      service: job.service,
      amount: job.amount,
    };

    let saved;
    try {
      if (authToken) {
        const isLocal = (id) =>
          !id ||
          String(id).startsWith("demo") ||
          String(id).startsWith("local-");
        if (reviewId && !isLocal(reviewId)) {
          const { data } = await updateReview(reviewId, {
            rating,
            comment,
            photoUrls,
          });
          saved = data;
        } else if (!reviewId) {
          const { data } = await createReview(payload);
          saved = data;
        }
      }
    } catch (error) {
      Alert.alert("Review not saved", reviewError(error));
      return;
    }

    const entry = {
      id: saved?._id || reviewId || `local-${Date.now()}`,
      reviewId: saved?._id || reviewId || `local-${Date.now()}`,
      fundiName: job.fundiName,
      service: job.service,
      amount: job.amount,
      date: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      rating,
      comment,
      photoUrls,
      job,
    };

    setReviewHistory((prev) => {
      const idx = prev.findIndex(
        (b) => b.reviewId === entry.reviewId || b.id === entry.id,
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...entry };
        return next;
      }
      return [entry, ...prev.filter((b) => b.id !== "past-1")];
    });

    setReviewSuccessMessage(
      `Your review for ${job.fundiName.split(" ")[0]} was submitted.`,
    );
    setEditingReview(null);
    pushAndNavigate("bookingHistory");
  };

  const loadReviewHistory = async () => {
    if (!authToken) return;
    try {
      const { data } = await getMyReviews();
      if (Array.isArray(data) && data.length) {
        setReviewHistory(
          data.map((r) => ({
            id: r._id,
            reviewId: r._id,
            fundiName: r.fundiId?.name || "Fundi",
            service: r.service || "Service",
            amount: r.amount || 0,
            date: r.createdAt,
            rating: r.rating,
            comment: r.comment,
            photoUrls: r.photoUrls || [],
            fundiId: r.fundiId?._id || r.fundiId,
          })),
        );
      }
    } catch {
      /* keep local/demo history */
    }
  };

  useEffect(() => {
    if (authToken) loadReviewHistory();
  }, [authToken]);

  // Re-hydrate auth after reloads when AsyncStorage still has a valid token
  useEffect(() => {
    if (authToken) return;
    let cancelled = false;
    (async () => {
      const session = await restoreAuthSession();
      if (cancelled || !session?.user) return;
      await applySession(session);
      setAuthTokenForSync(session.token);
    })();
    return () => {
      cancelled = true;
    };
  }, [authToken]);

  const tabProps = {
    userRole,
    userName,
    userFullName,
    userEmail,
    userId,
    authToken,
    onNavigate: handleNavigate,
    activeJob,
  };
  const tabPropsWithLogout = { ...tabProps, onLogout: handleLogout };

  if (screen === "splash") {
    return (
      <SplashScreen
        onFinish={async () => {
          try {
            const session = await restoreAuthSession();
            if (session?.user) {
              const role = await applySession(session);
              setAuthTokenForSync(session.token);
              goHome(role);
              return;
            }
          } catch {
            /* show onboarding */
          }
          setScreen("onboarding");
        }}
      />
    );
  }

  if (screen === "onboarding") {
    return (
      <OnboardingScreen
        onSelectRole={(role) => {
          setSelectedRole(role === "customer" ? "client" : role);
          setPendingRole(role === "customer" ? "client" : role);
          setGoogleNewUserProfile(null);
          setGoogleNewUserOrigin("signin");
          setScreen("signIn");
        }}
        onSignIn={() => setScreen("signIn")}
        onSkip={() => setScreen("browse")}
      />
    );
  }

  if (screen === "createAccountChoice") {
    if (!selectedRole) return setScreen("onboarding");
    return (
      <CreateAccountChoiceScreen
        role={selectedRole}
        initialProfile={googleNewUserProfile || null}
        onBack={() => setScreen("signIn")}
        onPhoneContinue={({ firstName, lastName, email, role }) => {
          setSignupData({
            role: role || selectedRole,
            firstName,
            lastName,
            email,
            name: `${firstName || ""} ${lastName || ""}`.trim(),
          });
          setOtpPurpose("register");
          setScreen("phoneRegister");
        }}
        onGoogleContinue={({ firstName, lastName, email, role }) => {
          setSignupData({
            role: role || selectedRole,
            firstName,
            lastName,
            email,
            name: `${firstName || ""} ${lastName || ""}`.trim(),
          });

          // Preserve captured fields, then start Google OAuth.
          setGoogleNewUserProfile({ firstName, lastName, email });
          setGoogleNewUserOrigin("createAccountChoice");
          setScreen("signIn");
        }}
      />
    );
  }

  if (screen === "createAccount") {
    // CreateAccountScreen.js is the ConfirmDetails UI.
    if (!selectedRole) return setScreen("onboarding");
    return (
      <CreateAccountScreen
        role={selectedRole}
        googleProfile={googleNewUserProfile || {}}
        onBack={() =>
          setScreen(
            googleNewUserOrigin === "createAccountChoice"
              ? "createAccountChoice"
              : "signIn",
          )
        }
        onConfirm={async (profile) => {
          const { registerAccount } = await import("./services/authApi");
          const { data } = await registerAccount(profile);
          await afterAuth(data);
        }}
      />
    );
  }

  if (screen === "phoneRegister") {
    return (
      <PhoneRegisterScreen
        submitting={signupSubmitting}
        onSend={async (phone) => {
          try {
            setSignupSubmitting(true);
            const normalized = normalizeUgandaPhone(phone);
            setOtpPhone(normalized);
            const { data: otpRes } = await sendOtp(normalized, "register");
            setOtpExpiresIn(otpRes.expiresIn || 600);
            if (otpRes.devCode)
              Alert.alert("Dev OTP", `Your code is: ${otpRes.devCode}`);
            setScreen("otp");
          } catch (error) {
            Alert.alert("Could not send OTP", getErrorMessage(error));
          } finally {
            setSignupSubmitting(false);
          }
        }}
      />
    );
  }

  if (screen === "signIn") {
    // hard safety: do not allow reaching sign-in without role selected
    if (!selectedRole) {
      return (
        <OnboardingScreen
          onSelectRole={(role) => {
            setSelectedRole(role === "customer" ? "client" : role);
            setPendingRole(role === "customer" ? "client" : role);
            setGoogleNewUserProfile(null);
            setGoogleNewUserOrigin("signin");
            setScreen("signIn");
          }}
          onSignIn={() => setScreen("signIn")}
          onSkip={() => setScreen("browse")}
        />
      );
    }
    return (
      <SignInScreen
        role={selectedRole}
        onBack={() => setScreen("onboarding")}
        onCreateAccount={() => setScreen("createAccountChoice")}
        onGoogleNewUser={({ role, googleProfile }) => {
          if (!role) {
            setSelectedRole("");
            setScreen("onboarding");
            return;
          }
          setSelectedRole(role === "customer" ? "client" : role);
          setGoogleNewUserProfile({
            firstName: googleProfile?.firstName,
            lastName: googleProfile?.lastName,
            email: googleProfile?.email,
          });
          setGoogleNewUserOrigin("signin");
          setScreen("createAccount");
        }}
        onPhoneOtp={async ({ phone }) => {
          if (!selectedRole) {
            setScreen("onboarding");
            return;
          }

          try {
            setOtpPurpose("login");
            const normalized = normalizeUgandaPhone(phone);
            setOtpPhone(normalized);
            const { data } = await sendOtp(normalized, "login");
            setOtpExpiresIn(data.expiresIn || 600);
            if (data.devCode)
              Alert.alert("Dev OTP", `Your code is: ${data.devCode}`);
            setScreen("otp");
          } catch (error) {
            Alert.alert("Could not send OTP", getErrorMessage(error));
          }
        }}
        onLoggedIn={async (data) => {
          const role = await applySession(data);

          setAuthTokenForSync(data.token || "");
          const locationOk = await ensureLocationForLogin();
          if (!locationOk) {
            Alert.alert(
              "Location required",
              "FundiLink needs location access to show nearby services.",
            );
            handleLogout();
            return;
          }
          goHome(role);
        }}
      />
    );
  }

  if (screen === "fundiProfileSetup") {
    return (
      <FundiProfileSetupScreen
        authToken={authToken}
        onBack={() => setScreen("createAccount")}
        onComplete={() => setScreen("locationPermission")}
      />
    );
  }

  if (screen === "otp") {
    const displayPhone = otpPhone
      ? `+256 ${otpPhone.replace(/\D/g, "").replace(/^256/, "")}`
      : "+256";
    return (
      <OtpScreen
        phone={displayPhone}
        phoneRaw={otpPhone}
        purpose={otpPurpose}
        expiresIn={otpExpiresIn}
        onBack={() =>
          setScreen(otpPurpose === "login" ? "signIn" : "phoneRegister")
        }
        onResent={(data) => setOtpExpiresIn(data.expiresIn || 600)}
        onVerify={async (code) => {
          if (otpPurpose === "register") {
            const { data } = await verifyOtpRegister({
              phone: otpPhone,
              code,
              firstName: signupData?.firstName,
              lastName: signupData?.lastName,
              name: signupData?.name,
              role: signupData?.role || pendingRole,
              email: signupData?.email,
              dateOfBirth: signupData?.dateOfBirth,
            });
            await afterAuth(data);
            return;
          }
          const { data } = await verifyOtpLogin(otpPhone, code);
          const role = await applySession(data);
          setAuthTokenForSync(data.token || "");
          const locationOk = await ensureLocationForLogin();
          if (!locationOk) {
            Alert.alert(
              "Location required",
              "FundiLink needs location access to show nearby services.",
            );
            handleLogout();
            return;
          }
          goHome(role);
        }}
      />
    );
  }

  if (screen === "locationPermission") {
    return (
      <LocationPermissionScreen
        userRole={userRole}
        onAllow={() => setScreen("setLocation")}
        onManual={() => setScreen("setLocation")}
      />
    );
  }

  if (screen === "setLocation") {
    return (
      <SetLocationScreen
        authToken={authToken}
        onBack={() => setScreen("locationPermission")}
        onConfirm={() => goHome()}
      />
    );
  }

  if (screen === "home") {
    if (userRole === "fundi") {
      return tabLayout(
        bookingWrap(<FundiDashboardScreen userName={userName} {...tabProps} />),
        "home",
      );
    }
    return tabLayout(
      bookingWrap(<HomeScreen userName={userName} {...tabProps} />),
      "home",
    );
  }

  if (screen === "fundiDashboard") {
    return tabLayout(
      bookingWrap(<FundiDashboardScreen userName={userName} {...tabProps} />),
      "home",
    );
  }

  if (screen === "browse") {
    return tabLayout(bookingWrap(<BrowseArtisansScreen {...tabProps} />), "browse");
  }

  if (screen === "bookings") {
    return tabLayout(
      bookingWrap(
        <BookingsScreen
          {...tabProps}
          reviewHistory={reviewHistory}
          onStartRatingFlow={() => {
            const job =
              activeJob || defaultActiveJob(pendingBooking, selectedArtisan);
            setActiveJob(job);
            pushAndNavigate("jobInProgress");
          }}
          onViewHistory={() => pushAndNavigate("bookingHistory")}
        />
      ),
      "bookings",
    );
  }

  if (screen === "profile") {
    return tabLayout(<ProfileScreen {...tabPropsWithLogout} />, "profile");
  }

  if (screen === "chat") {
    return (
      <ChatProvider userId={userId} authToken={authToken}>
        <ChatScreen onNavigate={handleNavigate} userRole={userRole} userId={userId} targetUserId={chatTargetUserId} />
      </ChatProvider>
    );
  }

  if (screen === "notifications") {
    return bookingWrap(<NotificationsScreen onNavigate={handleNavigate} />);
  }

  if (screen === "editProfile") {
    return <EditProfileScreen onNavigate={handleNavigate} />;
  }

  if (screen === "skillsPortfolio") {
    return <SkillsPortfolioScreen onNavigate={handleNavigate} />;
  }

  if (screen === "settings") {
    return <SettingsScreen onNavigate={handleNavigate} />;
  }

  if (screen === "payments") {
    return <PaymentMethodsScreen onNavigate={handleNavigate} />;
  }

  if (screen === "help") {
    return <HelpSupportScreen onNavigate={handleNavigate} />;
  }

  if (screen === "wallet") {
    return tabLayout(<WalletHomeScreen onNavigate={handleNavigate} />, "wallet");
  }

  if (screen === "deposit") {
    return <DepositScreen onNavigate={handleNavigate} />;
  }

  if (screen === "withdraw") {
    return <WithdrawScreen onNavigate={handleNavigate} />;
  }

  if (screen === "transactionHistory") {
    return <TransactionHistoryScreen onNavigate={handleNavigate} />;
  }

  if (screen === "transfer") {
    return <TransferScreen onNavigate={handleNavigate} />;
  }

  if (screen === "artisan") {
    return (
      <ArtisanProfileScreen
        artisan={selectedArtisan || {}}
        onNavigate={handleNavigate}
      />
    );
  }

  if (screen === "request") {
    return bookingWrap(
      <RequestServiceScreen
        artisan={selectedArtisan || {}}
        authToken={authToken}
        onNavigate={handleNavigate}
        onSessionRestored={(session) => applySession(session)}
      />
    );
  }

  if (screen === "bookingSubmitted") {
    return bookingWrap(
      <BookingSubmittedScreen
        booking={clientBookingDraft || pendingBooking}
        onNavigate={handleNavigate}
      />
    );
  }

  if (screen === "bookingWaiting") {
    return bookingWrap(
      <BookingWaitingScreen
        booking={clientBookingDraft || pendingBooking}
        onNavigate={handleNavigate}
        onBack={() => setScreen("home")}
      />
    );
  }

  if (screen === "fundiBookingDetail") {
    return bookingWrap(
      <FundiBookingDetailScreen
        bookingId={selectedBookingId}
        onBack={() => setScreen("fundiDashboard")}
      />
    );
  }

  if (screen === "payment") {
    const booking =
      pendingBooking?.priceAgreed || pendingBooking?.agreedPrice
        ? pendingBooking
        : buildBookingFromRequest(
            pendingBooking,
            selectedArtisan || pendingBooking?.artisan || {},
          );
    return bookingWrap(
      <PaymentScreen
        booking={booking}
        onBack={() => setScreen("bookingWaiting")}
        onPay={() => {
          const paidBooking = { ...booking, paid: true };
          setPendingBooking(paidBooking);
          setActiveJob(
            defaultActiveJob(paidBooking, selectedArtisan || paidBooking.artisan || {}),
          );
          setScreen("confirm");
        }}
      />
    );
  }

  if (screen === "confirm") {
    const booking =
      pendingBooking?.paid || pendingBooking?.priceAgreed
        ? pendingBooking
        : buildBookingFromRequest(
            pendingBooking,
            selectedArtisan || pendingBooking?.artisan || {},
          );
    return bookingWrap(
      <BookingConfirmationScreen
        booking={booking}
        onNavigate={handleNavigate}
      />
    );
  }

  if (screen === "tracking") {
    const job = activeJob || defaultActiveJob(pendingBooking, selectedArtisan);
    return bookingWrap(
      <LiveTrackingScreen
        job={job}
        onBack={() => setScreen("confirm")}
        onChat={() => handleNavigate("chat", { targetUserId: job?.fundiId })}
        onJobStarted={() => {
          setActiveJob({
            ...job,
            status: "in_progress",
            startedAt: Date.now(),
          });
          pushAndNavigate("jobInProgress");
        }}
      />
    );
  }

  if (screen === "jobInProgress") {
    const job = activeJob || defaultActiveJob(pendingBooking, selectedArtisan);
    return bookingWrap(
      <JobInProgressScreen
        job={job}
        onNavigate={handleNavigate}
        onComplete={handleJobComplete}
      />
    );
  }

  if (screen === "rateExperience") {
    const job = activeJob || defaultActiveJob(pendingBooking, selectedArtisan);
    return (
      <RateExperienceScreen
        job={job}
        existingReview={editingReview}
        onBack={() =>
          setScreen(editingReview ? "bookingHistory" : "jobInProgress")
        }
        onSubmit={handleReviewSubmit}
      />
    );
  }

  if (screen === "bookingHistory") {
    return (
      <BookingHistoryScreen
        bookings={reviewHistory}
        successMessage={reviewSuccessMessage}
        onBack={() => {
          setReviewSuccessMessage("");
          goHome();
        }}
        onEditReview={(item) => {
          setEditingReview(item);
          setActiveJob(
            item.job || {
              fundiName: item.fundiName,
              service: item.service,
              amount: item.amount,
              fundiId: item.fundiId,
              releasedAt: Date.now(),
            },
          );
          setReviewSuccessMessage("");
          pushAndNavigate("rateExperience");
        }}
        onRestartFlow={() => {
          setReviewSuccessMessage("");
          setEditingReview(null);
          const job = defaultActiveJob(pendingBooking, selectedArtisan);
          setActiveJob(job);
          historyRef.current = [];
          setScreen("confirm");
        }}
      />
    );
  }

  return null;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LocationProvider>
        <View style={{ flex: 1, backgroundColor: theme.colors.black }}>
          <StatusBar
            barStyle="light-content"
            backgroundColor={theme.colors.black}
          />
          <AppContent />
        </View>
      </LocationProvider>
    </SafeAreaProvider>
  );
}
