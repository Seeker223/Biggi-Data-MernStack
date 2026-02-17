// app/resetpassword.jsx
import React, { useState } from "react";
import { View, TextInput, Button, Text } from "react-native";
import { useRouter, useSearchParams } from "expo-router";
import api from "../utils/api";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useSearchParams(); // URL: resetpassword?token=...
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await api.put(`/auth/resetpassword/${token}`, { password });
      setSuccess("Password reset successfully. Redirecting to login...");
      setError("");
      setTimeout(() => router.replace("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Reset failed.");
      setSuccess("");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Reset Password</Text>
      <TextInput
        placeholder="New Password"
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
        onChangeText={setPassword}
      />
      <TextInput
        placeholder="Confirm New Password"
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
        onChangeText={setConfirmPassword}
      />
      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
      {success ? <Text style={{ color: "green" }}>{success}</Text> : null}
      <Button title="Reset Password" onPress={handleResetPassword} />
    </View>
  );
}
