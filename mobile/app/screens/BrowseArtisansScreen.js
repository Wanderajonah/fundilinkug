import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenWrapper from "../components/ScreenWrapper";
import FundiMap from "../components/FundiMap";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { useLocation } from "../../context/LocationContext";
import { getNearbyFundis } from "../../services/mapsApi";
import { resolveMediaUrl } from "../../utils/image";
import theme from "../theme";
import { useLanguage } from "../i18n/LanguageContext";

const MAP_H = Dimensions.get("window").height * 0.4;
const CARD_W = Dimensions.get("window").width * 0.62;

const FILTERS = [
  { key: "available", label: "Available" },
  { key: "verified", label: "Verified" },
  { key: "distance", label: "\u2264 5km" },
  { key: "rating", label: "\u2605 4.5+" },
];

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function FundiCard({ item, onPress }) {
  const { t } = useLanguage();
  const name = item.userId?.name || t('Fundi');
  const photo = item.userId?.profilePhoto
    ? resolveMediaUrl(item.userId.profilePhoto)
    : null;
  const skills = (item.skills || []).join(", ") || "Artisan";
  const rating = item.rating || 0;
  const distance =
    item.distanceKm != null ? `${item.distanceKm.toFixed(1)} km` : null;
  const available = item.isAvailable !== false;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.92} onPress={onPress}>
      <View style={styles.avatarWrap}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{initials(name)}</Text>
          </View>
        )}
        {item.verified ? (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark" size={10} color="#000" />
          </View>
        ) : null}
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.cardName} numberOfLines={1}>
            {name}
          </Text>
          {item.verified ? (
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={theme.colors.green}
              style={{ marginLeft: 4 }}
            />
          ) : null}
        </View>
        <Text style={styles.cardRole} numberOfLines={1}>
          {skills}
        </Text>
        <View style={styles.metaRow}>
          {available ? <View style={styles.availDot} /> : null}
          <Ionicons name="star" size={12} color={theme.colors.accent} />
          <Text style={styles.metaText}>
            {rating > 0 ? rating.toFixed(1) : t('New')}
          </Text>
          {distance ? (
            <>
              <Ionicons
                name="location-outline"
                size={12}
                color={theme.colors.mutedDark}
              />
              <Text style={styles.metaText}>{distance}</Text>
            </>
          ) : null}
        </View>
      </View>

      <View style={styles.bookBtn}>
        <Text style={styles.bookText}>{t('View & Book')}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function BrowseArtisansScreen({
  initialCategory = "all",
  userRole = "customer",
  onNavigate,
}) {
  const { coords, region, radiusKm, locationRevision } = useLocation();
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState("available");
  const [fundis, setFundis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadFundis = useCallback(async () => {
    const category =
      initialCategory && initialCategory !== "all" ? initialCategory : undefined;
    const { data } = await getNearbyFundis({
      lat: coords.lat,
      lng: coords.lng,
      category,
      radiusKm,
    });
    return data.fundis || [];
  }, [coords.lat, coords.lng, radiusKm, initialCategory]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await loadFundis();
        if (!cancelled) setFundis(list);
      } catch {
        if (!cancelled) setFundis([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadFundis, locationRevision]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const list = await loadFundis();
      setFundis(list);
    } catch {
      setFundis([]);
    } finally {
      setRefreshing(false);
    }
  }, [loadFundis]);

  const filteredFundis = fundis.filter((f) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (f.userId?.name || "").toLowerCase();
      const skills = (f.skills || []).join(" ").toLowerCase();
      if (!name.includes(q) && !skills.includes(q)) return false;
    }
    switch (activeFilter) {
      case "available":
        return f.isAvailable !== false;
      case "verified":
        return f.verified === true;
      case "distance":
        return f.distanceKm != null && f.distanceKm <= 5;
      case "rating":
        return f.rating >= 4.5;
      default:
        return true;
    }
  });

  const openArtisan = (item) => {
    const name = item.userId?.name || "Fundi";
    const role = (item.skills || [])[0] || "Artisan";
    onNavigate?.("artisan", {
      artisan: {
        id: item.userId?._id,
        fundiProfileId: item._id,
        name,
        role,
        rating: item.rating,
        skills: item.skills || [],
        profilePhoto: item.userId?.profilePhoto || "",
        coverPhoto: item.userId?.coverPhoto || "",
        portfolioImages: item.portfolioImages || [],
        verified: item.verified,
        experience: item.experience || 0,
        location:
          item.userId?.locationLabel || item.userId?.address || "",
        hourlyRate: "",
      },
    });
  };

  return (
    <ScreenWrapper style={styles.safe} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.black}
      />

      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent}
          />
        }
      >
        {/* Map header with floating search */}
        <View style={styles.mapWrap}>
          <FundiMap
            style={styles.map}
            region={region}
            currentLocation={coords}
            fundis={filteredFundis}
          />
          <View style={styles.searchOverlay}>
            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={18} color={theme.colors.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('Search fundis or skills...')}
                placeholderTextColor={theme.colors.mutedDark}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color={theme.colors.mutedDark} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {/* Filter chips */}
        <View style={styles.chipsRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {FILTERS.map((f) => {
              const on = f.key === activeFilter;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.chip, on && styles.chipOn]}
                  activeOpacity={0.85}
                  onPress={() => setActiveFilter(f.key)}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>
                    {t(f.label)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <Text style={styles.nearbyTitle}>
          {loading
            ? t('Finding fundis nearby...')
            : fundis.length > 0
              ? `${filteredFundis.length} ${t('of')} ${fundis.length} ${t('Fundis nearby')}`
              : t('Fundis nearby')}
        </Text>

        {loading ? (
          <LoadingSkeleton count={3} />
        ) : filteredFundis.length === 0 ? (
          <EmptyState
            icon="person-circle-outline"
            title={fundis.length > 0 ? t('No matches') : t('No fundis nearby')}
            message={
              fundis.length > 0
                ? t('Try a different filter or search term.')
                : t('Fundis near you will appear here. Try widening your radius.')
            }
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hList}
          >
            {filteredFundis.map((f) => (
              <FundiCard key={f._id} item={f} onPress={() => openArtisan(f)} />
            ))}
          </ScrollView>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.black },
  page: { paddingBottom: 120 },
  mapWrap: { height: MAP_H, position: "relative" },
  map: { ...StyleSheet.absoluteFillObject },
  searchOverlay: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.72)",
    borderColor: theme.colors.borderLight,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },
  searchInput: { flex: 1, color: theme.colors.white, fontSize: 14 },
  chipsRow: { paddingVertical: 12 },
  chips: { gap: 8, paddingHorizontal: 16 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
  },
  chipOn: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  chipText: { color: theme.colors.muted, fontWeight: "700", fontSize: 12 },
  chipTextOn: { color: theme.colors.textDark },
  nearbyTitle: {
    color: theme.colors.white,
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  hList: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: {
    width: CARD_W,
    backgroundColor: theme.colors.panel,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    ...theme.elevation.sm,
  },
  avatarWrap: { alignSelf: "flex-start", position: "relative", marginBottom: 12 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.input,
  },
  avatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,184,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: theme.colors.white, fontWeight: "900", fontSize: 20 },
  verifiedBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.green,
    borderWidth: 2,
    borderColor: theme.colors.panel,
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfo: { marginBottom: 14 },
  nameRow: { flexDirection: "row", alignItems: "center" },
  cardName: { color: theme.colors.white, fontWeight: "800", fontSize: 15, flexShrink: 1 },
  cardRole: { color: theme.colors.muted, fontSize: 12, marginTop: 3 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 9,
  },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.green,
    marginRight: 2,
  },
  metaText: { color: theme.colors.mutedDark, fontSize: 12, fontWeight: "600" },
  bookBtn: {
    marginTop: 12,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    alignItems: "center",
    ...theme.elevation.sm,
  },
  bookText: { color: theme.colors.textDark, fontWeight: "900", fontSize: 13 },
});
