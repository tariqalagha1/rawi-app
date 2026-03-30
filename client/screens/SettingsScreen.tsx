import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { RawiColors, Spacing, BorderRadius } from "@/constants/theme";
import { useSettings } from "@/contexts/SettingsContext";
import { useLanguage } from "@/contexts/LanguageContext";

type VolumeBoost = "1x" | "2x" | "3x" | "5x" | "7x" | "10x" | "auto";

const VOICE_OPTIONS = [
  { id: "ash", label: "Ash" },
  { id: "ballad", label: "Ballad" },
  { id: "coral", label: "Coral" },
  { id: "sage", label: "Sage" },
  { id: "verse", label: "Verse" },
];

interface SettingsScreenProps {
  navigation: any;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const { volumeBoost, setVolumeBoost } = useSettings();
  const { language, setLanguage, t } = useLanguage();
  const [selectedVoice, setSelectedVoice] = useState("ash");
  const [userName, setUserName] = useState("");

  const VOLUME_OPTIONS: { id: VolumeBoost; label: string }[] = [
    { id: "auto", label: t("volumeAuto") },
    { id: "1x", label: "1x" },
    { id: "2x", label: "2x" },
    { id: "3x", label: "3x" },
    { id: "5x", label: "5x" },
    { id: "10x", label: "10x" },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const voice = await AsyncStorage.getItem("@selected_voice");
      if (voice) setSelectedVoice(voice);
      const userData = await AsyncStorage.getItem("@user_data");
      if (userData) {
        const parsed = JSON.parse(userData);
        setUserName(parsed.name || "");
      }
    } catch {}
  };

  const handleVoiceChange = async (voiceId: string) => {
    setSelectedVoice(voiceId);
    await AsyncStorage.setItem("@selected_voice", voiceId);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("@is_logged_in");
    await AsyncStorage.removeItem("@user_data");
    navigation.reset({
      index: 0,
      routes: [{ name: "Welcome" }],
    });
  };

  const isRTL = language === "ar";

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} testID="button-back">
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={24} color={RawiColors.textPrimary} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>{t("settings")}</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {userName ? (
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.profileSection}>
            <View style={styles.profileIcon}>
              <Feather name="user" size={28} color={RawiColors.primary} />
            </View>
            <ThemedText style={styles.profileName}>{userName}</ThemedText>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <ThemedText style={[styles.sectionTitle, !isRTL ? styles.textLeft : null]}>{t("voice")}</ThemedText>
          <View style={styles.card}>
            <ThemedText style={[styles.cardLabel, !isRTL ? styles.textLeft : null]}>{t("chooseVoice")}</ThemedText>
            <View style={styles.optionsRow}>
              {VOICE_OPTIONS.map((voice) => (
                <Pressable
                  key={voice.id}
                  style={[
                    styles.optionChip,
                    selectedVoice === voice.id ? styles.optionChipActive : null,
                  ]}
                  onPress={() => handleVoiceChange(voice.id)}
                  testID={`button-voice-${voice.id}`}
                >
                  <ThemedText
                    style={[
                      styles.optionChipText,
                      selectedVoice === voice.id ? styles.optionChipTextActive : null,
                    ]}
                  >
                    {voice.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <ThemedText style={[styles.sectionTitle, !isRTL ? styles.textLeft : null]}>{t("language")}</ThemedText>
          <View style={styles.card}>
            <ThemedText style={[styles.cardLabel, !isRTL ? styles.textLeft : null]}>{t("appLanguage")}</ThemedText>
            <View style={styles.optionsRow}>
              <Pressable
                style={[styles.optionChip, language === "ar" ? styles.optionChipActive : null]}
                onPress={() => setLanguage("ar")}
                testID="button-lang-ar"
              >
                <ThemedText style={[styles.optionChipText, language === "ar" ? styles.optionChipTextActive : null]}>
                  {t("arabic")}
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.optionChip, language === "en" ? styles.optionChipActive : null]}
                onPress={() => setLanguage("en")}
                testID="button-lang-en"
              >
                <ThemedText style={[styles.optionChipText, language === "en" ? styles.optionChipTextActive : null]}>
                  {t("english")}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <ThemedText style={[styles.sectionTitle, !isRTL ? styles.textLeft : null]}>{t("volumeLevel")}</ThemedText>
          <View style={styles.card}>
            <ThemedText style={[styles.cardLabel, !isRTL ? styles.textLeft : null]}>{t("volumeBoost")}</ThemedText>
            <View style={styles.optionsRow}>
              {VOLUME_OPTIONS.map((vol) => (
                <Pressable
                  key={vol.id}
                  style={[
                    styles.optionChip,
                    volumeBoost === vol.id ? styles.optionChipActive : null,
                  ]}
                  onPress={() => setVolumeBoost(vol.id)}
                  testID={`button-volume-${vol.id}`}
                >
                  <ThemedText
                    style={[
                      styles.optionChipText,
                      volumeBoost === vol.id ? styles.optionChipTextActive : null,
                    ]}
                  >
                    {vol.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <ThemedText style={[styles.sectionTitle, !isRTL ? styles.textLeft : null]}>{t("account")}</ThemedText>
          <Pressable style={styles.logoutButton} onPress={handleLogout} testID="button-logout">
            <Feather name="log-out" size={20} color={RawiColors.error} />
            <ThemedText style={styles.logoutText}>{t("logout")}</ThemedText>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.versionContainer}>
          <ThemedText style={styles.versionText}>{t("appName")} v1.0.0</ThemedText>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RawiColors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 200, 255, 0.1)",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: RawiColors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  profileIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0, 200, 255, 0.1)",
    borderWidth: 2,
    borderColor: RawiColors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: RawiColors.textPrimary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: RawiColors.textSecondary,
    marginBottom: Spacing.sm,
    textAlign: "right",
  },
  textLeft: {
    textAlign: "left",
  },
  card: {
    backgroundColor: RawiColors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(0, 200, 255, 0.1)",
  },
  cardLabel: {
    fontSize: 16,
    color: RawiColors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: "right",
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  optionChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(0, 200, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 255, 0.15)",
  },
  optionChipActive: {
    backgroundColor: RawiColors.primary,
    borderColor: RawiColors.primary,
  },
  optionChipText: {
    fontSize: 14,
    color: RawiColors.textSecondary,
    fontWeight: "500",
  },
  optionChipTextActive: {
    color: "#080C14",
    fontWeight: "700",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: RawiColors.surface,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.2)",
    marginBottom: Spacing.xl,
  },
  logoutText: {
    fontSize: 16,
    color: RawiColors.error,
    fontWeight: "500",
  },
  versionContainer: {
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  versionText: {
    fontSize: 13,
    color: RawiColors.textSecondary,
    opacity: 0.5,
  },
});
