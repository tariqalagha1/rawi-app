import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  Platform,
  Modal,
  TouchableOpacity,
} from "react-native";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/contexts/SettingsContext";
import Slider from "@react-native-community/slider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, CommonActions } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { WebView } from "react-native-webview";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  SlideInRight,
  SlideInLeft,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { RawiColors, Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

interface Message {
  id: string;
  role: "user" | "ai" | "system";
  text: string;
  attachment?: { name: string; type: string };
}

interface Voice {
  id: string;
  name: string;
  nameAr: string;
}

interface AttachedFile {
  name: string;
  uri: string;
  type: string;
  size?: number;
  uploadProgress?: number;
  isReady?: boolean;
}

const SUPPORTED_FILE_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/epub+zip",
  "text/html",
  "text/markdown",
  "application/rtf",
  "text/csv",
  "application/json",
];

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { language, isRTL, setLanguage, t } = useLanguage();
  const { volumeBoost, setVolumeBoost, getVolumeMultiplier } = useSettings();
  const [isConnected, setIsConnected] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentVoice, setCurrentVoice] = useState("tariq");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [statusText, setStatusText] = useState(t("pressToConnect"));
  const [showWebView, setShowWebView] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState("");
  const [volume, setVolume] = useState(1.0);

  const flatListRef = useRef<FlatList>(null);
  const webViewRef = useRef<WebView>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const pendingAITextRef = useRef("");

  const pulseScale = useSharedValue(1);
  const waveScale1 = useSharedValue(1);
  const waveScale2 = useSharedValue(1);
  const waveScale3 = useSharedValue(1);

  useEffect(() => {
    checkHealth();
    fetchVoices();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      clearInterval(interval);
      endCall();
    };
  }, []);

  useEffect(() => {
    if (isUserSpeaking) {
      waveScale1.value = withRepeat(
        withSequence(withTiming(1.5, { duration: 400 }), withTiming(1, { duration: 400 })),
        -1, true
      );
      waveScale2.value = withRepeat(
        withSequence(withTiming(1.8, { duration: 600 }), withTiming(1, { duration: 600 })),
        -1, true
      );
      waveScale3.value = withRepeat(
        withSequence(withTiming(2.1, { duration: 800 }), withTiming(1, { duration: 800 })),
        -1, true
      );
    } else {
      waveScale1.value = withTiming(1);
      waveScale2.value = withTiming(1);
      waveScale3.value = withTiming(1);
    }
  }, [isUserSpeaking]);

  useEffect(() => {
    if (isAISpeaking) {
      pulseScale.value = withRepeat(
        withSequence(withTiming(1.15, { duration: 200 }), withTiming(0.85, { duration: 200 })),
        -1, true
      );
    } else {
      pulseScale.value = withTiming(1);
    }
  }, [isAISpeaking]);

  const checkHealth = async () => {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(new URL("/api/health", baseUrl).href);
      const data = await response.json();
      setIsConnected(data.status === "ok");
    } catch {
      setIsConnected(false);
    }
  };

  const fetchVoices = async () => {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(new URL("/api/voices", baseUrl).href);
      const data = await response.json();
      setVoices(data.voices || []);
    } catch {
      setVoices([
        { id: "tariq", name: "Tariq", nameAr: "طارق" },
        { id: "alloy", name: "Faisal", nameAr: "فيصل" },
        { id: "nova", name: "Layla", nameAr: "ليلى" },
      ]);
    }
  };

  const startCallWeb = async () => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }

      setStatusText(t("connecting"));

      const baseUrl = getApiUrl();
      let instructions = `أنت راوّي، رفيق ذكي متعدد اللغات لقراءة ومناقشة الكتب والسرد القصصي.

قدراتك اللغوية:
- تقرأ وتفهم النصوص بأي لغة
- تكتشف اللغة تلقائياً لكل جملة أو فقرة
- تتعامل مع المحتوى متعدد اللغات بسلاسة

قراءة الكتب بالكامل:
- عندما يطلب المستخدم "اقرأ لي الكتاب" أو "اقرأ الملف كاملاً" أو "اقرأ من البداية"، ابدأ بالقراءة الفورية من أول الملف
- اقرأ النص حرفياً كما هو مكتوب بدون اختصار أو تلخيص
- اقرأ بصوت طبيعي ومعبر مع فواصل مناسبة بين الفقرات
- استخدم نبرات صوتية مناسبة للحوارات والمشاهد الدرامية
- إذا كان النص طويلاً جداً، اقرأ قسماً كبيراً ثم اسأل المستخدم إذا يريد المتابعة

دورك الرئيسي:
- قراءة الكتاب كاملاً بصوت عالٍ عند طلب المستخدم
- تلخيص أجزاء من الكتب أو الكتاب بأكمله عند الطلب
- مناقشة الكتب والمستندات المرفقة بعمق
- تحليل الموضوعات والأفكار الرئيسية

أسلوبك الصوتي:
- إلقاء طبيعي ومعبر وغير رتيب
- عند القراءة، استخدم نبرات مختلفة للحوارات والوصف
- اضبط الإيقاع والنبرة حسب تعقيد المحتوى

الهدف: ترجمة الفهم، وليس الكلمات`;

      if (attachedFile?.isReady) {
        try {
          let fileContent = "";
          if (attachedFile.type.startsWith("text/") || 
              attachedFile.type === "application/json" ||
              attachedFile.type === "text/markdown") {
            fileContent = await FileSystem.readAsStringAsync(attachedFile.uri);
          }
          if (fileContent) {
            const maxContentLength = 100000;
            const contentToSend = fileContent.length > maxContentLength 
              ? fileContent.substring(0, maxContentLength) + "\n\n[المحتوى مقطوع - اطلب من المستخدم قراءة جزء معين أو المتابعة]"
              : fileContent;
            instructions += `\n\nالمستخدم أرفق ملف: ${attachedFile.name}\n\n=== محتوى الملف الكامل للقراءة ===\n${contentToSend}\n=== نهاية الملف ===`;
          } else {
            instructions += `\n\nالمستخدم أرفق: ${attachedFile.name}. استخدم معرفتك عن هذا الكتاب إن كان معروفاً.`;
          }
        } catch {}
      }

      const sessionResponse = await fetch(new URL("/api/realtime/session", baseUrl).href, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice: currentVoice, instructions }),
      });

      if (!sessionResponse.ok) {
        throw new Error("Failed to create session");
      }

      const sessionData = await sessionResponse.json();
      const ephemeralKey = sessionData.client_secret?.value;

      if (!ephemeralKey) {
        throw new Error("No ephemeral key received");
      }

      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      if (!audioElementRef.current) {
        audioElementRef.current = document.createElement("audio");
        audioElementRef.current.autoplay = true;
      }

      pc.ontrack = (e) => {
        audioElementRef.current!.srcObject = e.streams[0];
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const dc = pc.createDataChannel("oai-events");
      dataChannelRef.current = dc;

      dc.onopen = () => {
        setIsCallActive(true);
        setStatusText(t("connected") + " - " + t("speakNow"));
        setAttachedFile(null);
      };

      dc.onmessage = (e) => {
        handleRealtimeEvent(JSON.parse(e.data));
      };

      dc.onclose = () => {
        endCall();
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch(
        `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );

      if (!sdpResponse.ok) {
        throw new Error("Failed to establish WebRTC connection");
      }

      const answer = { type: "answer" as RTCSdpType, sdp: await sdpResponse.text() };
      await pc.setRemoteDescription(answer);

    } catch (error) {
      console.error("Error starting call:", error);
      setStatusText(t("connectionFailed"));
      setIsCallActive(false);
      endCall();
    }
  };

  const startCallMobile = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    setStatusText(t("connecting"));

    const baseUrl = getApiUrl();
    let instructions = `أنت راوّي، رفيق ذكي متعدد اللغات لقراءة ومناقشة الكتب والسرد القصصي.

قدراتك اللغوية:
- تقرأ وتفهم النصوص بأي لغة
- تكتشف اللغة تلقائياً لكل جملة أو فقرة
- تتعامل مع المحتوى متعدد اللغات بسلاسة

قراءة الكتب بالكامل:
- عندما يطلب المستخدم "اقرأ لي الكتاب" أو "اقرأ الملف كاملاً" أو "اقرأ من البداية"، ابدأ بالقراءة الفورية من أول الملف
- اقرأ النص حرفياً كما هو مكتوب بدون اختصار أو تلخيص
- اقرأ بصوت طبيعي ومعبر مع فواصل مناسبة بين الفقرات
- استخدم نبرات صوتية مناسبة للحوارات والمشاهد الدرامية
- إذا كان النص طويلاً جداً، اقرأ قسماً كبيراً ثم اسأل المستخدم إذا يريد المتابعة

دورك الرئيسي:
- قراءة الكتاب كاملاً بصوت عالٍ عند طلب المستخدم
- تلخيص أجزاء من الكتب أو الكتاب بأكمله عند الطلب
- مناقشة الكتب والمستندات المرفقة بعمق
- تحليل الموضوعات والأفكار الرئيسية

أسلوبك الصوتي:
- إلقاء طبيعي ومعبر وغير رتيب
- عند القراءة، استخدم نبرات مختلفة للحوارات والوصف
- اضبط الإيقاع والنبرة حسب تعقيد المحتوى

الهدف: ترجمة الفهم، وليس الكلمات`;

    if (attachedFile?.isReady) {
      try {
        let fileContent = "";
        if (attachedFile.type.startsWith("text/") || 
            attachedFile.type === "application/json" ||
            attachedFile.type === "text/markdown" ||
            attachedFile.type === "text/csv") {
          fileContent = await FileSystem.readAsStringAsync(attachedFile.uri);
        }
        if (fileContent) {
          const maxContentLength = 100000;
          const contentToSend = fileContent.length > maxContentLength 
            ? fileContent.substring(0, maxContentLength) + "\n\n[المحتوى مقطوع - اطلب من المستخدم قراءة جزء معين أو المتابعة]"
            : fileContent;
          instructions += `\n\nالمستخدم أرفق ملف: ${attachedFile.name}\n\n=== محتوى الملف الكامل للقراءة ===\n${contentToSend}\n=== نهاية الملف ===`;
        } else {
          instructions += `\n\nالمستخدم أرفق: ${attachedFile.name}. استخدم معرفتك عن هذا الكتاب إن كان معروفاً.`;
        }
      } catch (e) {
        console.log("Could not read file content:", e);
        instructions += `\n\nالمستخدم أرفق: ${attachedFile.name}. استخدم معرفتك عن هذا الكتاب إن كان معروفاً.`;
      }
    }

    console.log("Starting mobile call with instructions length:", instructions.length);

    const params = new URLSearchParams({
      voice: currentVoice,
      instructions: instructions,
      volumeBoost: volumeBoost,
    });

    const url = `${baseUrl}/api/webrtc-voice?${params.toString()}`;
    console.log("WebView URL:", url.substring(0, 200));
    
    setWebViewUrl(url);
    setShowWebView(true);
  };

  const handleRealtimeEvent = useCallback((event: any) => {
    switch (event.type) {
      case "input_audio_buffer.speech_started":
        setIsUserSpeaking(true);
        setIsAISpeaking(false);
        break;

      case "input_audio_buffer.speech_stopped":
        setIsUserSpeaking(false);
        break;

      case "conversation.item.input_audio_transcription.completed":
        if (event.transcript) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: "user",
            text: event.transcript,
          }]);
        }
        break;

      case "response.audio_transcript.delta":
        if (event.delta) {
          pendingAITextRef.current += event.delta;
        }
        break;

      case "response.audio_transcript.done":
        const finalText = pendingAITextRef.current || event.transcript || "";
        if (finalText) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: "ai",
            text: finalText,
          }]);
          pendingAITextRef.current = "";
        }
        break;

      case "response.audio.started":
        setIsAISpeaking(true);
        setStatusText(t("rawwaySpeaking"));
        break;

      case "response.audio.done":
      case "response.done":
        setIsAISpeaking(false);
        setStatusText(t("connected") + " - " + t("speakNow"));
        break;

      case "error":
        console.error("Realtime error:", event.error);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: "system",
          text: t("conversationError"),
        }]);
        break;
    }
  }, []);

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("WebView message:", data.type, data);
      
      switch (data.type) {
        case "status":
          setStatusText(data.text);
          break;
        case "connected":
          setIsCallActive(true);
          setAttachedFile(null);
          break;
        case "disconnected":
          setIsCallActive(false);
          setShowWebView(false);
          setIsUserSpeaking(false);
          setIsAISpeaking(false);
          setStatusText(t("pressToConnect"));
          break;
        case "userSpeaking":
          setIsUserSpeaking(data.speaking);
          if (data.speaking) setIsAISpeaking(false);
          break;
        case "aiSpeaking":
          setIsAISpeaking(data.speaking);
          if (data.speaking) setIsUserSpeaking(false);
          break;
        case "userMessage":
          if (data.text) {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: "user",
              text: data.text,
            }]);
          }
          break;
        case "aiMessage":
          if (data.text) {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: "ai",
              text: data.text,
            }]);
          }
          break;
        case "event":
          if (data.eventType === "input_audio_buffer.speech_started") {
            setIsUserSpeaking(true);
            setIsAISpeaking(false);
          } else if (data.eventType === "input_audio_buffer.speech_stopped") {
            setIsUserSpeaking(false);
          } else if (data.eventType === "response.audio.started") {
            setIsAISpeaking(true);
            setIsUserSpeaking(false);
          } else if (data.eventType === "response.audio.done" || data.eventType === "response.done") {
            setIsAISpeaking(false);
          }
          break;
        case "error":
          console.error("WebView error:", data.message);
          setStatusText(t("connectionError"));
          setIsCallActive(false);
          setShowWebView(false);
          break;
      }
    } catch (e) {
      console.error("Error parsing WebView message:", e);
    }
  };

  const endCall = useCallback(() => {
    if (Platform.OS === "web") {
      if (dataChannelRef.current) {
        dataChannelRef.current.close();
        dataChannelRef.current = null;
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      if (audioElementRef.current) {
        audioElementRef.current.srcObject = null;
      }
    } else {
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript("window.endCallFromRN && window.endCallFromRN(); true;");
      }
      setShowWebView(false);
    }

    setIsCallActive(false);
    setIsUserSpeaking(false);
    setIsAISpeaking(false);
    setStatusText(t("pressToConnect"));
  }, [t]);

  const handleVolumeChange = useCallback((value: number) => {
    setVolume(value);
    if (Platform.OS === "web") {
      if (audioElementRef.current) {
        audioElementRef.current.volume = value;
      }
    } else {
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`window.setVolumeFromRN && window.setVolumeFromRN(${value}); true;`);
      }
    }
  }, []);

  const toggleCall = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (isCallActive) {
      endCall();
    } else {
      if (Platform.OS === "web") {
        await startCallWeb();
      } else {
        await startCallMobile();
      }
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("@is_logged_in");
      await AsyncStorage.removeItem("@user_name");
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Welcome" }],
        })
      );
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const pickDocument = async () => {
    if (isCallActive) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: SUPPORTED_FILE_TYPES,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const file = result.assets[0];
        
        setAttachedFile({
          name: file.name,
          uri: file.uri,
          type: file.mimeType || "application/octet-stream",
          size: file.size,
          uploadProgress: 0,
          isReady: false,
        });

        const totalSteps = 10;
        for (let i = 1; i <= totalSteps; i++) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setAttachedFile(prev => prev ? { ...prev, uploadProgress: (i / totalSteps) * 100 } : null);
        }

        setAttachedFile(prev => prev ? { ...prev, uploadProgress: 100, isReady: true } : null);

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error("Error picking document:", error);
    }
  };

  const waveStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale1.value }],
    opacity: 2 - waveScale1.value,
  }));

  const waveStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale2.value }],
    opacity: 2 - waveScale2.value,
  }));

  const waveStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale3.value }],
    opacity: 2 - waveScale3.value,
  }));

  const speakingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.role === "user";
    const isSystem = item.role === "system";

    return (
      <Animated.View
        entering={isUser ? SlideInRight.delay(index * 20) : SlideInLeft.delay(index * 20)}
        style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.aiMessageContainer]}
      >
        <View style={[styles.messageBubble, isUser ? styles.userBubble : isSystem ? styles.systemBubble : styles.aiBubble]}>
          {item.attachment ? (
            <View style={styles.attachmentBadge}>
              <Feather name="file" size={12} color={RawiColors.primary} />
              <ThemedText style={styles.attachmentBadgeText}>{item.attachment.name}</ThemedText>
            </View>
          ) : null}
          <ThemedText style={[styles.messageText, isSystem && styles.systemText]}>{item.text}</ThemedText>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={[styles.headerTop, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Pressable onPress={() => setShowSettings(true)} style={styles.settingsButton}>
            <Feather name="settings" size={22} color={RawiColors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <ThemedText style={styles.title}>{t("appName")}</ThemedText>
            <ThemedText style={styles.subtitle}>{t("subtitle")}</ThemedText>
          </View>
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Feather name="log-out" size={22} color={RawiColors.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.statusRow}>
          <View style={[styles.connectionDot, { backgroundColor: isConnected ? RawiColors.success : RawiColors.error }]} />
          {isCallActive ? (
            <View style={[styles.connectionDot, { backgroundColor: RawiColors.primary, marginLeft: 6 }]} />
          ) : null}
        </View>
      </View>

      <Modal
        visible={showSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingTop: insets.top + Spacing.lg }]}>
            <View style={[styles.modalHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <ThemedText style={styles.modalTitle}>{t("settings")}</ThemedText>
              <Pressable onPress={() => setShowSettings(false)} style={styles.closeButton}>
                <Feather name="x" size={24} color={RawiColors.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.settingsSection}>
              <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("language")}</ThemedText>
              <View style={styles.languageOptions}>
                <TouchableOpacity
                  style={[styles.languageOption, language === "ar" && styles.languageOptionSelected]}
                  onPress={() => setLanguage("ar")}
                >
                  <ThemedText style={[styles.languageText, language === "ar" && styles.languageTextSelected]}>
                    {t("arabic")}
                  </ThemedText>
                  {language === "ar" ? (
                    <Feather name="check" size={20} color={RawiColors.primary} />
                  ) : null}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.languageOption, language === "en" && styles.languageOptionSelected]}
                  onPress={() => setLanguage("en")}
                >
                  <ThemedText style={[styles.languageText, language === "en" && styles.languageTextSelected]}>
                    {t("english")}
                  </ThemedText>
                  {language === "en" ? (
                    <Feather name="check" size={20} color={RawiColors.primary} />
                  ) : null}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingsSection}>
              <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("volumeBoost")}</ThemedText>
              <View style={styles.languageOptions}>
                <TouchableOpacity
                  style={[styles.languageOption, volumeBoost === "1x" && styles.languageOptionSelected]}
                  onPress={() => setVolumeBoost("1x")}
                >
                  <ThemedText style={[styles.languageText, volumeBoost === "1x" && styles.languageTextSelected]}>
                    {t("volumeNormal")}
                  </ThemedText>
                  {volumeBoost === "1x" ? (
                    <Feather name="check" size={20} color={RawiColors.primary} />
                  ) : null}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.languageOption, volumeBoost === "2x" && styles.languageOptionSelected]}
                  onPress={() => setVolumeBoost("2x")}
                >
                  <ThemedText style={[styles.languageText, volumeBoost === "2x" && styles.languageTextSelected]}>
                    {t("volumeDouble")}
                  </ThemedText>
                  {volumeBoost === "2x" ? (
                    <Feather name="check" size={20} color={RawiColors.primary} />
                  ) : null}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.languageOption, volumeBoost === "3x" && styles.languageOptionSelected]}
                  onPress={() => setVolumeBoost("3x")}
                >
                  <ThemedText style={[styles.languageText, volumeBoost === "3x" && styles.languageTextSelected]}>
                    {t("volumeTriple")}
                  </ThemedText>
                  {volumeBoost === "3x" ? (
                    <Feather name="check" size={20} color={RawiColors.primary} />
                  ) : null}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.languageOption, volumeBoost === "5x" && styles.languageOptionSelected]}
                  onPress={() => setVolumeBoost("5x")}
                >
                  <ThemedText style={[styles.languageText, volumeBoost === "5x" && styles.languageTextSelected]}>
                    5x
                  </ThemedText>
                  {volumeBoost === "5x" ? (
                    <Feather name="check" size={20} color={RawiColors.primary} />
                  ) : null}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.languageOption, volumeBoost === "7x" && styles.languageOptionSelected]}
                  onPress={() => setVolumeBoost("7x")}
                >
                  <ThemedText style={[styles.languageText, volumeBoost === "7x" && styles.languageTextSelected]}>
                    7x
                  </ThemedText>
                  {volumeBoost === "7x" ? (
                    <Feather name="check" size={20} color={RawiColors.primary} />
                  ) : null}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.languageOption, volumeBoost === "10x" && styles.languageOptionSelected]}
                  onPress={() => setVolumeBoost("10x")}
                >
                  <ThemedText style={[styles.languageText, volumeBoost === "10x" && styles.languageTextSelected]}>
                    10x
                  </ThemedText>
                  {volumeBoost === "10x" ? (
                    <Feather name="check" size={20} color={RawiColors.primary} />
                  ) : null}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.languageOption, volumeBoost === "auto" && styles.languageOptionSelected]}
                  onPress={() => setVolumeBoost("auto")}
                >
                  <ThemedText style={[styles.languageText, volumeBoost === "auto" && styles.languageTextSelected]}>
                    {t("volumeAuto")}
                  </ThemedText>
                  {volumeBoost === "auto" ? (
                    <Feather name="check" size={20} color={RawiColors.primary} />
                  ) : null}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messageList}
        contentContainerStyle={[styles.messageListContent, messages.length === 0 && styles.emptyListContent]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="book-open" size={60} color={RawiColors.textSecondary} />
            <ThemedText style={styles.emptyTitle}>{t("welcome")}</ThemedText>
            <ThemedText style={styles.emptySubtitle}>{t("welcomeSubtitle")}</ThemedText>
            <View style={styles.featureList}>
              <View style={[styles.featureItem, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <Feather name="upload" size={18} color={RawiColors.primary} />
                <ThemedText style={[styles.featureText, { textAlign: isRTL ? "right" : "left" }]}>{t("uploadDoc")}</ThemedText>
              </View>
              <View style={[styles.featureItem, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <Feather name="mic" size={18} color={RawiColors.primary} />
                <ThemedText style={[styles.featureText, { textAlign: isRTL ? "right" : "left" }]}>{t("talkWithRawway")}</ThemedText>
              </View>
              <View style={[styles.featureItem, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <Feather name="message-circle" size={18} color={RawiColors.primary} />
                <ThemedText style={[styles.featureText, { textAlign: isRTL ? "right" : "left" }]}>{t("discussContent")}</ThemedText>
              </View>
            </View>
          </View>
        }
        onContentSizeChange={() => {
          if (messages.length > 0) flatListRef.current?.scrollToEnd({ animated: true });
        }}
        showsVerticalScrollIndicator={false}
      />

      {attachedFile ? (
        <View style={[
          styles.attachmentPreview, 
          attachedFile.isReady && styles.attachmentPreviewReady
        ]}>
          <Feather 
            name={attachedFile.isReady ? "check-circle" : "file-text"} 
            size={18} 
            color={attachedFile.isReady ? RawiColors.success : RawiColors.primary} 
          />
          <View style={styles.attachmentInfo}>
            <ThemedText style={styles.attachmentName} numberOfLines={1}>{attachedFile.name}</ThemedText>
            {!attachedFile.isReady ? (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${attachedFile.uploadProgress || 0}%` }]} />
              </View>
            ) : null}
          </View>
          <ThemedText style={[
            styles.progressText,
            attachedFile.isReady && styles.progressTextReady
          ]}>
            {attachedFile.isReady ? t("ready") : `${Math.round(attachedFile.uploadProgress || 0)}%`}
          </ThemedText>
          <Pressable onPress={() => setAttachedFile(null)}>
            <Feather name="x" size={18} color={RawiColors.error} />
          </Pressable>
        </View>
      ) : null}

      {showWebView && Platform.OS !== "web" ? (
        <View style={styles.webViewContainer}>
          <WebView
            ref={webViewRef}
            source={{ uri: webViewUrl }}
            style={styles.webView}
            onMessage={handleWebViewMessage}
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>
      ) : null}

      <View style={[styles.controlsContainer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        {isCallActive ? (
          <View style={styles.volumeContainer}>
            <Feather name="volume-1" size={18} color={RawiColors.textSecondary} />
            <Slider
              style={styles.volumeSlider}
              minimumValue={0}
              maximumValue={1}
              value={volume}
              onValueChange={handleVolumeChange}
              minimumTrackTintColor={RawiColors.primary}
              maximumTrackTintColor={RawiColors.surface}
              thumbTintColor={RawiColors.primary}
            />
            <Feather name="volume-2" size={18} color={RawiColors.textSecondary} />
          </View>
        ) : (
          <View style={styles.voiceRow}>
            {voices.slice(0, 4).map((voice) => (
              <Pressable
                key={voice.id}
                style={[styles.voiceChip, currentVoice === voice.id && styles.voiceChipActive]}
                onPress={() => !isCallActive && setCurrentVoice(voice.id)}
                disabled={isCallActive}
              >
                <ThemedText style={[styles.voiceChipText, currentVoice === voice.id && styles.voiceChipTextActive]}>
                  {language === "ar" ? voice.nameAr : voice.name}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.mainControls}>
          <Pressable style={[styles.attachButton, isCallActive && styles.disabledButton]} onPress={pickDocument} disabled={isCallActive}>
            <Feather name="paperclip" size={22} color={isCallActive ? RawiColors.textSecondary : RawiColors.textPrimary} />
          </Pressable>

          <View style={styles.micContainer}>
            {isUserSpeaking ? (
              <>
                <Animated.View style={[styles.wave, styles.wave3, waveStyle3]} />
                <Animated.View style={[styles.wave, styles.wave2, waveStyle2]} />
                <Animated.View style={[styles.wave, styles.wave1, waveStyle1]} />
              </>
            ) : null}
            
            <Animated.View style={isAISpeaking ? speakingStyle : undefined}>
              <Pressable
                style={[
                  styles.callButton,
                  isCallActive && styles.callButtonActive,
                  isUserSpeaking && styles.callButtonUserSpeaking,
                  isAISpeaking && styles.callButtonAISpeaking,
                ]}
                onPress={toggleCall}
              >
                {isCallActive ? (
                  isAISpeaking ? (
                    <Feather name="volume-2" size={40} color={RawiColors.textPrimary} />
                  ) : isUserSpeaking ? (
                    <Feather name="mic" size={40} color={RawiColors.textPrimary} />
                  ) : (
                    <Feather name="phone-off" size={40} color={RawiColors.textPrimary} />
                  )
                ) : (
                  <Feather name="phone-call" size={40} color={RawiColors.textPrimary} />
                )}
              </Pressable>
            </Animated.View>
          </View>

          <Pressable 
            style={[styles.endButton, !isCallActive && styles.hiddenButton]} 
            onPress={endCall}
            disabled={!isCallActive}
          >
            <Feather name="x" size={22} color={RawiColors.textPrimary} />
          </Pressable>
        </View>

        <ThemedText style={styles.statusText}>{statusText}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RawiColors.background,
  },
  header: {
    alignItems: "center",
    paddingBottom: Spacing.md,
    backgroundColor: RawiColors.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: RawiColors.headerBorder,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: Spacing.lg,
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
  },
  logoutButton: {
    padding: Spacing.md,
  },
  settingsButton: {
    padding: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: RawiColors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    minHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: RawiColors.textPrimary,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  settingsSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: RawiColors.textPrimary,
    marginBottom: Spacing.md,
  },
  languageOptions: {
    gap: Spacing.sm,
  },
  languageOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: RawiColors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  languageOptionSelected: {
    borderColor: RawiColors.primary,
    backgroundColor: RawiColors.primaryGlow,
  },
  languageText: {
    fontSize: 16,
    color: RawiColors.textSecondary,
  },
  languageTextSelected: {
    color: RawiColors.textPrimary,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: RawiColors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: RawiColors.textSecondary,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: "center",
  },
  messageContainer: {
    marginBottom: Spacing.sm,
    maxWidth: "80%",
  },
  userMessageContainer: {
    alignSelf: "flex-end",
  },
  aiMessageContainer: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  userBubble: {
    backgroundColor: RawiColors.userBubble,
  },
  aiBubble: {
    backgroundColor: RawiColors.aiBubble,
  },
  systemBubble: {
    backgroundColor: RawiColors.systemBubble,
  },
  messageText: {
    fontSize: 15,
    color: RawiColors.textPrimary,
    textAlign: "right",
    lineHeight: 22,
  },
  systemText: {
    color: RawiColors.warning,
  },
  attachmentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: RawiColors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.sm,
    gap: 4,
  },
  attachmentBadgeText: {
    fontSize: 11,
    color: RawiColors.primary,
  },
  emptyState: {
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: RawiColors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: 16,
    color: RawiColors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  featureList: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  featureText: {
    fontSize: 14,
    color: RawiColors.textPrimary,
  },
  webViewContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: -1,
    opacity: 0,
    height: 1,
    width: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  attachmentPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: RawiColors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: RawiColors.primary,
  },
  attachmentPreviewReady: {
    backgroundColor: "rgba(0, 200, 255, 0.08)",
    borderColor: RawiColors.success,
  },
  attachmentInfo: {
    flex: 1,
  },
  progressContainer: {
    height: 4,
    backgroundColor: RawiColors.aiBubble,
    borderRadius: 2,
    marginTop: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: RawiColors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: RawiColors.primary,
    fontWeight: "600",
    minWidth: 40,
    textAlign: "center",
  },
  progressTextReady: {
    color: RawiColors.success,
  },
  attachmentName: {
    fontSize: 13,
    color: RawiColors.textPrimary,
  },
  controlsContainer: {
    backgroundColor: RawiColors.surface,
    paddingTop: Spacing.lg,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  voiceRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  volumeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
  },
  voiceChip: {
    backgroundColor: RawiColors.aiBubble,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  voiceChipActive: {
    backgroundColor: RawiColors.primary,
  },
  voiceChipText: {
    fontSize: 12,
    color: RawiColors.textPrimary,
  },
  voiceChipTextActive: {
    fontWeight: "600",
  },
  mainControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
  },
  attachButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: RawiColors.aiBubble,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.4,
  },
  endButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: RawiColors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  hiddenButton: {
    opacity: 0,
  },
  micContainer: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  wave: {
    position: "absolute",
    borderRadius: 70,
    borderWidth: 2,
    borderColor: RawiColors.success,
  },
  wave1: {
    width: 110,
    height: 110,
  },
  wave2: {
    width: 110,
    height: 110,
  },
  wave3: {
    width: 110,
    height: 110,
  },
  callButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: RawiColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  callButtonActive: {
    backgroundColor: RawiColors.error,
  },
  callButtonUserSpeaking: {
    backgroundColor: RawiColors.success,
  },
  callButtonAISpeaking: {
    backgroundColor: RawiColors.secondary,
  },
  statusText: {
    textAlign: "center",
    fontSize: 14,
    color: RawiColors.textSecondary,
    marginTop: Spacing.lg,
  },
});
