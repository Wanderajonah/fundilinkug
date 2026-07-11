import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  ImageBackground,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import theme from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import StarRating from "../components/StarRating";
import { getReviewsByFundi } from "../../services/reviewsApi";
import { getFundiById } from "../../services/fundisApi";
import { resolveMediaUrl } from "../../utils/image";
import { initials, formatBookingDate } from "../utils/ratings";

const AVATAR_SIZE = 96;
const BANNER_HEIGHT = 170;
const GRID_GAP = 10;
const GRID_COLS = 2;
const screenWidth = Dimensions.get("window").width;
const portfolioCardWidth =
  (screenWidth - theme.spacing.md * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

const TABS = [
  { key: "activity", label: "Activity" },
  { key: "reviews", label: "Reviews" },
  { key: "about", label: "About" },
];

const MEDIA_KEYS = [
  "uri",
  "url",
  "src",
  "secure_url",
  "profilePhoto",
  "photo",
  "image",
  "avatar",
  "coverPhoto",
];

function extractMediaPath(value) {
  if (!value) return "";

  if (typeof value === "string") {
    const v = value.trim();
    return v && v !== "[object Object]" ? v : "";
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = extractMediaPath(item);
      if (found) return found;
    }
    return "";
  }

  if (typeof value === "object") {
    for (const key of MEDIA_KEYS) {
      const found = extractMediaPath(value[key]);
      if (found) return found;
    }
  }

  return "";
}

function StatItem({ icon, value, label }) {
  return (
    <View style={styles.statItem}>
      <Ionicons
        name={icon}
        size={16}
        color={theme.colors.accent}
        style={styles.statIcon}
      />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ReviewCard({ review }) {
  const customerName = review.customerId?.name || "Customer";
  const dateLabel = review.createdAt ? formatBookingDate(review.createdAt) : "";

  return (
    <View style={styles.card}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewAvatarText}>{initials(customerName)}</Text>
        </View>
        <View style={styles.reviewMeta}>
          <Text style={styles.reviewAuthor}>{customerName}</Text>
          <StarRating
            value={review.rating}
            showLabel={false}
            size={14}
            disabled
          />
        </View>
        {dateLabel ? <Text style={styles.reviewDate}>{dateLabel}</Text> : null}
      </View>
      {review.comment ? (
        <Text style={styles.reviewText}>{review.comment}</Text>
      ) : null}
    </View>
  );
}

export default function ArtisanProfileScreen({ artisan = {}, onNavigate }) {
  const {
    name: propName = "Unknown",
    role: propRole = "",
    rating: propRating = 0,
    reviews: propReviews = 0,
    price = 0,
    skills: propSkills = [],
    id,
    _id,
    fundiProfileId,
    profilePhoto: propProfilePhoto = "",
    portfolioImages: propPortfolio = [],
    verified: propVerified = false,
    experience: propExperience = 0,
    location: propLocation = "",
    hourlyRate,
  } = artisan;

  const fundiId = id || _id;
  const [activeTab, setActiveTab] = useState("activity");
  const [reviewList, setReviewList] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(Boolean(fundiProfileId));
  const [imageCacheKey, setImageCacheKey] = useState(Date.now());

  useEffect(() => {
    if (!fundiId) return;
    let cancelled = false;
    (async () => {
      setLoadingReviews(true);
      try {
        const { data } = await getReviewsByFundi(fundiId);
        if (!cancelled) setReviewList(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setReviewList([]);
      } finally {
        if (!cancelled) setLoadingReviews(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fundiId]);

  useEffect(() => {
    if (!fundiProfileId) {
      setLoadingProfile(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingProfile(true);
      try {
        const { data } = await getFundiById(fundiProfileId);
        if (!cancelled) {
          setProfileData(data);
          setImageCacheKey(Date.now());
        }
      } catch {
        if (!cancelled) setProfileData(null);
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fundiProfileId]);

  const profile = useMemo(() => {
    const user = profileData?.userId || artisan.userId || {};
    const skills = profileData?.skills?.length
      ? profileData.skills
      : propSkills;
    const role = skills[0] || propRole || "Artisan";
    return {
      name: user.name || propName,
      role,
      skills,
      rating: profileData?.rating ?? propRating,
      verified: profileData?.verified ?? propVerified,
      experience: profileData?.experience ?? propExperience,
      location: user.locationLabel || user.address || propLocation,
      profilePhoto: extractMediaPath(
        user.profilePhoto ||
          user.photo ||
          artisan.profilePhoto ||
          artisan.photo ||
          artisan.avatar ||
          artisan.image ||
          propProfilePhoto ||
          propPortfolio?.[0],
      ),
      portfolioImages: profileData?.portfolioImages?.length
        ? profileData.portfolioImages
        : propPortfolio,
      isAvailable: profileData?.isAvailable,
    };
  }, [
    artisan,
    profileData,
    propName,
    propRole,
    propSkills,
    propRating,
    propVerified,
    propExperience,
    propLocation,
    propProfilePhoto,
    propPortfolio,
  ]);

  const profilePhotoUri = useMemo(() => {
    const raw = extractMediaPath(profile.profilePhoto);
    return resolveMediaUrl(raw, imageCacheKey);
  }, [profile.profilePhoto, imageCacheKey]);

  const bannerImageUri = useMemo(() => {
    const raw = extractMediaPath([
      profile.portfolioImages?.slice(1),
      artisan.portfolioImages?.slice(1),
      profile.profilePhoto,
      artisan.profilePhoto,
      artisan.coverPhoto,
      propProfilePhoto,
    ]);
    return resolveMediaUrl(raw, imageCacheKey);
  }, [
    artisan.coverPhoto,
    artisan.portfolioImages,
    artisan.profilePhoto,
    imageCacheKey,
    profile.portfolioImages,
    profile.profilePhoto,
    propProfilePhoto,
  ]);

  const avatarImageUri = profilePhotoUri;

  const reviewCount = reviewList.length || propReviews || 0;
  const ratingDisplay =
    profile.rating > 0 ? Number(profile.rating).toFixed(1) : "—";
  const jobCount = artisan.jobsCompleted ?? artisan.jobsDone ?? "—";
  const yearsValue = profile.experience > 0 ? profile.experience : "—";

  const rateLabel = hourlyRate || (price ? `$${price}/hr` : "Rate on request");

  const aboutBio =
    profile.experience > 0
      ? `Experienced ${profile.role.toLowerCase()} with ${profile.experience}+ years in the field. Specializing in residential and commercial jobs. Available for emergency repairs and installations.`
      : `Experienced ${profile.role.toLowerCase()} specializing in residential and commercial jobs. Available for emergency repairs and installations.`;

  const mergedArtisan = useMemo(
    () => ({
      ...artisan,
      id: fundiId,
      _id: fundiId,
      name: profile.name,
      role: profile.role,
      rating: profile.rating,
      skills: profile.skills,
      profilePhoto: profile.profilePhoto,
    }),
    [artisan, fundiId, profile],
  );

  const renderAvatar = () => (
    <View style={styles.avatarOuter}>
      {avatarImageUri ? (
        <Image source={{ uri: avatarImageUri }} style={styles.avatarImage} />
      ) : (
        <LinearGradient
          colors={[theme.colors.black, theme.colors.accentDark]}
          style={styles.avatarFallback}
        >
          <Text style={styles.avatarInitials}>{initials(profile.name)}</Text>
        </LinearGradient>
      )}
      {loadingProfile ? (
        <View style={styles.avatarLoading}>
          <ActivityIndicator color={theme.colors.accent} size="small" />
        </View>
      ) : null}
      {profile.verified ? (
        <View style={styles.verifiedBadge}>
          <Ionicons
            name="checkmark-circle"
            size={18}
            color={theme.colors.accent}
          />
        </View>
      ) : null}
    </View>
  );

  const renderActivityTab = () => {
    const images = profile.portfolioImages || [];
    if (!images.length) {
      return (
        <View style={styles.emptyCard}>
          <Ionicons
            name="images-outline"
            size={36}
            color={theme.colors.muted}
          />
          <Text style={styles.emptyTitle}>No portfolio photos yet</Text>
          <Text style={styles.emptySub}>
            Work samples will appear here once uploaded.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.portfolioGrid}>
        {images.map((uri, idx) => {
          const imageUri = resolveMediaUrl(
            extractMediaPath(uri),
            imageCacheKey,
          );
          return (
            <View key={`${uri}-${idx}`} style={styles.portfolioCard}>
              <Image source={{ uri: imageUri }} style={styles.portfolioImage} />
            </View>
          );
        })}
      </View>
    );
  };

  const renderReviewsTab = () => {
    if (loadingReviews) {
      return (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      );
    }

    if (!reviewList.length) {
      return (
        <View style={styles.emptyCard}>
          <Ionicons name="star" size={28} color={theme.colors.accent} />
          <Text style={styles.emptyTitle}>No reviews yet</Text>
          <Text style={styles.emptySub}>
            Be the first customer to leave a review.
          </Text>
        </View>
      );
    }

    return reviewList.map((r) => <ReviewCard key={r._id} review={r} />);
  };

  const renderAboutTab = () => (
    <View style={styles.aboutStack}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Biography</Text>
        <Text style={styles.bodyText}>{aboutBio}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Skills</Text>
        {profile.skills.length ? (
          <View style={styles.skillRow}>
            {profile.skills.map((s) => (
              <View key={s} style={styles.skillChip}>
                <Text style={styles.skillText}>{s}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.bodyText}>No skills listed yet.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Experience</Text>
        <Text style={styles.bodyText}>
          {profile.experience > 0
            ? `${profile.experience} years of professional experience`
            : "Experience details not provided yet."}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Availability</Text>
        <Text style={styles.bodyText}>
          {profile.isAvailable === false
            ? "Currently unavailable for new bookings"
            : "Available for new bookings"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Contact & Rate</Text>
        <Text style={styles.bodyText}>{rateLabel}</Text>
        {profile.location ? (
          <View style={styles.contactRow}>
            <Ionicons
              name="location-outline"
              size={15}
              color={theme.colors.accent}
            />
            <Text style={styles.contactText}>{profile.location}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <ScreenWrapper style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View style={styles.bannerWrap}>
          {bannerImageUri ? (
            <ImageBackground
              source={{ uri: bannerImageUri }}
              style={styles.bannerImage}
              imageStyle={styles.bannerImageCrop}
            >
              <View style={styles.bannerScrim} />
            </ImageBackground>
          ) : (
            <LinearGradient
              colors={[theme.colors.black, theme.colors.accentDark]}
              style={styles.bannerImage}
            />
          )}
          <TouchableOpacity
            onPress={() => onNavigate?.("browse")}
            style={styles.backBtn}
            activeOpacity={0.75}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={theme.colors.white}
            />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.avatarStandalone}>{renderAvatar()}</View>

        <View style={styles.profileSurface}>
          <View style={styles.identityBlock}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{profile.name}</Text>
              {profile.verified ? (
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={theme.colors.accent}
                  style={styles.nameBadge}
                />
              ) : null}
            </View>
            <Text style={styles.profession}>{profile.role}</Text>
            <View style={styles.ratingRow}>
              <StarRating
                value={profile.rating}
                showLabel={false}
                size={15}
                disabled
              />
              <Text style={styles.ratingMeta}>
                {ratingDisplay !== "—" ? `${ratingDisplay} · ` : ""}
                {reviewCount} review{reviewCount === 1 ? "" : "s"}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatItem icon="star" value={ratingDisplay} label="Rating" />
            <StatItem icon="construct-outline" value={jobCount} label="Jobs" />
            <StatItem icon="time-outline" value={yearsValue} label="Years" />
          </View>

          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.circleBtn}
              activeOpacity={0.82}
              onPress={() => onNavigate?.("chat", { targetUserId: mergedArtisan._id || mergedArtisan.id })}
            >
              <Ionicons
                name="chatbubble-outline"
                size={18}
                color={theme.colors.accent}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bookBtn}
              activeOpacity={0.88}
              onPress={() =>
                onNavigate?.("request", { artisan: mergedArtisan })
              }
            >
              <Text style={styles.bookBtnText}>Book Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.circleBtn}
              activeOpacity={0.82}
              onPress={() => {}}
            >
              <Ionicons
                name="share-social-outline"
                size={18}
                color={theme.colors.accent}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.tabBar}>
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[styles.tabLabel, active && styles.tabLabelActive]}
                  >
                    {tab.label}
                  </Text>
                  {active ? <View style={styles.tabIndicator} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.tabContent}>
            {activeTab === "activity" ? renderActivityTab() : null}
            {activeTab === "reviews" ? renderReviewsTab() : null}
            {activeTab === "about" ? renderAboutTab() : null}
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bgDark },
  container: { paddingBottom: 120 },

  bannerWrap: {
    height: BANNER_HEIGHT,
    backgroundColor: theme.colors.black,
  },
  bannerImage: { width: "100%", height: "100%" },
  bannerImageCrop: { resizeMode: "cover" },
  bannerScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.26)",
  },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 12 : 8,
    left: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  avatarStandalone: {
    position: "absolute",
    left: 0,
    right: 0,
    top: BANNER_HEIGHT - AVATAR_SIZE / 2,
    alignItems: "center",
    zIndex: 10,
  },
  avatarOuter: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    position: "relative",
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: theme.colors.black,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: theme.colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: theme.colors.white,
    fontWeight: "900",
    fontSize: 28,
  },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.black,
    alignItems: "center",
    justifyContent: "center",
  },

  profileSurface: {
    backgroundColor: theme.colors.black,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -AVATAR_SIZE / 2,
    paddingTop: AVATAR_SIZE,
    overflow: "hidden",
  },

  identityBlock: {
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  nameRow: { flexDirection: "row", alignItems: "center" },
  name: {
    color: theme.colors.white,
    fontSize: 23,
    fontWeight: "900",
    textAlign: "center",
  },
  nameBadge: { marginLeft: 6 },
  profession: {
    color: theme.colors.accent,
    fontSize: 16,
    marginTop: 4,
    textAlign: "center",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  ratingMeta: {
    color: theme.colors.muted,
    fontSize: 13,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  statItem: { flex: 1, alignItems: "center" },
  statIcon: { marginBottom: 4 },
  statValue: {
    color: theme.colors.white,
    fontWeight: "900",
    fontSize: 16,
    textAlign: "center",
  },
  statLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  locationHint: {
    color: theme.colors.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    marginHorizontal: theme.spacing.lg,
  },

  ctaRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    alignItems: "center",
  },
  circleBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  bookBtn: {
    flex: 1,
    height: 50,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
  bookBtnText: {
    color: theme.colors.black,
    fontWeight: "900",
    fontSize: 15,
  },

  tabBar: {
    flexDirection: "row",
    marginTop: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    position: "relative",
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.muted,
  },
  tabLabelActive: { color: theme.colors.accent },
  tabIndicator: {
    position: "absolute",
    bottom: -1,
    left: "18%",
    right: "18%",
    height: 2,
    backgroundColor: theme.colors.accent,
    borderRadius: 2,
  },
  tabContent: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },

  card: {
    backgroundColor: theme.colors.panel,
    borderRadius: 18,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    color: theme.colors.white,
    fontWeight: "800",
    fontSize: 18,
    marginBottom: 10,
  },
  bodyText: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },

  skillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillChip: {
    backgroundColor: "rgba(255,184,0,0.16)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
  },
  skillText: { color: theme.colors.accent, fontWeight: "800", fontSize: 13 },

  aboutStack: { gap: 0 },

  portfolioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  portfolioCard: {
    width: portfolioCardWidth,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: theme.colors.card,
  },
  portfolioImage: {
    width: "100%",
    aspectRatio: 1,
    resizeMode: "cover",
  },

  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,184,0,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  reviewAvatarText: { color: theme.colors.white, fontWeight: "800" },
  reviewMeta: { flex: 1 },
  reviewAuthor: { color: theme.colors.white, fontWeight: "800", fontSize: 15 },
  reviewDate: { color: theme.colors.muted, fontSize: 12 },
  reviewText: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },

  emptyCard: {
    backgroundColor: theme.colors.panel,
    borderRadius: 18,
    padding: theme.spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyEmoji: { fontSize: 28, marginBottom: 8 },
  emptyTitle: {
    color: theme.colors.white,
    fontWeight: "800",
    fontSize: 16,
    marginTop: 4,
  },
  emptySub: {
    color: theme.colors.muted,
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
  loadingWrap: { paddingVertical: 32, alignItems: "center" },
}); 