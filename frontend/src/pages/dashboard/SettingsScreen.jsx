import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";
import { useNavigation } from "@react-navigation/native";
import FloatingBottomNav from "../../components/FloatingBottomNav";

export default function SettingsScreen() {
  const navigation = useNavigation();

  const settings = [
    { icon: "notifications-outline", label: "Notification Settings", route: "screens/NotificationSettingsScreen" },
    { icon: "lock-closed-outline", label: "Password Settings", route: "resetpassword" },
    { icon: "information-circle-outline", label: "Terms And Conditions", route:"screens/terms" },
    { icon: "trash-outline", label: "Delete Account", route:"screens/deleteAccount" },
  ];

  return (
    <View style={styles.container}>
      <Header title="Settings" />

      <View style={styles.content}>
        {settings.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.option}
            onPress={() => item.route && navigation.navigate(item.route)}
          >
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon} size={22} color="#fff" />
            </View>
            <Text style={styles.label}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#555" style={{ marginLeft: "auto" }} />
          </TouchableOpacity>
        ))}
      </View>

      <FloatingBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  content: {
    flex: 1,
    padding: 25,
    backgroundColor: "#F5F5F5",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    marginTop: 5,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircle: {
    backgroundColor: "#007BFF",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  label: { marginLeft: 15, fontSize: 16, color: "#000", fontWeight: "500" },
});
