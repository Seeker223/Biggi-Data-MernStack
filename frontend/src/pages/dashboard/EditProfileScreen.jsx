import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import Header from "../../components/Header";
import FloatingBottomNav from "../../components/FloatingBottomNav";
import * as ImagePicker from "expo-image-picker";
import { fetchUser, updateUserProfile, updateAvatar } from "../../utils/api";

export default function EditProfileScreen() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");

  // ----------------------------------------------------
  // Load user info
  // ----------------------------------------------------
  const loadUser = async () => {
    try {
      const res = await fetchUser();
      const u = res.data.user;

      setUsername(u.username);
      setPhone(u.phoneNumber || "");
      setEmail(u.email || "");
      setAvatar(u.photo || null);
      setUserId(u._id?.slice(-8));
    } catch (err) {
      console.log("User fetch failed:", err);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // ----------------------------------------------------
  // Pick Image (avatar)
  // ----------------------------------------------------
  const pickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const img = result.assets[0];
        setAvatar(img.uri);
        await uploadAvatar(img);
      }
    } catch (err) {
      console.log("Picker error:", err);
      Alert.alert("Error", "Failed to select image.");
    }
  };

  // ----------------------------------------------------
  // Upload Avatar
  // ----------------------------------------------------
  const uploadAvatar = async (image) => {
    try {
      setLoading(true);
      const fileUri = image.uri.startsWith("file://") ? image.uri : `file://${image.uri}`;

      const formData = new FormData();
      formData.append("avatar", {
        uri: fileUri,
        type: "image/jpeg",
        name: "avatar.jpg",
      });

      const res = await updateAvatar(formData);

      if (res.data?.success) {
        setAvatar(res.data.user.photo);
        Alert.alert("Success", "Avatar updated successfully!");
      } else {
        Alert.alert("Error", res.data?.msg || "Upload failed");
      }
    } catch (err) {
      console.log("Avatar upload failed:", err);
      Alert.alert("Error", "Failed to upload avatar.");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // Update profile
  // ----------------------------------------------------
  const submitProfile = async () => {
    try {
      setLoading(true);

      const payload = {
        username,
        phoneNumber: phone,
        email,
      };

      const res = await updateUserProfile(payload);

      if (res.data?.success) {
        Alert.alert("Success", "Profile updated successfully!");
      } else {
        Alert.alert("Error", res.data?.msg || "Update failed");
      }
    } catch (err) {
      console.log("Profile update error:", err);
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Edit My Profile" />

      <View style={styles.content}>
        <TouchableOpacity onPress={pickAvatar}>
          <Image
            source={{
              uri: avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            }}
            style={styles.avatar}
          />
        </TouchableOpacity>

        <Text style={styles.name}>{username || "Loading..."}</Text>
        <Text style={styles.id}>ID: {userId}</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Username</Text>
          <TextInput style={styles.input} value={username} onChangeText={setUsername} />

          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} />

          <Text style={styles.label}>Email Address</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} />

          <View style={styles.toggleRow}>
            <Text style={styles.label}>Push Notifications</Text>
            <Switch
              trackColor={{ false: "#ccc", true: "#FF7A00" }}
              thumbColor="#fff"
              onValueChange={() => setIsEnabled(!isEnabled)}
              value={isEnabled}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={submitProfile}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update Profile</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <FloatingBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  content: {
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingTop: 30,
    flex: 1,
  },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: "#000" },
  name: { fontSize: 18, fontWeight: "700", marginTop: 10, color: "#003322" },
  id: { color: "#555" },
  section: { width: "85%", marginTop: 30 },
  label: { color: "#000", fontSize: 14, marginTop: 15 },
  input: { backgroundColor: "#D9D9D9", borderRadius: 10, padding: 10, marginTop: 5 },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 15 },
  button: { backgroundColor: "#FF7A00", padding: 15, borderRadius: 25, alignItems: "center", marginTop: 25 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
