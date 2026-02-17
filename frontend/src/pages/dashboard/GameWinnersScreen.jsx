// frontend/app/screens/GameWinnersScreen.jsx
import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../context/AuthContext";
import { FEATURE_FLAGS } from "../../constants/featureFlags";

export default function GameWinnersScreen() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  
  const [activeTab, setActiveTab] = useState("daily"); // 'daily' or 'monthly'
  const [successVisible, setSuccessVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [monthlyProgress, setMonthlyProgress] = useState({
    purchases: 0,
    required: 5,
    isEligible: false
  });

  useEffect(() => {
    if (user) {
      const purchases = user.dataBundleCount || 0;
      setMonthlyProgress({
        purchases,
        required: 5,
        isEligible: purchases >= 5
      });
    }
  }, [user]);

  // Get user's wins from dailyNumberDraw
  const userWins = (user?.dailyNumberDraw || [])
    .filter(game => game.isWinner)
    .map(game => ({
      name: user?.username || "You",
      id: user?._id?.slice(-6) || "000000",
      type: "daily",
      amount: FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "—" : "₦2,000",
      date: new Date(game.createdAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      numbers: game.numbers || [],
      result: game.result || []
    }));

  // Sample monthly winners
  const monthlyWinners = [
    { 
      name: "Michael Brown", 
      id: "789012", 
      amount: FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "—" : "₦5,000", 
      date: "Jan 31, 2024",
      note: "Monthly Draw Winner"
    },
    { 
      name: "James Wilson", 
      id: "345678", 
      amount: FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "—" : "₦5,000", 
      date: "Dec 31, 2023",
      note: "Monthly Draw Winner"
    },
    { 
      name: "Robert Taylor", 
      id: "901234", 
      amount: FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "—" : "₦5,000", 
      date: "Nov 30, 2023",
      note: "Monthly Draw Winner"
    },
  ];

  // Sample daily winners
  const dailyWinners = [
    { 
      name: "Alex Johnson", 
      id: "123456", 
      amount: FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "—" : "₦2,000", 
      date: "Today, 7:30 PM",
      numbers: [15, 23, 42, 56, 68]
    },
    { 
      name: "Sarah Williams", 
      id: "234567", 
      amount: FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "—" : "₦2,000", 
      date: "Yesterday, 7:30 PM",
      numbers: [8, 19, 34, 47, 62]
    },
    { 
      name: "Emma Davis", 
      id: "456789", 
      amount: FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "—" : "₦2,000", 
      date: "2 Days Ago, 7:30 PM",
      numbers: [3, 27, 41, 55, 70]
    },
    ...userWins,
  ];

  const winners = activeTab === "daily" ? dailyWinners.slice(0, 10) : monthlyWinners;

  const handleClaim = () => {
    if (FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM) {
      Alert.alert("Feature Disabled", "Claiming rewards is temporarily disabled for Play Store review.");
      return;
    }
    if (userWins.length > 0) {
      const totalWinnings = FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? 0 : userWins.length * 2000;
      setSuccessVisible(true);
      
      // In a real app, you would call an API here to claim rewards
      // For now, we'll just show the success modal
    } else {
      Alert.alert(
        "No Rewards to Claim",
        "You don't have any unclaimed rewards yet.\n\n" +
        "Keep playing daily draws to win prizes!",
        [
          { text: "Close", style: "cancel" },
          { text: "Play Daily Draw", onPress: () => navigation.navigate("screens/DailyNumberDrawScreen") }
        ]
      );
    }
  };

  const handleCheckMonthlyEligibility = () => {
    Alert.alert(
      "Monthly Draw Eligibility",
      FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM
        ? `You need ${monthlyProgress.required} data purchases this month to qualify for the monthly draw (prize hidden).\n\n` +
          `Your purchases this month: ${monthlyProgress.purchases}/${monthlyProgress.required}\n` +
          `Status: ${monthlyProgress.isEligible ? "🎉 ELIGIBLE!" : "Not yet eligible"}\n\n` +
          `Monthly draw happens at the end of each month.\n` +
          `Winners are automatically selected from all eligible players.`
        : `You need ${monthlyProgress.required} data purchases this month to qualify for the ₦5,000 monthly draw.\n\n` +
          `Your purchases this month: ${monthlyProgress.purchases}/${monthlyProgress.required}\n` +
          `Status: ${monthlyProgress.isEligible ? "🎉 ELIGIBLE!" : "Not yet eligible"}\n\n` +
          `Monthly draw happens at the end of each month.\n` +
          `Winners are automatically selected from all eligible players.`,
      [
        { text: "Close", style: "cancel" },
        { text: "Buy Data", onPress: () => navigation.navigate("screens/BuyDataScreen") }
      ]
    );
  };

  return (
    <LinearGradient colors={["#2B006A", "#A000A6"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Game Winners</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Card Container */}
      <View style={styles.card}>
        {/* Title */}
        <LinearGradient
          colors={["#FFA500", "#FFD700"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.titleContainer}
        >
          <Text style={styles.title}>Winners Board</Text>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "daily" && styles.activeTab]}
            onPress={() => setActiveTab("daily")}
          >
            <Ionicons 
              name="calendar" 
              size={16} 
              color={activeTab === "daily" ? "#FFF" : "#666"} 
            />
            <Text style={[styles.tabText, activeTab === "daily" && styles.activeTabText]}>
              Daily Winners
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "monthly" && styles.activeTab]}
            onPress={() => setActiveTab("monthly")}
          >
            <Ionicons 
              name="trophy" 
              size={16} 
              color={activeTab === "monthly" ? "#FFF" : "#666"} 
            />
            <Text style={[styles.tabText, activeTab === "monthly" && styles.activeTabText]}>
              Monthly Winners
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Prize</Text>
              <Text style={styles.infoValue}>
                {FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "Prize hidden" : (activeTab === "daily" ? "₦2,000" : "₦5,000")}
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Draw Time</Text>
              <Text style={styles.infoValue}>
                {activeTab === "daily" ? "7:30 PM Daily" : "End of Month"}
              </Text>
            </View>
          </View>
        </View>

        {/* Winners List */}
        <ScrollView 
          style={styles.winnersList} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.winnersListContent}
        >
          {winners.map((winner, index) => (
            <View key={`${winner.id}-${index}`} style={styles.winnerRow}>
              <View style={styles.winnerInfo}>
                <View style={[
                  styles.winnerAvatar,
                  winner.type === "monthly" ? styles.monthlyAvatar : styles.dailyAvatar
                ]}>
                  <Text style={styles.winnerInitial}>
                    {winner.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.winnerDetails}>
                  <Text style={styles.winnerName}>{winner.name}</Text>
                  <Text style={styles.winnerDate}>{winner.date}</Text>
                  {winner.numbers && (
                    <Text style={styles.winnerNumbers}>
                      Numbers: {winner.numbers.join(", ")}
                    </Text>
                  )}
                  {winner.note && (
                    <Text style={styles.winnerNote}>{winner.note}</Text>
                  )}
                </View>
              </View>
              <View style={styles.winnerPrize}>
                <Text style={styles.winnerAmount}>{FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "—" : winner.amount}</Text>
                <View style={[
                  styles.winnerTypeBadge,
                  winner.type === "monthly" ? styles.monthlyBadge : styles.dailyBadge
                ]}>
                  <Text style={styles.winnerTypeText}>
                    {winner.type === "monthly" ? "MONTHLY" : "DAILY"}
                  </Text>
                </View>
              </View>
            </View>
          ))}
          
          {winners.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={50} color="#CCC" />
              <Text style={styles.emptyText}>
                No {activeTab} winners to display yet
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.claimButton, FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM && { opacity: 0.6 }]}
            onPress={handleClaim}
            disabled={userWins.length === 0 || FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM}
          >
            <Ionicons name="cash" size={18} color="#FFF" />
            <Text style={styles.claimButtonText}>
              {FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "Claiming Disabled" : (userWins.length > 0 ? `Claim ₦${userWins.length * 2000}` : "No Rewards")}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.infoButton]}
            onPress={handleCheckMonthlyEligibility}
          >
            <Ionicons name="information-circle" size={18} color="#FFF" />
            <Text style={styles.infoButtonText}>
              Monthly Eligibility
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Your Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userWins.length}</Text>
              <Text style={styles.statLabel}>Total Wins</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.tickets || 0}</Text>
              <Text style={styles.statLabel}>Available Tickets</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{monthlyProgress.purchases}</Text>
              <Text style={styles.statLabel}>Monthly Purchases</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Success Modal */}
      <Modal transparent visible={successVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={40} color="#fff" />
            </View>
            <Text style={styles.successTitle}>Rewards Claimed!</Text>
            <Text style={styles.successMsg}>
              {FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "Rewards have been added to your reward balance." : `₦${userWins.length * 2000} has been added to your reward balance.`}
            </Text>
            <Text style={styles.successSubtext}>
              You can redeem your rewards anytime from your wallet.
            </Text>

            <TouchableOpacity
              style={styles.okButton}
              onPress={() => {
                setSuccessVisible(false);
                navigation.navigate("redeemScreen");
              }}
            >
              <Text style={styles.okText}>View Wallet</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.okButton, { backgroundColor: "#666", marginTop: 8 }]}
              onPress={() => setSuccessVisible(false)}
            >
              <Text style={styles.okText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 45,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#fff",
    margin: 20,
    marginTop: 10,
    borderRadius: 30,
    padding: 20,
    flex: 1,
  },
  titleContainer: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    padding: 4,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  activeTab: {
    backgroundColor: "#FF7A00",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#FFF",
  },
  infoCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  infoItem: {
    alignItems: "center",
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF7A00",
  },
  infoDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E0E0E0",
  },
  winnersList: {
    flex: 1,
  },
  winnersListContent: {
    paddingBottom: 10,
  },
  winnerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  winnerInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  winnerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  dailyAvatar: {
    backgroundColor: "#FF7A0020",
  },
  monthlyAvatar: {
    backgroundColor: "#8E2DE220",
  },
  winnerInitial: {
    color: "#FF7A00",
    fontSize: 18,
    fontWeight: "700",
  },
  winnerDetails: {
    flex: 1,
  },
  winnerName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  winnerDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  winnerNumbers: {
    fontSize: 11,
    color: "#888",
    fontStyle: "italic",
  },
  winnerNote: {
    fontSize: 11,
    color: "#8E2DE2",
    fontWeight: "500",
    marginTop: 2,
  },
  winnerPrize: {
    alignItems: "flex-end",
    marginLeft: 10,
  },
  winnerAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF7A00",
    marginBottom: 4,
  },
  winnerTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dailyBadge: {
    backgroundColor: "#FF7A0010",
  },
  monthlyBadge: {
    backgroundColor: "#8E2DE210",
  },
  winnerTypeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#666",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#999",
    fontSize: 14,
    marginTop: 10,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    marginBottom: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  claimButton: {
    backgroundColor: "#FF7A00",
  },
  claimButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  infoButton: {
    backgroundColor: "#8E2DE2",
  },
  infoButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  statsContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 15,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 15,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FF7A00",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E0E0E0",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: 300,
    padding: 25,
    alignItems: "center",
  },
  checkCircle: {
    backgroundColor: "#32CD32",
    width: 65,
    height: 65,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  successTitle: { fontSize: 20, fontWeight: "bold", color: "#000", marginBottom: 8 },
  successMsg: {
    textAlign: "center",
    color: "#666",
    marginVertical: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  successSubtext: {
    textAlign: "center",
    color: "#888",
    fontSize: 12,
    marginBottom: 20,
  },
  okButton: {
    backgroundColor: "#FF7A00",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  okText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});