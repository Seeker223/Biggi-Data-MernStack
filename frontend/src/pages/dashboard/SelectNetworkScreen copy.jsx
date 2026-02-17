import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";

const SelectNetworkScreen = () => {
  const navigation = useNavigation();
  const [selected, setSelected] = useState(null);

  const networks = [
    { id: "mtn", name: "MTN", logo: require("../../assets/images/mtn.png"), categories: ["SME", "GIFTING"] },
    { id: "airtel", name: "Airtel", logo: require("../../assets/images/airtel.png"), categories: ["SME", "GIFTING"] },
    { id: "glo", name: "Glo", logo: require("../../assets/images/glo.png"), categories: ["SME", "CG", "GIFTING"] },
    { id: "etisalat", name: "9mobile", logo: require("../../assets/images/9mobile.png"), categories: ["SME", "CG", "GIFTING"] },
  ];

  const handleSelect = (item) => {
    setSelected(item.id);
    setTimeout(() => {
      navigation.navigate("screens/SelectPlanScreen", {
        selectedNetwork: item.name,
        networkCode: item.id,
        categories: item.categories,
      });
    }, 150);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Network</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {networks.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, selected === item.id && styles.cardSelected]}
            onPress={() => handleSelect(item)}
          >
            <Image source={item.logo} style={styles.logo} resizeMode="contain" />
            <View>
              <Text style={styles.networkName}>{item.name}</Text>
              <Text style={styles.categoryText}>{item.categories.join(" • ")}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SelectNetworkScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20, paddingTop: 15 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 16, fontWeight: "600", color: "#000", marginLeft: 10 },
  card: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ccc", borderRadius: 10, paddingVertical: 15, paddingHorizontal: 20, marginBottom: 15 },
  cardSelected: { borderColor: "#FF7A00", borderWidth: 2 },
  logo: { width: 40, height: 40, marginRight: 18 },
  networkName: { fontSize: 15, fontWeight: "600", color: "#000" },
  categoryText: { fontSize: 12, color: "#444", marginTop: 3 },
});
