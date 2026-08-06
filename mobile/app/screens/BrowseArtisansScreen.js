import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenWrapper from "../components/ScreenWrapper";
import FundiMap from "../components/FundiMap";
import { useLocation } from "../../context/LocationContext";
import { getNearbyFundis } from "../../services/mapsApi";
import theme from "../theme";

const CARD_W = Dimensions.get("window").width * 0.62;
const MAP_H = Dimensions.get("window").height * 0.55;

const FILTERS = [
  { key: "available", label: "Available" },
  { key: "verified", label: "Verified ✓" },
  { key: "distance", label: "≤ 5km" },
  { key: "rating", label: "★ 4.5+" },
];

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function BrowseArtisansScreen({
  initialCategory = "all",
  userRole = "customer",
  onNavigate,
}) {
  const { coords, region, radiusKm, locationRevision } = useLocation();
  const [activeFilter, setActiveFilter] = useState("available");
  const [fundis, setFundis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const category =
          initialCategory && initialCategory !== "all"
            ? initialCategory
            : undefined;
        const { data } = await getNearbyFundis({
          lat: coords.lat,
          lng: coords.lng,
          category,
          radiusKm,
        });
        if (!cancelled) setFundis(data.fundis || []);
      } catch {
        if (!cancelled) setFundis([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coords.lat, coords.lng, radiusKm, initialCategory, locationRevision]);

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

  return (
    <ScreenWrapper style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.black}
      />

      {/* Larger map at the top */}
      <FundiMap
        style={[styles.map, { height: MAP_H, zIndex: 0 }]}
        region={region}
        currentLocation={coords}
        fundis={filteredFundis}
      />

      {/* Bottom half is scrollable (search, filters, list) */}
      <View style={styles.bottom}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View style={[styles.searchRow, styles.searchRowElevated]}>
            <Ionicons
              name="search-outline"
              size={18}
              color={theme.colors.muted}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Plumber near me..."
              placeholderTextColor={theme.colors.mutedDark}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.filterSquare}>
              <Ionicons
                name="options-outline"
                size={20}
                color={theme.colors.textDark}
              />
            </TouchableOpacity>
          </View>

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
                  onPress={() => setActiveFilter(f.key)}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.nearbyTitle}>
            {loading
              ? "Loading fundis…"
              : `${filteredFundis.length} of ${fundis.length} Fundis nearby`}
          </Text>

          {loading ? (
            <ActivityIndicator
              color={theme.colors.accent}
              style={{ marginBottom: 24 }}
            />
          ) : (
            <FlatList
              horizontal
              data={filteredFundis}
              keyExtractor={(i) => i._id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              ListEmptyComponent={
                <Text style={styles.empty}>
                  {fundis.length > 0
                    ? "No fundis match the current filter."
                    : "No fundis in this area. Try increasing search radius."}
                </Text>
              }
              renderItem={({ item }) => {
                const name = item.userId?.name || "Fundi";
                const role = (item.skills || [])[0] || "Artisan";
                const rate = item.hourlyRate || "UGX 8K/hr";
                return (
                  <TouchableOpacity
                    style={styles.hCard}
                    activeOpacity={0.9}
                    onPress={() =>
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
                            item.userId?.locationLabel ||
                            item.userId?.address ||
                            "",
                          hourlyRate: item.hourlyRate || rate,
                        },
                      })
                    }
                  >
                    <View style={styles.hAvatar}>
                      <Text style={styles.hAvatarText}>{initials(name)}</Text>
                    </View>
                    <Text style={styles.hName}>
                      {name.split(" ")[0]} K. · {role}
                    </Text>
                    <Text style={styles.hMeta}>
                      {item.distanceKm?.toFixed(1)}km · {item.rating}★ · score{" "}
                      {item.score}
                    </Text>
                    <View style={styles.rateBtn}>
                      <Text style={styles.rateText}>{rate}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.black },
  top: { paddingHorizontal: 20, paddingTop: 4 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: { flex: 1, color: theme.colors.white, fontSize: 14 },
  filterSquare: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  chips: { gap: 8, paddingBottom: 12 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.input,
    marginRight: 8,
  },
  chipOn: { backgroundColor: theme.colors.accent },
  chipText: { color: theme.colors.muted, fontWeight: "700", fontSize: 12 },
  chipTextOn: { color: theme.colors.textDark },
  map: {
    width: "100%",
    height: 200,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
  },
  bottom: { flex: 1, backgroundColor: "transparent", marginTop: -8 },
  searchRowElevated: {
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.md,
    paddingHorizontal: 8,
    elevation: 6,
    zIndex: 20,
  },
  nearbyTitle: {
    color: theme.colors.white,
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 12,
  },
  empty: { color: theme.colors.muted, paddingHorizontal: 20 },
  hCard: {
    width: CARD_W,
    backgroundColor: theme.colors.panel,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginRight: 12,
  },
  hAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,184,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  hAvatarText: { color: theme.colors.white, fontWeight: "800" },
  hName: { color: theme.colors.white, fontWeight: "800", fontSize: 15 },
  hMeta: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  rateBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  rateText: { color: theme.colors.textDark, fontWeight: "900", fontSize: 15 },
});
