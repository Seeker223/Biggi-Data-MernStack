import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { depositHistoryApi } from "../../utils/api";

const POLL_INTERVAL = 10000; // 10 seconds

const DepositHistoryScreen = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ---------------------------------------------------------
  // LOAD HISTORY
  // ---------------------------------------------------------
  const loadHistory = async () => {
    try {
      const res = await depositHistoryApi();
      setHistory(res.data.history || []);
    } catch (err) {
      console.log("Error loading deposit history:", err.response?.data || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();

    // Auto-refresh / polling for pending deposits
    const interval = setInterval(() => {
      loadHistory();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistory();
  }, []);

  // ---------------------------------------------------------
  // RENDER EACH TRANSACTION ITEM
  // ---------------------------------------------------------
  const renderItem = ({ item }) => {
    let statusStyle = styles.pending;
    if (item.status === "success") statusStyle = styles.success;
    else if (item.status === "failed" || item.status === "reversed") statusStyle = styles.failed;

    return (
      <View style={styles.itemContainer}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={styles.amountText}>₦{item.amount}</Text>
          <Text style={[styles.status, statusStyle]}>{item.status.toUpperCase()}</Text>
        </View>

        <Text style={styles.meta}>Method: {item.method || "Flutterwave"}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
    );
  };

  // ---------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF7A00" />
        <Text style={{ marginTop: 10 }}>Loading deposit history...</Text>
      </View>
    );
  }

  // ---------------------------------------------------------
  // EMPTY STATE
  // ---------------------------------------------------------
  if (history.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No deposit history yet.</Text>
        <Text style={styles.emptySub}>Your deposits will appear here.</Text>
      </View>
    );
  }

  // ---------------------------------------------------------
  // MAIN LIST
  // ---------------------------------------------------------
  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item._id}
      renderItem={renderItem}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ padding: 15 }}
    />
  );
};

export default DepositHistoryScreen;

// ---------------------------------------------------------
// STYLES
// ---------------------------------------------------------
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  itemContainer: {
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  amountText: { fontSize: 18, fontWeight: "700" },
  meta: { marginTop: 6, fontSize: 13, color: "#444" },
  date: { marginTop: 3, fontSize: 12, color: "#777" },
  status: { fontWeight: "bold", fontSize: 12, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 5 },
  success: { backgroundColor: "#D4F8D4", color: "#0A8917" },
  pending: { backgroundColor: "#FFECC7", color: "#A66B00" },
  failed: { backgroundColor: "#FFCDD2", color: "#B00020" },
  emptyText: { fontSize: 18, fontWeight: "600" },
  emptySub: { marginTop: 5, fontSize: 14, color: "#666" },
});
