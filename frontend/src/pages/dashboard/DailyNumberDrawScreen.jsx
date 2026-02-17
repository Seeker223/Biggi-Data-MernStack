//frontend/app/screens/DailyNumberDrawScreen.jsx
import React, { useState, useContext, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ConfettiCannon from "react-native-confetti-cannon";   // ✅ NEW CONFETTI
import { Audio } from "expo-av";
import { AuthContext } from "../../context/AuthContext";
import { router } from "expo-router"; 

import api from "../../utils/api";
import { FEATURE_FLAGS } from "../../constants/featureFlags";

const { width } = Dimensions.get("window");
const BOX_SIZE = width / 10 - 5;

export default function DailyNumberDrawScreen() {
  const { user, refreshUser } = useContext(AuthContext);

  if (FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: "#fff", fontSize: 18, textAlign: "center", marginBottom: 12 }}>
          The Daily Number Draw feature is temporarily disabled for Play Store review.
        </Text>
        <TouchableOpacity
          style={[styles.submitButton, { width: 180 }]}
          onPress={() => router.push("/")}
        >
          <Text style={styles.submitText}>Return Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [toast, setToast] = useState("");

  const [showWinnerFlash, setShowWinnerFlash] = useState(false);
  const [playAgainModal, setPlayAgainModal] = useState(false);

  const confettiRef = useRef(null);

  // animations
  const toastAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  /* ------------------------------------------------------------------ */
  /*                     PLAY WIN SOUND EFFECT                          */
  /* ------------------------------------------------------------------ */
  const playWinSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/sounds/win.wav")
      );
      await sound.playAsync();
    } catch (err) {
      console.log("Sound failed:", err);
    }
  };

  /* ------------------------------------------------------------------ */
  /*            WIN EFFECT (Flash + Confetti + Sound)                   */
  /* ------------------------------------------------------------------ */
  const triggerWinEffects = () => {
    setShowWinnerFlash(true);

    // fire confetti once
    if (confettiRef.current) {
      confettiRef.current.start();
    }

    playWinSound();

    setTimeout(() => {
      setShowWinnerFlash(false);
    }, 1500);
  };

  useEffect(() => {
    const last = user?.dailyNumberDraw?.slice(-1)[0];
    if (last?.isWinner) {
      triggerWinEffects();
    }
  }, [user]);

  /* ------------------------------------------------------------------ */
  /*                        BUTTON PULSE EFFECT                         */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.07,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  /* ------------------------------------------------------------------ */
  /*                                TOAST                               */
  /* ------------------------------------------------------------------ */
  const showToast = (msg) => {
    setToast(msg);
    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }, 1500);
    });
  };

  /* ------------------------------------------------------------------ */
  /*                       NUMBER SELECTION (1–70)                      */
  /* ------------------------------------------------------------------ */
  const toggleNumber = (num) => {
    if (user?.tickets <= 0) {
      setPlayAgainModal(true);
      return;
    }

    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter((n) => n !== num));
      return;
    }

    if (selectedNumbers.length < 5) {
      setSelectedNumbers([...selectedNumbers, num]);
    } else {
      showToast("You can’t select more than 5 numbers");
    }
  };

  /* ------------------------------------------------------------------ */
  /*                            SUBMIT PLAY                             */
  /* ------------------------------------------------------------------ */
  const handleSubmit = async () => {
    if (user?.tickets <= 0) {
      shake();
      setPlayAgainModal(true);
      return;
    }

    if (selectedNumbers.length !== 5) return;

    setSubmitting(true);

    try {
      const res = await api.post("/daily-game/play", {
        numbers: selectedNumbers,
      });

      if (res.data.success) {
        await refreshUser();
        setSelectedNumbers([]);
        setSuccessModal(true);
      } else {
        showToast(res.data.message || "Something went wrong");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to submit");
    }

    setSubmitting(false);
  };

  /* ------------------------------------------------------------------ */
  /*                             SHAKE EFFECT                           */
  /* ------------------------------------------------------------------ */
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.container}>

      {/* CONFETTI — new cannon version */}
      <ConfettiCannon
        ref={confettiRef}
        count={200}
        origin={{ x: width / 2, y: 0 }}
        fadeOut={true}
        autoStart={false}
      />

      {/* WIN FLASH */}
      {showWinnerFlash && (
        <View style={styles.flashOverlay}>
          <Text style={styles.flashText}>YOU WON 🎉</Text>
        </View>
      )}

      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.title}>Daily Number Draw</Text>

        <TouchableOpacity
          onPress={() => router.push("/screens/DailyHistoryScreen")}
        >
          <Ionicons name="time-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <View style={styles.body}>
        <Text style={styles.subText}>
          Select 5 lucky numbers (1–70).{"\n"}Each play uses 1 ticket.
        </Text>

        {/* Tickets */}
        <View style={styles.ticketRow}>
          <Ionicons name="ticket-outline" size={22} color="#FF8C00" />
          <Text style={styles.ticketText}>{user?.tickets || 0} Tickets Left</Text>
        </View>

        <Text style={styles.chooseText}>Choose 5 numbers</Text>

        {/* GRID */}
        <View style={styles.grid}>
          {Array.from({ length: 70 }, (_, i) => i + 1).map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.numberBox,
                selectedNumbers.includes(num) && styles.selectedBox,
              ]}
              onPress={() => toggleNumber(num)}
            >
              <Text
                style={[
                  styles.numberText,
                  selectedNumbers.includes(num) && styles.selectedText,
                ]}
              >
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SUBMIT BUTTON */}
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }, { translateX: shakeAnim }],
            alignSelf: "center",
            width: "60%",
          }}
        >
          <TouchableOpacity
            style={[
              styles.submitButton,
              selectedNumbers.length === 5 && styles.submitActive,
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Submit</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* SUBMIT SUCCESS */}
      <Modal visible={successModal} transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={65} color="#4CD964" />
            <Text style={styles.modalTitle}>Submitted!</Text>
            <Text style={styles.modalSubtitle}>Check results at 7:00pm.</Text>

            <TouchableOpacity
              style={styles.okButton}
              onPress={() => setSuccessModal(false)}
            >
              <Text style={styles.okText}>Ok</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* NO TICKETS MODAL */}
      <Modal visible={playAgainModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="alert-circle" size={60} color="#FF3B30" />
            <Text style={styles.modalTitle}>No Tickets!</Text>
            <Text style={styles.modalSubtitle}>You need a ticket to play.</Text>

            <TouchableOpacity
              style={styles.okButton}
              onPress={() => setPlayAgainModal(false)}
            >
              <Text style={styles.okText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* TOAST */}
      <Animated.View
        style={[
          styles.toast,
          {
            opacity: toastAnim,
            transform: [
              {
                translateY: toastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.toastText}>{toast}</Text>
      </Animated.View>
    </View>
  );
}

/* ---------------------------------------------------------------------- */
/*                               STYLES                                   */
/* ---------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    justifyContent: "space-between",
  },

  title: {
    color: "#FF8C00",
    fontSize: 22,
    fontWeight: "800",
  },

  body: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 20,
  },

  subText: {
    fontSize: 13.5,
    color: "#000",
    lineHeight: 19,
    textAlign: "center",
  },

  ticketRow: {
    flexDirection: "row",
    alignSelf: "center",
    marginTop: 10,
    alignItems: "center",
  },

  ticketText: {
    marginLeft: 8,
    fontWeight: "700",
    color: "#000",
    fontSize: 15,
  },

  chooseText: {
    textAlign: "center",
    marginVertical: 12,
    fontSize: 14,
    color: "#666",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },

  numberBox: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    margin: 4,
    justifyContent: "center",
    alignItems: "center",
  },

  numberText: { fontSize: 14, color: "#000" },

  selectedBox: {
    backgroundColor: "#FF8C00",
    borderColor: "#FF8C00",
  },

  selectedText: { color: "#fff", fontWeight: "bold" },

  submitButton: {
    backgroundColor: "#ccc",
    paddingVertical: 12,
    borderRadius: 30,
  },

  submitActive: {
    backgroundColor: "#FF8C00",
  },

  submitText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    backgroundColor: "#fff",
    width: "75%",
    borderRadius: 15,
    alignItems: "center",
    paddingVertical: 35,
  },

  modalTitle: {
    fontSize: 20,
    marginTop: 10,
    fontWeight: "700",
    color: "#000",
  },

  modalSubtitle: {
    color: "#555",
    marginBottom: 20,
    marginTop: 5,
  },

  okButton: {
    backgroundColor: "#FF8C00",
    paddingHorizontal: 40,
    paddingVertical: 10,
    borderRadius: 25,
  },

  okText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  toast: {
    position: "absolute",
    bottom: 90,
    alignSelf: "center",
    backgroundColor: "#333",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },

  toastText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  flashOverlay: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255,255,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  flashText: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#FFD700",
  },
});
