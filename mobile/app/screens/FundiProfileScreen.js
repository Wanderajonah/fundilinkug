import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  Text,
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { resolveMediaUrl } from "../../utils/image";

const Colors = {
  background: "#0D0D0D",
  card: "#1A1A1A",
  cardRaised: "#222222",
  border: "#2C2C2C",
  primary: "#F5A623",
  primaryDark: "#3a2000",
  primaryText: "#111111",
  white: "#FFFFFF",
  muted: "#8A8A8A",
  success: "#22C55E",
  avatarFrom: "#3a2d00",
  avatarTo: "#6b5200",
  overlayDark: "rgba(0,0,0,0.55)",
};

const DEFAULT_FUNDI = {
  name: "John Doe",
  trade: "Electrician",
  rating: 4.5,
  jobsDone: 127,
  yearsExp: 8,
  verified: true,
  skills: ["Electrical", "Wiring", "Repairs", "Installation"],
  about:
    "Professional electrician with 8 years of experience. Specialized in residential and commercial electrical work.",
  portfolio: [],
  initials: "JD",
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const extractMediaPath = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = extractMediaPath(item);
      if (found) return found;
    }
    return "";
  }
  if (typeof value === "object") {
    return (
      extractMediaPath(value.uri) ||
      extractMediaPath(value.url) ||
      extractMediaPath(value.src) ||
      extractMediaPath(value.profilePhoto) ||
      extractMediaPath(value.coverPhoto) ||
      extractMediaPath(value.image) ||
      extractMediaPath(value.avatar)
    );
  }
  return "";
};

const FundiProfileScreen = ({ navigation, route }) => {
  const fundi = route?.params?.fundi ?? DEFAULT_FUNDI;
  const [activeTab, setActiveTab] = useState("activity");
  const coverPhotoUri = useMemo(
    () => resolveMediaUrl(extractMediaPath(fundi?.coverPhoto)),
    [fundi?.coverPhoto],
  );
  const profilePhotoUri = useMemo(
    () => resolveMediaUrl(extractMediaPath(fundi?.profilePhoto)),
    [fundi?.profilePhoto],
  );

  const renderStars = (ratingRaw) => {
    const rating = clamp(Number(ratingRaw) || 0, 0, 5);
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;

    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Ionicons
            key={`full-${i}`}
            name="star"
            color={Colors.primary}
            size={13}
          />,
        );
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(
          <Ionicons
            key={`half-${i}`}
            name="star-half"
            color={Colors.primary}
            size={13}
          />,
        );
      } else {
        stars.push(
          <Ionicons
            key={`empty-${i}`}
            name="star-outline"
            color={Colors.primary}
            size={13}
          />,
        );
      }
    }

    return (
      <View style={styles.starsRow}>
        {stars}
        <Text style={styles.ratingText}>({rating.toFixed(1)})</Text>
      </View>
    );
  };

  const tabs = [
    { key: "activity", label: "Activity" },
    { key: "reviews", label: "Reviews" },
    { key: "about", label: "About" },
  ];

  const activityPhotos =
    (fundi?.portfolio || []).length > 0
      ? fundi.portfolio
      : Array.from({ length: 3 }).map((_, idx) => ({
          id: `ph-${idx}`,
          likeCount: 0,
          commentCount: 0,
          placeholder: true,
        }));

  const renderAvatar = () => (
    <View style={styles.avatarOuter}>
      {profilePhotoUri ? (
        <Image source={{ uri: profilePhotoUri }} style={styles.avatar} />
      ) : (
        <LinearGradient
          colors={[Colors.avatarFrom, Colors.avatarTo]}
          style={styles.avatar}
        >
          <Text style={styles.initials}>
            {String(fundi.initials || "").trim() ||
              String(fundi.name || "")[0] ||
              ""}
          </Text>
        </LinearGradient>
      )}

      {fundi?.verified ? (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* COVER BANNER + OVERLAPPING AVATAR */}
        <View style={styles.bannerWrap}>
          {coverPhotoUri ? (
            <ImageBackground
              source={{ uri: coverPhotoUri }}
              style={styles.bannerImage}
              imageStyle={styles.bannerImageCrop}
            >
              <View style={styles.bannerScrim} />
            </ImageBackground>
          ) : (
            <LinearGradient
              colors={[Colors.avatarTo, Colors.avatarFrom]}
              style={styles.bannerImage}
            />
          )}

          <TouchableOpacity
            style={styles.backHeader}
            onPress={() => navigation.goBack()}
            activeOpacity={0.75}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.white} />
          </TouchableOpacity>

          <View style={styles.avatarFloating}>{renderAvatar()}</View>
        </View>

        {/* IDENTITY BLOCK — centered, sits below the banner overlap */}
        <View style={styles.identityBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.fundiName}>{fundi?.name || ""}</Text>
            {fundi?.verified ? (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={Colors.primary}
                style={{ marginLeft: 4 }}
              />
            ) : null}
          </View>
          <Text style={styles.fundiTrade}>{fundi?.trade || ""}</Text>

          {/* STATS — inline, centered, no card border */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Number(fundi?.rating) || 0}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={[styles.statItem, styles.statDivider]}>
              <Text style={styles.statValue}>
                {Number(fundi?.jobsDone) || 0}
              </Text>
              <Text style={styles.statLabel}>Jobs</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Number(fundi?.yearsExp) || 0}
              </Text>
              <Text style={styles.statLabel}>Years</Text>
            </View>
          </View>

          {/* ACTION ROW — message / book now / share, single row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => navigation.navigate("Chat", { fundi })}
              activeOpacity={0.75}
            >
              <Ionicons
                name="chatbubble-outline"
                size={18}
                color={Colors.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bookBtn}
              onPress={() =>
                Alert.alert(
                  "Booking",
                  "Booking feature will be available after fundi confirms the job.",
                )
              }
              activeOpacity={0.75}
            >
              <Text style={styles.bookBtnText}>Book Now</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.circleBtn} activeOpacity={0.75}>
              <Ionicons
                name="share-social-outline"
                size={18}
                color={Colors.white}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* TAB BAR */}
        <View style={styles.tabBar}>
          {tabs.map((t) => {
            const active = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={styles.tabItem}
                onPress={() => setActiveTab(t.key)}
                activeOpacity={0.75}
              >
                <Text
                  style={[styles.tabLabel, active && styles.tabLabelActive]}
                >
                  {t.label}
                </Text>
                {active ? <View style={styles.activeIndicator} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* TAB CONTENT */}
        {activeTab === "activity" ? (
          <View style={styles.activityGrid}>
            {activityPhotos.map((p, idx) => (
              <View
                key={p?.id || p?._id || String(idx)}
                style={styles.activityItem}
              >
                <View style={styles.activityImagePlaceholder}>
                  <Ionicons
                    name="image-outline"
                    size={28}
                    color={Colors.border}
                  />
                  {p?.placeholder ? (
                    <Text style={styles.placeholderText}>No photo yet</Text>
                  ) : null}
                </View>
                <View style={styles.activityMetaRow}>
                  <View style={styles.activityMetaItem}>
                    <Ionicons name="thumbs-up" size={11} color={Colors.white} />
                    <Text style={styles.activityMetaText}>
                      {p?.likeCount ?? 0}
                    </Text>
                  </View>
                  <View style={styles.activityMetaItem}>
                    <Ionicons
                      name="chatbubble"
                      size={11}
                      color={Colors.white}
                    />
                    <Text style={styles.activityMetaText}>
                      {p?.commentCount ?? 0}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {activeTab === "reviews" ? (
          <View style={styles.tabCard}>
            <Text style={styles.cardTitle}>Reviews</Text>
            <Text style={styles.emptyState}>
              No reviews yet. Be the first to book and rate.
            </Text>
          </View>
        ) : null}

        {activeTab === "about" ? (
          <View>
            <View style={styles.tabCard}>
              <Text style={styles.cardTitle}>About</Text>
              <Text style={styles.cardBody}>{fundi?.about || ""}</Text>
            </View>

            <View style={styles.tabCard}>
              <Text style={styles.cardTitle}>Skills</Text>
              <View style={styles.pillsRow}>
                {(fundi?.skills || []).map((s) => (
                  <View key={s} style={styles.pill}>
                    <Text style={styles.pillText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const AVATAR_SIZE = 96;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  // BANNER
  bannerWrap: {
    height: 170,
    backgroundColor: Colors.cardRaised,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerImageCrop: { resizeMode: "cover" },
  bannerScrim: {
    flex: 1,
    backgroundColor: Colors.overlayDark,
  },
  backHeader: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 16,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFloating: {
    position: "absolute",
    bottom: -AVATAR_SIZE / 2,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  // AVATAR
  avatarOuter: {
    position: "relative",
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  initials: {
    color: Colors.primary,
    fontSize: 28,
    fontWeight: "800",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  // IDENTITY BLOCK
  identityBlock: {
    alignItems: "center",
    paddingTop: AVATAR_SIZE / 2 + 12,
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  fundiName: {
    color: Colors.white,
    fontSize: 19,
    fontWeight: "800",
  },
  fundiTrade: {
    color: Colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingText: {
    color: Colors.muted,
    fontSize: 11,
    marginLeft: 4,
  },

  // STATS
  statsRow: {
    flexDirection: "row",
    marginTop: 18,
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 22,
  },
  statDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  statLabel: {
    color: Colors.muted,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 3,
    textAlign: "center",
  },

  // ACTION ROW
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    gap: 12,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  bookBtn: {
    height: 44,
    paddingHorizontal: 28,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  bookBtnText: {
    color: Colors.primaryText,
    fontWeight: "800",
    fontSize: 14.5,
  },

  // TAB BAR
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 12,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 11,
    alignItems: "center",
    position: "relative",
  },
  tabLabel: {
    fontSize: 12.5,
    fontWeight: "600",
    color: Colors.muted,
  },
  tabLabelActive: {
    color: Colors.primary,
  },
  activeIndicator: {
    position: "absolute",
    bottom: -1,
    height: 2,
    backgroundColor: Colors.primary,
    left: "20%",
    right: "20%",
    borderRadius: 2,
  },

  // ABOUT / REVIEWS CARDS
  tabCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  cardBody: {
    color: Colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  pill: {
    backgroundColor: Colors.primaryDark,
    borderWidth: 1,
    borderColor: "rgba(245,166,35,0.3)",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  pillText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    color: Colors.muted,
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
    paddingBottom: 8,
  },

  // ACTIVITY GRID (renamed from "portfolio")
  activityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  activityItem: {
    width: "47%",
  },
  activityImagePlaceholder: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: Colors.cardRaised,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: Colors.muted,
    fontSize: 10,
    marginTop: 6,
    fontStyle: "italic",
  },
  activityMetaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  activityMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  activityMetaText: {
    color: Colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
});

export default FundiProfileScreen;
