import React from "react";
import {
  StyleSheet,
  View,
  Pressable,
  Dimensions,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  FadeIn,
  FadeInUp,
  FadeInDown,
} from "react-native-reanimated";
import { useEffect } from "react";

import { ThemedText } from "@/components/ThemedText";
import { RawiColors, Spacing, BorderRadius } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";

import welcomeIllustration from "../assets/images/welcome-illustration.png";

const { width, height } = Dimensions.get("window");

interface WelcomeScreenProps {
  navigation: any;
}

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  
  const floatY1 = useSharedValue(0);
  const floatY2 = useSharedValue(0);
  const floatY3 = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    floatY1.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 2000 }),
        withTiming(12, { duration: 2000 })
      ),
      -1,
      true
    );
    floatY2.value = withRepeat(
      withSequence(
        withTiming(12, { duration: 2500 }),
        withTiming(-12, { duration: 2500 })
      ),
      -1,
      true
    );
    floatY3.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1800 }),
        withTiming(10, { duration: 1800 })
      ),
      -1,
      true
    );
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const floatStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY1.value }],
  }));

  const floatStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY2.value }],
  }));

  const floatStyle3 = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY3.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleStart = () => {
    navigation.navigate("Login");
  };

  const illustrationSize = Math.min(width * 0.52, 220);

  return (
    <View style={styles.container}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <Animated.View entering={FadeIn.delay(100).duration(600)} style={[styles.settingsButton, { top: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => navigation.navigate("Settings")}
          style={styles.settingsIcon}
          testID="button-settings"
        >
          <Feather name="settings" size={22} color={RawiColors.textSecondary} />
        </Pressable>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.iconsRow}>
          <Animated.View style={[styles.iconBubble, floatStyle1]}>
            <Feather name="book-open" size={18} color={RawiColors.primary} />
          </Animated.View>
          <Animated.View style={[styles.iconBubble, styles.iconBubbleCenter, floatStyle2]}>
            <Feather name="mic" size={20} color={RawiColors.primary} />
          </Animated.View>
          <Animated.View style={[styles.iconBubble, floatStyle3]}>
            <Feather name="headphones" size={18} color={RawiColors.primary} />
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(800)} style={styles.titleContainer}>
          <ThemedText style={styles.title}>{t("appName")}</ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.subtitleContainer}>
          <ThemedText style={styles.subtitle}>{t("welcomeSubtitle")}</ThemedText>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(500).duration(1000)} style={styles.illustrationContainer}>
          <Animated.View style={[styles.illustrationGlow, pulseStyle, { width: illustrationSize + 40, height: illustrationSize + 40 }]} />
          <View style={[styles.illustrationFrame, { width: illustrationSize + 16, height: illustrationSize + 16 }]}>
            <Image
              source={welcomeIllustration}
              style={{ width: illustrationSize, height: illustrationSize }}
              contentFit="contain"
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).duration(800)} style={styles.featuresContainer}>
          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconWrap}>
                <Feather name="upload-cloud" size={16} color={RawiColors.primary} />
              </View>
              <ThemedText style={styles.featureText}>{t("uploadDoc")}</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIconWrap}>
                <Feather name="mic" size={16} color={RawiColors.primary} />
              </View>
              <ThemedText style={styles.featureText}>{t("talkWithRawway")}</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIconWrap}>
                <Feather name="search" size={16} color={RawiColors.primary} />
              </View>
              <ThemedText style={styles.featureText}>{t("discussContent")}</ThemedText>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(700).duration(800)} style={styles.buttonContainer}>
          <Pressable style={styles.startButton} onPress={handleStart} testID="button-start">
            <View style={styles.buttonGlow} />
            <View style={styles.buttonInner}>
              <ThemedText style={styles.startButtonText}>{t("start")}</ThemedText>
              <Feather name="arrow-left" size={22} color="#080C14" style={{ marginLeft: 8 }} />
            </View>
          </Pressable>

          <ThemedText style={styles.loginHint}>{t("loginOrSignup")}</ThemedText>
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
  settingsButton: {
    position: "absolute",
    left: Spacing.lg,
    zIndex: 10,
  },
  settingsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 200, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  glowTop: {
    position: "absolute",
    top: -100,
    left: "50%",
    marginLeft: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(0, 200, 255, 0.06)",
  },
  glowBottom: {
    position: "absolute",
    bottom: -50,
    left: "50%",
    marginLeft: -200,
    width: 400,
    height: 200,
    borderRadius: 200,
    backgroundColor: "rgba(0, 200, 255, 0.04)",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  iconsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing["2xl"],
    marginBottom: Spacing.lg,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 200, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBubbleCenter: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 200, 255, 0.12)",
    borderColor: "rgba(0, 200, 255, 0.35)",
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 56,
    fontWeight: "bold",
    color: RawiColors.textPrimary,
    letterSpacing: 3,
    lineHeight: 68,
  },
  subtitleContainer: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
    paddingHorizontal: Spacing.xl,
  },
  subtitle: {
    fontSize: 16,
    color: RawiColors.textSecondary,
    textAlign: "center",
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  illustrationContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: Spacing["2xl"],
  },
  illustrationGlow: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(0, 200, 255, 0.06)",
  },
  illustrationFrame: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "rgba(0, 200, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 255, 0.12)",
  },
  featuresContainer: {
    width: "100%",
    marginBottom: Spacing["2xl"],
  },
  featureRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
  },
  featureItem: {
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(0, 200, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  featureText: {
    fontSize: 12,
    color: RawiColors.textSecondary,
    fontWeight: "500",
  },
  buttonContainer: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: Spacing.md,
  },
  startButton: {
    width: "85%",
    borderRadius: BorderRadius["2xl"],
    overflow: "hidden",
    position: "relative",
  },
  buttonGlow: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: BorderRadius["2xl"] + 2,
    backgroundColor: "rgba(0, 200, 255, 0.2)",
  },
  buttonInner: {
    backgroundColor: RawiColors.primary,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius["2xl"],
    flexDirection: "row",
  },
  startButtonText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#080C14",
  },
  loginHint: {
    fontSize: 13,
    color: RawiColors.textSecondary,
    marginTop: Spacing.md,
    opacity: 0.7,
  },
});
