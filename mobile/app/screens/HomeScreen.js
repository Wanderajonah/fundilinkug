import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ScrollView,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomTabBar from "../components/BottomTabBar";
import LoadingSkeleton from "../components/LoadingSkeleton";
import HomeSection from "../components/HomeSection";
import { useTabBarHeight } from "../hooks/useTabBarHeight";
import { formatUgx, initials } from "../utils/ratings";
import { getNearbyFundis } from "../../services/mapsApi";
import { mapFundiItem } from "../../services/fundisApi";
import { getWallet } from "../../services/walletApi";
import theme from "../theme";
import { useBookingOptional } from "../../context/BookingContext";
import { useLocation } from "../../context/LocationContext";

const H_PAD = 20;

const CATEGORIES = [
  { key: "plumber", label: "Plumbing", icon: "water-outline" },
  { key: "electrician", label: "Electrician", icon: "flash-outline" },
  { key: "carpenter", label: "Carpenter", icon: "hammer-outline" },
  { key: "painter", label: "Painter", icon: "color-palette-outline" },
];

const HERO_SLIDES = [
  {
    key: "verified",
    title: "Get a qualified verified fundi near you",
    action: "Find a Fundi",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900",
  },
  {
    key: "urgent",
    title: "Book urgent home repairs without the back and forth",
    action: "Request Service",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=900",
  },
  {
    key: "trusted",
    title: "Compare skilled artisans by rating, distance, and availability",
    action: "Browse Fundis",
    image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=900",
  },
];

const FEATURED_FUNDI_LIMIT = 3;

const rankFeaturedFundis = (fundis) =>
  [...fundis].sort((a, b) => {
    const availableDelta = Number(b.isAvailable !== false) - Number(a.isAvailable !== false);
    if (availableDelta) return availableDelta;

    const ratingDelta = (b.rating || 0) - (a.rating || 0);
    if (ratingDelta) return ratingDelta;

    const reviewDelta = (b.reviews || 0) - (a.reviews || 0);
    if (reviewDelta) return reviewDelta;

    return (a.distanceKm ?? Number.MAX_SAFE_INTEGER) - (b.distanceKm ?? Number.MAX_SAFE_INTEGER);
  });

function ListHeader({ userName, onNavigate, locationLabel, activeJob, loading, walletBalance }) {
  const [showBalance, setShowBalance] = useState(true);
  const [heroWidth, setHeroWidth] = useState(0);
  const [activeHero, setActiveHero] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    if (!heroWidth) return undefined;
    const timer = setInterval(() => {
      setActiveHero((current) => {
        const next = (current + 1) % HERO_SLIDES.length;
        heroRef.current?.scrollTo({ x: next * heroWidth, animated: true });
        return next;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, [heroWidth]);

  const handleHeroScrollEnd = (event) => {
    if (!heroWidth) return;
    const next = Math.round(event.nativeEvent.contentOffset.x / heroWidth);
    setActiveHero(Math.max(0, Math.min(next, HERO_SLIDES.length - 1)));
  };

  return (
    <View>
      {/* 1. Header Row — logo + bell + balance below bell */}
      <View style={styles.headerRow}>
        <View style={styles.brandWrap}>
          <Text style={styles.brandName}>FundiLink</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => onNavigate?.("notifications")}
            activeOpacity={0.85}
          >
            <Ionicons name="notifications-outline" size={22} color={theme.colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Location + Balance row */}
      <View style={styles.locBalanceRow}>
        <TouchableOpacity
          style={styles.locationPill}
          activeOpacity={0.85}
          onPress={() => onNavigate?.("setLocation")}
        >
          <Ionicons name="location-outline" size={14} color={theme.colors.green} />
          <Text style={styles.locationText} numberOfLines={1}>
            {locationLabel || "Set your location"}
          </Text>
        </TouchableOpacity>
        {walletBalance !== null ? (
          <View style={styles.balanceRow}>
            <TouchableOpacity onPress={() => setShowBalance((p) => !p)} activeOpacity={0.7}>
              <Ionicons
                name={showBalance ? "eye-outline" : "eye-off-outline"}
                size={16}
                color={theme.colors.mutedDark}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onNavigate?.("wallet")}
              activeOpacity={0.85}
            >
              <Text style={styles.balanceText}>
                {showBalance ? `UGX ${(walletBalance || 0).toLocaleString()}` : "UGX ••••••"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigate?.("wallet")} activeOpacity={0.85}>
              <View style={styles.addIcon}>
                <Ionicons name="add" size={12} color={theme.colors.textDark} />
              </View>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* Active booking banner */}
      {activeJob?.status === "in_progress" || activeJob?.fundiName ? (
        <TouchableOpacity
          style={styles.activeBanner}
          onPress={() => onNavigate?.("jobInProgress")}
          activeOpacity={0.9}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.activeBannerTitle}>
              Active booking · {activeJob.service}
            </Text>
            <Text style={styles.activeBannerSub}>
              {activeJob.fundiName} · {formatUgx(activeJob.amount)}
            </Text>
          </View>
          <Text style={styles.activeBannerCta}>Open</Text>
        </TouchableOpacity>
      ) : null}

      {/* 2. Search Bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={theme.colors.muted} />
        <TextInput
          placeholder="What service do you need?"
          placeholderTextColor={theme.colors.mutedDark}
          style={styles.searchInput}
          onFocus={() => onNavigate?.("browse")}
        />
      </View>

      {/* 3. Hero Slider */}
      <View
        style={styles.heroBanner}
        onLayout={(event) => setHeroWidth(event.nativeEvent.layout.width)}
      >
        <ScrollView
          ref={heroRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleHeroScrollEnd}
          scrollEventThrottle={16}
        >
          {HERO_SLIDES.map((slide) => (
            <TouchableOpacity
              key={slide.key}
              style={[styles.heroSlide, { width: heroWidth || 1 }]}
              activeOpacity={0.95}
              onPress={() => onNavigate?.("browse")}
            >
              <ImageBackground
                source={{ uri: slide.image }}
                style={styles.heroImage}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0.78)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.heroOverlay}
                >
                  <View style={styles.heroContent}>
                    <Text style={styles.heroTitle}>{slide.title}</Text>
                    <View style={styles.heroBtn}>
                      <Text style={styles.heroBtnText}>{slide.action}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.heroDots}>
          {HERO_SLIDES.map((slide, index) => (
            <View
              key={`${slide.key}-dot`}
              style={[styles.heroDot, index === activeHero && styles.heroDotActive]}
            />
          ))}
        </View>
      </View>

      {/* 4. Services Section */}
      <HomeSection title="Services" style={styles.sectionGap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.servicesScroll}
        >
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={styles.serviceBtn}
              activeOpacity={0.8}
              onPress={() => onNavigate?.("browse", { category: c.key })}
            >
              <View style={styles.serviceIconWrap}>
                <Ionicons name={c.icon} size={24} color={theme.colors.accent} />
              </View>
              <Text style={styles.serviceLabel}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </HomeSection>

      {/* 5. Featured Fundis */}
      <HomeSection
        title="Top Professionals"
        onAction={() => onNavigate?.("browse")}
        style={styles.sectionGap}
      >
        {loading ? <LoadingSkeleton count={2} /> : null}
      </HomeSection>

    </View>
  );
}

function FundiCard({ item, onBook }) {
  const stars = item.rating || 0;
  const dist = item.distanceKm;
  return (
    <TouchableOpacity
      style={styles.fundiCard}
      activeOpacity={0.9}
      onPress={() => onBook?.(item)}
    >
      <View style={styles.fundiAvatar}>
        <Text style={styles.fundiAvatarText}>{initials(item.name)}</Text>
        {item.verified ? <View style={styles.verifiedBadge}><Ionicons name="checkmark" size={10} color={theme.colors.textDark} /></View> : null}
      </View>
      <View style={styles.fundiBody}>
        <View style={styles.fundiNameRow}>
          <Text style={styles.fundiName} numberOfLines={1}>{item.name}</Text>
          {item.isAvailable !== false ? <View style={styles.availDot} /> : null}
        </View>
        <Text style={styles.fundiRole} numberOfLines={1}>{item.role}</Text>
        <View style={styles.fundiMeta}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color={theme.colors.accent} />
            <Text style={styles.ratingText}>{stars > 0 ? stars.toFixed(1) : "New"}</Text>
          </View>
          {dist != null ? (
            <Text style={styles.distText}>{dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`}</Text>
          ) : null}
          {item.experience > 0 ? (
            <Text style={styles.expText}>{item.experience}yr</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.hireWrap}>
        <TouchableOpacity
          style={styles.hireBtn}
          activeOpacity={0.85}
          onPress={() => onBook?.(item)}
        >
          <Text style={styles.hireBtnText}>Hire</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({
  userName = "User",
  userRole = "customer",
  activeJob,
  onNavigate,
}) {
  const tabBarHeight = useTabBarHeight();
  const bookingCtx = useBookingOptional();
  const resolvedActiveJob = bookingCtx?.activeJob || activeJob;
  const { address, coords, radiusKm, locationRevision } = useLocation();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [walletBalance, setWalletBalance] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getWallet();
        if (!cancelled) setWalletBalance(data.wallet?.balance ?? null);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await getNearbyFundis({
          lat: coords.lat,
          lng: coords.lng,
          radiusKm,
        });
        const list = rankFeaturedFundis((data.fundis || data || []).map(mapFundiItem)).slice(
          0,
          FEATURED_FUNDI_LIMIT,
        );
        if (!cancelled) setFeatured(list);
      } catch {
        if (!cancelled) {
          setFeatured([]);
          setError("Could not load fundis.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coords.lat, coords.lng, radiusKm, locationRevision]);

  return (
    <ScreenWrapper style={styles.safe} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.black}
      />
      <FlatList
        data={loading ? [] : featured}
        keyExtractor={(i) => String(i.id)}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <ListHeader
            userName={userName}
            onNavigate={onNavigate}
            locationLabel={address}
            activeJob={resolvedActiveJob}
            loading={loading}
            walletBalance={walletBalance}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + 24 },
        ]}
        ListEmptyComponent={
          !loading ? (
            error ? (
              <View style={styles.noFundis}>
                <Ionicons name="cloud-offline-outline" size={28} color={theme.colors.mutedDark} />
                <Text style={styles.noFundisTitle}>Unable to load</Text>
                <Text style={styles.noFundisSub}>{error}</Text>
              </View>
            ) : (
              <View style={styles.noFundis}>
                <Ionicons name="search-outline" size={28} color={theme.colors.mutedDark} />
                <Text style={styles.noFundisTitle}>No fundis nearby</Text>
                <Text style={styles.noFundisSub}>Try expanding your search radius or browse all fundis</Text>
                <TouchableOpacity style={styles.browseAllBtn} onPress={() => onNavigate?.("browse")}>
                  <Text style={styles.browseAllText}>Browse All Fundis</Text>
                </TouchableOpacity>
              </View>
            )
          ) : null
        }
        renderItem={({ item }) => (
          <FundiCard
            item={item}
            onBook={(artisan) =>
              onNavigate?.("artisan", { artisanId: artisan.id, artisan })
            }
          />
        )}
      />
      <BottomTabBar active="home" onTab={onNavigate} role={userRole} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.black },
  listContent: { paddingHorizontal: H_PAD, paddingTop: 16 },

  /* Header */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  brandWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandName: {
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  /* Location + Balance row */
  locBalanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  /* Location */
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.input,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  locationText: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: "600",
    maxWidth: 260,
  },

  /* Header right */
  headerRight: { flexDirection: "column", alignItems: "flex-end", gap: 4 },

  /* Balance row — eye + amount + add */
  balanceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  balanceText: { color: theme.colors.accent, fontWeight: "900", fontSize: 13 },
  addIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Active banner */
  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,184,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,184,0,0.25)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    ...theme.elevation.md,
  },
  activeBannerTitle: { color: theme.colors.white, fontWeight: "800", fontSize: 14 },
  activeBannerSub: { color: theme.colors.muted, fontSize: 12, marginTop: 4 },
  activeBannerCta: { color: theme.colors.accent, fontWeight: "800", fontSize: 14 },

  /* Search */
  searchWrap: {
    height: 50,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 20,
    ...theme.elevation.sm,
  },
  searchInput: { flex: 1, color: theme.colors.white, fontSize: 15 },

  /* Hero Slider */
  heroBanner: {
    height: 120,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: theme.colors.panel,
    ...theme.elevation.lg,
  },
  heroSlide: {
    height: "100%",
  },
  heroImage: { flex: 1 },
  heroOverlay: { flex: 1, justifyContent: "flex-end", padding: 20 },
  heroContent: { gap: 12, paddingRight: 42 },
  heroTitle: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  heroBtn: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    ...theme.elevation.md,
  },
  heroBtnText: { color: theme.colors.textDark, fontWeight: "800", fontSize: 14 },
  heroDots: {
    position: "absolute",
    right: 14,
    bottom: 14,
    flexDirection: "row",
    gap: 5,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  heroDotActive: {
    width: 18,
    backgroundColor: theme.colors.accent,
  },

  /* Services */
  sectionGap: { marginBottom: 20 },
  servicesScroll: { gap: 16, paddingRight: H_PAD },
  serviceBtn: { alignItems: "center", width: 72 },
  serviceIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,184,0,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,184,0,0.1)",
  },
  serviceLabel: { color: theme.colors.muted, fontSize: 12, fontWeight: "600", textAlign: "center" },

  /* Fundi Card */
  fundiCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.panel,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fundiAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,184,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    position: "relative",
  },
  fundiAvatarText: { color: theme.colors.white, fontWeight: "800", fontSize: 16 },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.green,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: theme.colors.panel,
  },
  fundiBody: { flex: 1 },
  fundiNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  fundiName: { color: theme.colors.white, fontSize: 15, fontWeight: "800", flexShrink: 1 },
  availDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: theme.colors.green,
  },
  fundiRole: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
  fundiMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,184,0,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  ratingText: { color: theme.colors.accent, fontWeight: "800", fontSize: 11 },
  distText: { color: theme.colors.mutedDark, fontSize: 11, fontWeight: "600" },
  expText: { color: theme.colors.mutedDark, fontSize: 11, fontWeight: "600" },
  hireWrap: { marginLeft: 8 },
  hireBtn: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  hireBtnText: { color: theme.colors.textDark, fontWeight: "800", fontSize: 13 },

  /* No fundis */
  noFundis: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: theme.colors.panel,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  noFundisTitle: { color: theme.colors.white, fontWeight: "800", fontSize: 15, marginTop: 10 },
  noFundisSub: { color: theme.colors.mutedDark, fontSize: 12, textAlign: "center", marginTop: 4, paddingHorizontal: 20 },
  browseAllBtn: {
    marginTop: 14,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  browseAllText: { color: theme.colors.textDark, fontWeight: "800", fontSize: 13 },
});
