import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import theme from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import PrimaryButton from "../components/PrimaryButton";
import IconButton from "../components/IconButton";
import { getReviewsByFundi } from "../../services/reviewsApi";
import { getFundiById } from "../../services/fundisApi";
import { resolveMediaUrl } from "../../utils/image";
import { initials, formatBookingDate } from "../utils/ratings";
import { useLanguage } from "../i18n/LanguageContext";

const AVATAR_SIZE = 96;
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
      <View style={styles.statIconBadge}>
        <Ionicons name={icon} size={16} color={theme.colors.accent} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function CompactStars({ value, size = 12 }) {
  const rounded = Math.round(value || 0);
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={s <= rounded ? "star" : "star-outline"}
          size={size}
          color={s <= rounded ? theme.colors.accent : theme.colors.mutedDark}
        />
      ))}
    </View>
  );
}

function ReviewCard({ review }) {
  const { t } = useLanguage();
  const customerName = review.customerId?.name || t('Customer');
  const dateLabel = review.createdAt ? formatBookingDate(review.createdAt) : "";
  const customerPhoto = resolveMediaUrl(
    review.customerId?.profilePhoto || review.customerId?.avatarUrl || ""
  );

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        {customerPhoto ? (
          <Image source={{ uri: customerPhoto }} style={styles.reviewAvatarImage} />
        ) : (
          <View style={styles.reviewAvatar}>
            <Text style={styles.reviewAvatarText}>{initials(customerName)}</Text>
          </View>
        )}
        <View style={styles.reviewMeta}>
          <View style={styles.reviewNameRow}>
            <Text style={styles.reviewAuthor} numberOfLines={1}>
              {customerName}
            </Text>
            <View style={styles.reviewVerifiedBadge}>
              <Ionicons name="checkmark-circle" size={12} color={theme.colors.accent} />
              <Text style={styles.reviewVerifiedText}>{t('Verified')}</Text>
            </View>
          </View>
          <View style={styles.reviewStarsWrap}>
            <CompactStars value={review.rating} size={12} />
            {dateLabel ? (
              <Text style={styles.reviewDate}>{dateLabel}</Text>
            ) : null}
          </View>
        </View>
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
  const { t } = useLanguage();

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

  const avatarImageUri = profilePhotoUri;

  const reviewCount = reviewList.length || propReviews || 0;
  const ratingDisplay =
    profile.rating > 0 ? Number(profile.rating).toFixed(1) : "—";

  const reviewDistribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewList.forEach((r) => {
      const k = Math.min(5, Math.max(1, Math.round(r.rating || 0)));
      dist[k] = (dist[k] || 0) + 1;
    });
    return dist;
  }, [reviewList]);
  const jobCount = artisan.jobsCompleted ?? artisan.jobsDone ?? "—";
  const yearsValue = profile.experience > 0 ? profile.experience : "—";

  const rateLabel = hourlyRate || (price ? `$${price}/hr` : t('Rate on request'));

  const aboutBio =
    profile.experience > 0
      ? t('Experienced {{role}} with {{years}}+ years in the field. Specializing in residential and commercial jobs. Available for emergency repairs and installations.', { role: profile.role.toLowerCase(), years: profile.experience })
      : t('Experienced {{role}} specializing in residential and commercial jobs. Available for emergency repairs and installations.', { role: profile.role.toLowerCase() });

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
          <Text style={styles.emptyTitle}>{t('No portfolio photos yet')}</Text>
          <Text style={styles.emptySub}>
            {t('Work samples will appear here once uploaded.')}
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
          <Text style={styles.emptyTitle}>{t('No reviews yet')}</Text>
          <Text style={styles.emptySub}>
            {t('Be the first customer to leave a review.')}
          </Text>
        </View>
      );
    }

    const total = reviewList.length;
    const score =
      profile.rating > 0
        ? Number(profile.rating).toFixed(1)
        : (
            reviewList.reduce((sum, r) => sum + (r.rating || 0), 0) / total
          ).toFixed(1);

    return (
      <View>
        <View style={styles.reviewSummaryCard}>
          <View style={styles.reviewSummaryLeft}>
            <Text style={styles.reviewScore}>{score}</Text>
            <CompactStars value={Number(score)} size={13} />
            <Text style={styles.reviewSummaryCount}>
              {total} {t('reviews')}
            </Text>
          </View>
          <View style={styles.reviewBreakdown}>
            {[5, 4, 3, 2, 1].map((level) => {
              const count = reviewDistribution[level] || 0;
              const pct = total ? Math.round((count / total) * 100) : 0;
              return (
                <View key={level} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{level}★</Text>
                  <View style={styles.breakdownTrack}>
                    <View
                      style={[
                        styles.breakdownFill,
                        { width: `${pct}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.breakdownCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {reviewList.map((r) => <ReviewCard key={r._id} review={r} />)}
      </View>
    );
  };

  const renderAboutTab = () => (
    <View style={styles.aboutStack}>
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={16} color={theme.colors.accent} />
          <Text style={styles.sectionTitle}>{t('Biography')}</Text>
        </View>
        <Text style={styles.bodyText}>{aboutBio}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="construct-outline" size={16} color={theme.colors.accent} />
          <Text style={styles.sectionTitle}>{t('Skills')}</Text>
        </View>
        {profile.skills.length ? (
          <View style={styles.skillRow}>
            {profile.skills.map((s) => (
              <View key={s} style={styles.skillChip}>
                <Text style={styles.skillText}>{s}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.bodyText}>{t('No skills listed yet.')}</Text>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time-outline" size={16} color={theme.colors.accent} />
          <Text style={styles.sectionTitle}>{t('Experience')}</Text>
        </View>
        <Text style={styles.bodyText}>
          {profile.experience > 0
            ? t('{{years}} years of professional experience', { years: profile.experience })
            : t('Experience details not provided yet.')}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar-outline" size={16} color={theme.colors.accent} />
          <Text style={styles.sectionTitle}>{t('Availability')}</Text>
        </View>
        <View style={styles.infoRow}>
          <View
            style={[
              styles.infoDot,
              profile.isAvailable === false && styles.infoDotOff,
            ]}
          />
          <Text style={styles.bodyText}>
            {profile.isAvailable === false
              ? t('Currently unavailable for new bookings')
              : t('Available for new bookings')}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="pricetag-outline" size={16} color={theme.colors.accent} />
          <Text style={styles.sectionTitle}>{t('Contact & Rate')}</Text>
        </View>
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
        <View style={styles.topBar}>
          <IconButton
            name="chevron-back"
            onPress={() => onNavigate?.("browse")}
          />
          <View
            style={[
              styles.presencePill,
              profile.isAvailable === false && styles.presencePillOff,
            ]}
          >
            <View
              style={[
                styles.presenceDot,
                profile.isAvailable === false && styles.presenceDotOff,
              ]}
            />
            <Text
              style={[
                styles.presenceText,
                profile.isAvailable === false && styles.presenceTextOff,
              ]}
            >
              {profile.isAvailable === false ? t('Unavailable') : t('Available')}
            </Text>
          </View>
        </View>

        {/* PROFILE SURFACE */}
        <View style={styles.profileSurface}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrap}>{renderAvatar()}</View>

            <View style={styles.identityBlock}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {profile.name}
              </Text>
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

            <View style={styles.ratingPill}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name={s <= Math.round(profile.rating) ? "star" : "star-outline"}
                    size={13}
                    color={
                      s <= Math.round(profile.rating)
                        ? theme.colors.accent
                        : theme.colors.mutedDark
                    }
                  />
                ))}
              </View>
              <Text style={styles.ratingMeta}>
                {ratingDisplay !== "—" ? `${ratingDisplay} · ` : ""}
                {reviewCount} {t('reviews')}
              </Text>
            </View>

            {profile.location ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={13} color={theme.colors.muted} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {profile.location}
                </Text>
              </View>
            ) : null}
          </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statTile}>
              <StatItem icon="star" value={ratingDisplay} label={t('Rating')} />
            </View>
            <View style={styles.statTile}>
              <StatItem icon="construct-outline" value={jobCount} label={t('Jobs')} />
            </View>
            <View style={styles.statTile}>
              <StatItem icon="time-outline" value={yearsValue} label={t('Years')} />
            </View>
          </View>

          <View style={styles.ctaRow}>
            <View style={styles.bookWrap}>
              <PrimaryButton
                icon="construct-outline"
                onPress={() =>
                  onNavigate?.("request", { artisan: mergedArtisan })
                }
                style={styles.bookBtn}
              >
                {t('Book Now')}
              </PrimaryButton>
            </View>

            <TouchableOpacity
              style={styles.circleBtn}
              activeOpacity={0.82}
              onPress={() =>
                onNavigate?.("chat", {
                  targetUserId: mergedArtisan._id || mergedArtisan.id,
                })
              }
            >
              <Ionicons
                name="chatbubble-outline"
                size={20}
                color={theme.colors.accent}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.circleBtn}
              activeOpacity={0.82}
              onPress={() => {}}
            >
              <Ionicons
                name="share-social-outline"
                size={20}
                color={theme.colors.accent}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.tabBar}>
            <View style={styles.tabTrack}>
              {TABS.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.tabItem, active && styles.tabItemActive]}
                    onPress={() => setActiveTab(tab.key)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[styles.tabLabel, active && styles.tabLabelActive]}
                    >
                      {t(tab.label)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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

  /* Top bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === "ios" ? 12 : 8,
    marginBottom: 8,
  },
  presencePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
  },
  presencePillOff: { borderColor: theme.colors.border },
  presenceDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: theme.colors.green,
  },
  presenceDotOff: { backgroundColor: theme.colors.mutedDark },
  presenceText: {
    color: theme.colors.green,
    fontSize: 12,
    fontWeight: "800",
  },
  presenceTextOff: { color: theme.colors.mutedDark },

  profileSurface: {
    backgroundColor: theme.colors.black,
    paddingTop: 8,
  },
  profileHeader: {
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 24,
    marginHorizontal: theme.spacing.md,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: theme.spacing.md,
    ...theme.elevation.md,
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: 16,
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
    borderColor: theme.colors.accent,
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
    borderColor: theme.colors.accent,
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
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,184,0,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,184,0,0.22)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    marginTop: 12,
  },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  ratingMeta: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 12,
  },
  locationText: {
    color: theme.colors.muted,
    fontSize: 13,
    maxWidth: 240,
  },

  statsRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
  },
  statTile: {
    flex: 1,
    alignItems: "center",
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  statItem: { flex: 1, alignItems: "center" },
  statIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(255,184,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    color: theme.colors.white,
    fontWeight: "900",
    fontSize: 17,
    textAlign: "center",
  },
  statLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },

  ctaRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    alignItems: "center",
  },
  circleBtn: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.glass,
    alignItems: "center",
    justifyContent: "center",
  },
  bookWrap: { flex: 1 },
  bookBtn: { width: "100%" },

  tabBar: {
    marginTop: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
  },
  tabTrack: {
    flexDirection: "row",
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: theme.radius.pill - 4,
  },
  tabItemActive: { backgroundColor: theme.colors.accent },
  tabLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.muted,
  },
  tabLabelActive: { color: theme.colors.textDark },
  tabContent: {
    marginTop: theme.spacing.md,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    color: theme.colors.white,
    fontWeight: "800",
    fontSize: 16,
  },
  bodyText: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.green,
  },
  infoDotOff: { backgroundColor: theme.colors.mutedDark },

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

  /* Review summary */
  reviewSummaryCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  reviewSummaryLeft: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.sm,
  },
  reviewScore: {
    color: theme.colors.white,
    fontSize: 40,
    fontWeight: "900",
    lineHeight: 44,
  },
  reviewSummaryCount: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },
  reviewBreakdown: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  breakdownLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "700",
    width: 20,
  },
  breakdownTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.input,
    overflow: "hidden",
  },
  breakdownFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: theme.colors.accent,
  },
  breakdownCount: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "700",
    width: 16,
    textAlign: "right",
  },

  /* Review cards */
  reviewCard: {
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,184,0,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,184,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  reviewAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  reviewAvatarText: { color: theme.colors.white, fontWeight: "800" },
  reviewMeta: { flex: 1 },
  reviewNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  reviewAuthor: { color: theme.colors.white, fontWeight: "800", fontSize: 14, flexShrink: 1 },
  reviewVerifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,184,0,0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reviewVerifiedText: { color: theme.colors.accent, fontSize: 10, fontWeight: "700" },
  reviewStarsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  reviewDate: { color: theme.colors.mutedDark, fontSize: 11, fontWeight: "600" },
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