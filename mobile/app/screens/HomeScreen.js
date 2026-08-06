import React, { useEffect, useMemo, useState } from "react";
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
import LoadingSkeleton from "../components/LoadingSkeleton";
import HomeSection from "../components/HomeSection";
import { formatUgx, formatBookingDate } from "../utils/ratings";
import { getWallet } from "../../services/walletApi";
import theme from "../theme";
import { useBookingOptional } from "../../context/BookingContext";
import { useLocation } from "../../context/LocationContext";

const H_PAD = 20;

const STATUS_COLORS = {
  COMPLETED: { bg: "rgba(52,199,89,0.15)", fg: theme.colors.green },
  CANCELLED: { bg: "rgba(255,69,58,0.15)", fg: theme.colors.red },
  DISPUTED: { bg: "rgba(255,69,58,0.15)", fg: theme.colors.red },
};

const CATEGORIES = [
  { key: "plumber", label: "Plumbing", icon: "water-outline" },
  { key: "electrician", label: "Electrician", icon: "flash-outline" },
  { key: "carpenter", label: "Carpenter", icon: "hammer-outline" },
  { key: "painter", label: "Painter", icon: "color-palette-outline" },
];

function ListHeader({ userName, onNavigate, locationLabel, activeJob, bookingsLoading, walletBalance }) {
  const [showBalance, setShowBalance] = useState(true);
  return (
    <View>
      {/* 1. Header Row — logo + bell + balance below bell */}
      <View style={styles.headerRow}>
        <View style={styles.brandWrap}>
          <View style={styles.logoIcon}>
            <Ionicons name="flash" size={20} color={theme.colors.textDark} />
          </View>
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

      {/* 3. Hero Banner */}
      <TouchableOpacity
        style={styles.heroBanner}
        activeOpacity={0.95}
        onPress={() => onNavigate?.("browse")}
      >
        <ImageBackground
          source={{ uri: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800" }}
          style={styles.heroImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.75)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.heroOverlay}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>
                Get a qualified verified fundi near you
              </Text>
              <TouchableOpacity style={styles.heroBtn} activeOpacity={0.85}>
                <Text style={styles.heroBtnText}>Find a Fundi</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>

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

      {/* 5. Recent Bookings */}
      <HomeSection
        title="Recent Bookings"
        onAction={() => onNavigate?.("bookings")}
        style={styles.sectionGap}
      >
        {bookingsLoading ? <LoadingSkeleton count={2} /> : null}
      </HomeSection>

    </View>
  );
}

function BookingCard({ item, onPress }) {
  const palette = STATUS_COLORS[item.status] || { bg: "rgba(255,184,0,0.12)", fg: theme.colors.accent };
  const counterpart = item.fundiName || item.clientName || "Fundi";
  return (
    <TouchableOpacity
      style={styles.bookingCard}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={styles.bookingIcon}>
        <Ionicons name="construct-outline" size={22} color={theme.colors.accent} />
      </View>
      <View style={styles.fundiBody}>
        <Text style={styles.bookingService} numberOfLines={1}>
          {item.service || "Service"}
        </Text>
        <Text style={styles.bookingSub} numberOfLines={1}>
          {counterpart}
        </Text>
        <View style={styles.bookingMeta}>
          <View style={[styles.bookingStatus, { backgroundColor: palette.bg }]}>
            <Text style={[styles.bookingStatusText, { color: palette.fg }]}>
              {item.statusLabel || item.status}
            </Text>
          </View>
          {item.createdAt ? (
            <Text style={styles.bookingDate}>{formatBookingDate(item.createdAt)}</Text>
          ) : null}
        </View>
      </View>
      {item.total ? (
        <View style={styles.bookingAmountWrap}>
          <Text style={styles.bookingAmount}>{formatUgx(item.total)}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export default function HomeScreen({
  userName = "User",
  userRole = "customer",
  activeJob,
  onNavigate,
}) {
  const bookingCtx = useBookingOptional();
  const resolvedActiveJob = bookingCtx?.activeJob || activeJob;
  const { address } = useLocation();
  const [walletBalance, setWalletBalance] = useState(null);

  const recentBookings = useMemo(() => {
    const list = bookingCtx?.bookings || [];
    const seen = new Set();
    return [...list]
      .filter(Boolean)
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      )
      .filter((b) => {
        if (!b.fundiId) return true;
        if (seen.has(b.fundiId)) return false;
        seen.add(b.fundiId);
        return true;
      })
      .slice(0, 5);
  }, [bookingCtx?.bookings]);

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

  return (
    <ScreenWrapper style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.black}
      />
      <FlatList
        data={recentBookings}
        keyExtractor={(i) => String(i.id)}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <ListHeader
            userName={userName}
            onNavigate={onNavigate}
            locationLabel={address}
            activeJob={resolvedActiveJob}
            bookingsLoading={bookingCtx?.loading}
            walletBalance={walletBalance}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 24 },
        ]}
        ListEmptyComponent={
          !bookingCtx?.loading ? (
            <View style={styles.noBookings}>
              <Ionicons name="calendar-outline" size={28} color={theme.colors.mutedDark} />
              <Text style={styles.noFundisTitle}>No bookings yet</Text>
              <Text style={styles.noFundisSub}>Book a fundi and your bookings will show up here</Text>
              <TouchableOpacity style={styles.browseAllBtn} onPress={() => onNavigate?.("browse")}>
                <Text style={styles.browseAllText}>Book a Fundi</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <BookingCard
            item={item}
            onPress={() => onNavigate?.("bookings")}
          />
        )}
      />
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
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.accent,
    justifyContent: "center",
    alignItems: "center",
    ...theme.elevation.md,
  },
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

  /* Hero Banner */
  heroBanner: {
    height: 120,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 24,
    ...theme.elevation.lg,
  },
  heroImage: { flex: 1 },
  heroOverlay: { flex: 1, justifyContent: "flex-end", padding: 20 },
  heroContent: { gap: 14 },
  heroTitle: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: "800",
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

  /* Booking Card */
  bookingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.panel,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bookingIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,184,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  fundiBody: { flex: 1 },
  bookingService: { color: theme.colors.white, fontSize: 15, fontWeight: "800", flexShrink: 1 },
  bookingSub: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
  bookingMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  bookingStatus: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bookingStatusText: { fontWeight: "800", fontSize: 11 },
  bookingDate: { color: theme.colors.mutedDark, fontSize: 11, fontWeight: "600" },
  bookingAmountWrap: { marginLeft: 8 },
  bookingAmount: { color: theme.colors.accent, fontWeight: "900", fontSize: 13 },

  /* No bookings */
  noBookings: {
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
