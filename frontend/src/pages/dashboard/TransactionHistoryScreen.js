// frontend/screens/TransactionHistoryScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import {
  getDepositHistoryApi,
  getPurchaseHistoryApi,
  getWithdrawalHistoryApi,
} from "../../utils/api";

const TransactionHistoryScreen = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const depositRes = await getDepositHistoryApi();
      const purchaseRes = await getPurchaseHistoryApi();
      const withdrawalRes = await getWithdrawalHistoryApi();

      const merged = [
        ...depositRes.data.map((t) => ({ ...t, type: "deposit" })),
        ...purchaseRes.data.map((t) => ({ ...t, type: "purchase" })),
        ...withdrawalRes.data.map((t) => ({ ...t, type: "withdrawal" })),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setTransactions(merged);
    } catch (err) {
      console.log("History error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  // Convert timestamps to readable groups
  const getDateLabel = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    return date.toDateString();
  };

  const renderItem = ({ item }) => {
    const isDeposit = item.type === "deposit";
    const isPurchase = item.type === "purchase";
    const isWithdrawal = item.type === "withdrawal";

    const color =
      isDeposit ? "#089981" : isWithdrawal ? "#d9534f" : "#d9844f";

    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.title}>
            {isDeposit && "Deposit"}
            {isPurchase && "Data Purchase"}
            {isWithdrawal && "Withdrawal"}
          </Text>

          <Text style={[styles.amount, { color }]}>
            {isDeposit && `+₦${item.amount}`}
            {isPurchase && `-₦${item.amount}`}
            {isWithdrawal && `-₦${item.amount}`}
          </Text>
        </View>

        {/* Purchase details */}
        {isPurchase && (
          <Text style={styles.subText}>
            {item.network} • {item.plan} • {item.mobile}
          </Text>
        )}

        {/* Withdrawal status */}
        {isWithdrawal && (
          <Text style={styles.subText}>Status: {item.status}</Text>
        )}

        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
    );
  };

  const groupByDate = () => {
    const groups = {};

    transactions.forEach((txn) => {
      const label = getDateLabel(txn.createdAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(txn);
    });

    return Object.keys(groups).map((label) => ({
      title: label,
      data: groups[label],
    }));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#089981" />
      </View>
    );
  }

  return (
    <FlatList
      data={groupByDate()}
      keyExtractor={(item, index) => index.toString()}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderItem={({ item }) => (
        <View>
          <Text style={styles.sectionTitle}>{item.title}</Text>
          {item.data.map((txn, index) => (
            <View key={index}>{renderItem({ item: txn })}</View>
          ))}
        </View>
      )}
    />
  );
};

export default TransactionHistoryScreen;

// ---------------------------------------------

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 18,
    fontWeight: "bold",
    backgroundColor: "#f1f1f1",
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    fontWeight: "600",
    fontSize: 16,
    color: "#111",
  },
  amount: {
    fontWeight: "bold",
    fontSize: 17,
  },
  date: {
    fontSize: 12,
    color: "#777",
    marginTop: 5,
  },
  subText: {
    color: "#555",
    fontSize: 14,
  },
});
