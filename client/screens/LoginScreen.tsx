import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { RawiColors, Spacing, BorderRadius } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isRTL = language === "ar";

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert(t("error"), t("fillAllFields"));
      return;
    }

    if (!isLogin && !name) {
      Alert.alert(t("error"), t("enterName"));
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const userData = {
        email,
        name: name || email.split("@")[0],
        loggedIn: true,
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem("@user_data", JSON.stringify(userData));
      await AsyncStorage.setItem("@is_logged_in", "true");

      navigation.reset({
        index: 0,
        routes: [{ name: "Chat" }],
      });
    } catch (error) {
      Alert.alert(t("error"), t("loginError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem("@is_logged_in", "true");
    await AsyncStorage.setItem("@user_data", JSON.stringify({ name: "ضيف", guest: true }));
    navigation.reset({
      index: 0,
      routes: [{ name: "Chat" }],
    });
  };

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={[styles.content, { paddingTop: insets.top + Spacing.xl }]}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={24} color={RawiColors.textPrimary} />
          </Pressable>

          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <View style={styles.logoContainer}>
              <Feather name="book-open" size={50} color={RawiColors.primary} />
            </View>
            <ThemedText style={styles.title}>{t("appName")}</ThemedText>
            <ThemedText style={styles.subtitle}>
              {isLogin ? t("welcomeBack") : t("joinUs")}
            </ThemedText>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(300).duration(600)} style={styles.formContainer}>
            {!isLogin ? (
              <View style={styles.inputContainer}>
                <Feather name="user" size={20} color={RawiColors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t("name")}
                  placeholderTextColor={RawiColors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  textAlign="right"
                />
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color={RawiColors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t("email")}
                placeholderTextColor={RawiColors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
              />
            </View>

            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color={RawiColors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t("password")}
                placeholderTextColor={RawiColors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textAlign="right"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={20} color={RawiColors.textSecondary} />
              </Pressable>
            </View>

            <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={isLoading}>
              <View style={styles.buttonInner}>
                {isLoading ? (
                  <ActivityIndicator color="#080C14" />
                ) : (
                  <ThemedText style={styles.submitButtonText}>
                    {isLogin ? t("login") : t("createAccount")}
                  </ThemedText>
                )}
              </View>
            </Pressable>

            <Pressable onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
              <ThemedText style={styles.switchText}>
                {isLogin ? t("noAccount") : t("haveAccount")}
              </ThemedText>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(500).duration(600)} style={styles.dividerContainer}>
            <View style={styles.divider} />
            <ThemedText style={styles.dividerText}>{t("or")}</ThemedText>
            <View style={styles.divider} />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.socialContainer}>
            <Pressable style={styles.skipButton} onPress={handleSkip}>
              <Feather name="user" size={20} color={RawiColors.textPrimary} />
              <ThemedText style={styles.skipButtonText}>{t("continueAsGuest")}</ThemedText>
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RawiColors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  backButton: {
    alignSelf: "flex-start",
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: RawiColors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: RawiColors.primary,
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: RawiColors.textPrimary,
    lineHeight: 50,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: RawiColors.textSecondary,
    marginTop: Spacing.xs,
  },
  formContainer: {
    gap: Spacing.lg,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: RawiColors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    height: 56,
    borderWidth: 1,
    borderColor: RawiColors.aiBubble,
  },
  inputIcon: {
    marginLeft: Spacing.sm,
  },
  input: {
    flex: 1,
    color: RawiColors.textPrimary,
    fontSize: 16,
    paddingHorizontal: Spacing.md,
  },
  eyeButton: {
    padding: Spacing.sm,
  },
  submitButton: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginTop: Spacing.sm,
  },
  buttonInner: {
    backgroundColor: RawiColors.primary,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#080C14",
  },
  switchButton: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  switchText: {
    fontSize: 14,
    color: RawiColors.primary,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: RawiColors.aiBubble,
  },
  dividerText: {
    color: RawiColors.textSecondary,
    marginHorizontal: Spacing.lg,
    fontSize: 14,
  },
  socialContainer: {
    gap: Spacing.md,
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RawiColors.surface,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: RawiColors.aiBubble,
  },
  skipButtonText: {
    fontSize: 16,
    color: RawiColors.textPrimary,
  },
});
