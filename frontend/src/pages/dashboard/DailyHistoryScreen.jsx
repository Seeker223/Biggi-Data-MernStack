// app/screens/DailyHistoryScreen.jsx
import React, { useContext, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView, MotiText } from "moti";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../context/AuthContext";
import images from '../../constants/images';

const { width } = Dimensions.get("window");
const CARD_PAD = 16;
const CARD_WIDTH = width - CARD_PAD * 2;

export default function DailyHistoryScreen() {
  const navigation = useNavigation();
  const { user, refreshUser, authLoading } = useContext(AuthContext);
  const [refreshing, setRefreshing] = useState(false);

  // defensive: empty array if user is null
  const history = useMemo(() => {
    const arr = user?.dailyNumberDraw || [];
    // newest first (A)
    return arr.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
    } catch (err) {
      console.warn("History refresh failed", err);
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser]);

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Image
        source={images.empty}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>No plays yet</Text>
      <Text style={styles.emptySubtitle}>
        Buy a data bundle to get tickets and start playing daily draws.
      </Text>

      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => navigation.navigate("BuyDataScreen")}
      >
        <Text style={styles.emptyBtnText}>Buy Bundle</Text>
      </TouchableOpacity>
    </View>
  );

  const playAgain = () => {
    // smart flow: if no tickets, send user to buy / deposit
    const tickets = Number(user?.tickets || 0);
    if (tickets <= 0) {
      navigation.navigate("depositScreen"); // or show a modal/warning
    } else {
      // If games are disabled, redirect to home instead
      try {
        const { FEATURE_FLAGS } = require("../../constants/featureFlags");
        if (FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM) {
          navigation.navigate("(tabs)/homeScreen");
          return;
        }
      } catch (e) {
        // fallback: continue navigation
      }
      navigation.navigate("DailyNumberDrawScreen");
    }
  };

  const renderCard = ({ item, index }) => {
    const created = new Date(item.createdAt);
    const dateStr = created.toLocaleString();
    const picked = Array.isArray(item.numbers) ? item.numbers : [];
    const result = Array.isArray(item.result) ? item.result : [];

    const isWinner = !!item.isWinner;

    // highlight matching numbers (for UI)
    const matchedCount = result.length
      ? picked.filter((n) => result.includes(n)).length
      : 0;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: index * 35, type: "timing", duration: 350 }}
        style={[styles.cardContainer, isWinner ? styles.winnerCardShadow : null]}
      >
        <View style={[styles.card, isWinner ? styles.winnerCard : styles.normalCard]}>
          {/* Left: icon / trophy */}
          <View style={styles.leftColumn}>
            <View style={styles.iconWrap}>
              {isWinner ? (
                <Image
                  source={images.goldTrophy}
                  style={styles.trophy}
                />
              ) : (
                <Ionicons name="ticket" size={28} color={isWinner ? "#000" : "#333"} />
              )}
            </View>
          </View>

          {/* Middle: details */}
          <View style={styles.midColumn}>
            <MotiText
              style={styles.cardTitle}
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 80 }}
            >
              {isWinner ? "Winning Ticket" : "Play"}
            </MotiText>

            <Text style={styles.dateText}>{dateStr}</Text>

            <View style={styles.numbersRow}>
              <Text style={styles.numbersLabel}>Picked:</Text>
              <View style={styles.numberList}>
                {picked.map((n) => (
                  <View
                    key={String(n)}
                    style={[
                      styles.numBubble,
                      result.includes(n) && styles.numBubbleMatched,
                    ]}
                  >
                    <Text
                      style={[
                        styles.numText,
                        result.includes(n) && styles.numTextMatched,
                      ]}
                    >
                      {n}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {result.length > 0 && (
              <View style={[styles.numbersRow, { marginTop: 8 }]}>
                <Text style={styles.numbersLabel}>Draw:</Text>
                <View style={styles.numberList}>
                  {result.map((r) => (
                    <View key={String(r)} style={styles.resultBubble}>
                      <Text style={styles.resultText}>{r}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.matchText}>
                  {matchedCount}/{picked.length} matched
                </Text>
              </View>
            )}
          </View>

          {/* Right: amount / action */}
          <View style={styles.rightColumn}>
            {isWinner ? (
              <View style={styles.winBadge}>
                <Text style={styles.winBadgeText}>WIN</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.playSmallBtn} onPress={playAgain}>
                <Text style={styles.playSmallBtnText}>Play Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </MotiView>
    );
  };

  if (authLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#FF8C00" />
        <Text style={{ marginTop: 12, color: "#fff" }}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Daily Plays — History</Text>

        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          Total plays: <Text style={styles.summaryBold}>{history.length}</Text>
        </Text>

        <TouchableOpacity
          style={[styles.primaryBtn, (user?.tickets || 0) <= 0 ? styles.disabledBtn : null]}
          onPress={playAgain}
        >
          <Text style={styles.primaryBtnText}>
            Play Now ({user?.tickets || 0} tickets)
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={history}
        keyExtractor={(it, i) => (it._id ? String(it._id) : String(i))}
        renderItem={renderCard}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={renderEmpty}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  header: {
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { padding: 6 },
  refreshBtn: { padding: 6 },
  headerTitle: { color: "#FF8C00", fontSize: 20, fontWeight: "800" },

  summary: {
    backgroundColor: "#111",
    padding: 14,
    marginHorizontal: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryText: { color: "#fff", fontSize: 14 },
  summaryBold: { color: "#FF8C00", fontWeight: "800" },

  primaryBtn: {
    backgroundColor: "#FF8C00",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  disabledBtn: { opacity: 0.6, backgroundColor: "#999" },

  listContent: { paddingHorizontal: 16, paddingBottom: 140 },

  cardContainer: {
    marginHorizontal: 0,
  },

  card: {
    width: CARD_WIDTH,
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },

  normalCard: {
    backgroundColor: "#fff",
  },

  winnerCard: {
    backgroundColor: "#FFF8E1", // warm gold-ish
    borderWidth: 1,
    borderColor: "#FFD700",
  },

  winnerCardShadow: {
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },

  leftColumn: { width: 56, alignItems: "center", justifyContent: "center" },
  midColumn: { flex: 1, paddingHorizontal: 8 },
  rightColumn: { width: 86, alignItems: "flex-end", justifyContent: "center" },

  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },

  trophy: { width: 40, height: 40, resizeMode: "contain" },

  cardTitle: { fontSize: 15, fontWeight: "800", color: "#222" },
  dateText: { fontSize: 12, color: "#666", marginTop: 4 },

  numbersRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  numbersLabel: { fontSize: 13, color: "#333", marginRight: 8 },

  numberList: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },

  numBubble: {
    backgroundColor: "#eee",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  numText: { fontWeight: "700", color: "#111" },

  numBubbleMatched: {
    backgroundColor: "#FF8C00",
  },
  numTextMatched: { color: "#fff" },

  resultBubble: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  resultText: { fontWeight: "700", color: "#000" },

  matchText: { marginLeft: 8, fontSize: 12, color: "#666" },

  playSmallBtn: {
    backgroundColor: "#FF8C00",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  playSmallBtnText: { color: "#fff", fontWeight: "700" },

  winBadge: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  winBadgeText: { color: "#000", fontWeight: "800" },

  // EMPTY
  empty: { alignItems: "center", marginTop: 40 },
  emptyImage: { width: 160, height: 120, marginBottom: 16, opacity: 0.9 },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 6 },
  emptySubtitle: { color: "#bbb", fontSize: 13, textAlign: "center", maxWidth: 300, marginBottom: 12 },

  emptyBtn: { backgroundColor: "#FF8C00", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { color: "#fff", fontWeight: "700" },

  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
});
