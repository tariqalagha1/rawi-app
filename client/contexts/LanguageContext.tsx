import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Language = "ar" | "en";

interface LanguageContextType {
  language: Language;
  isRTL: boolean;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    appName: "روّاي",
    subtitle: "رفيقك للقراءة ومناقشة الكتب",
    welcome: "مرحباً بك في روّاي",
    welcomeSubtitle: "حوّل أي كتاب إلى تجربة صوتية تفاعلية",
    uploadDoc: "ارفع كتابك",
    talkWithRawway: "تحدث بصوتك",
    discussContent: "استكشف الأفكار",
    start: "ابدأ",
    loginOrSignup: "تسجيل الدخول أو إنشاء حساب",
    welcomeBack: "مرحباً بعودتك",
    joinUs: "انضم إلينا",
    name: "الاسم",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    login: "تسجيل الدخول",
    createAccount: "إنشاء حساب",
    noAccount: "ليس لديك حساب؟ أنشئ حساباً جديداً",
    haveAccount: "لديك حساب؟ سجل الدخول",
    or: "أو",
    continueAsGuest: "المتابعة كضيف",
    pressToConnect: "اضغط للاتصال",
    connected: "متصل",
    connecting: "جاري الاتصال...",
    rawwaySpeaking: "روّاي يتحدث...",
    speakNow: "تحدث الآن",
    noMessages: "لا توجد رسائل",
    startConversation: "ابدأ محادثة جديدة مع روّاي",
    settings: "الإعدادات",
    voice: "الصوت",
    chooseVoice: "اختر صوت روّاي",
    language: "اللغة",
    appLanguage: "لغة التطبيق",
    arabic: "العربية",
    english: "English",
    close: "إغلاق",
    voices: "الأصوات",
    volumeLevel: "مستوى الصوت",
    volumeBoost: "تعزيز الصوت",
    volumeAuto: "تلقائي",
    account: "الحساب",
    logout: "تسجيل الخروج",
    fillAllFields: "يرجى ملء جميع الحقول",
    enterName: "يرجى إدخال اسمك",
    error: "خطأ",
    loginError: "حدث خطأ أثناء تسجيل الدخول",
    connectionFailed: "فشل الاتصال - اضغط للمحاولة",
    connectionError: "فشل الاتصال",
    conversationError: "حدث خطأ في المحادثة",
    ready: "جاهز",
  },
  en: {
    appName: "Rawi",
    subtitle: "Your companion for reading and discussing books",
    welcome: "Welcome to Rawi",
    welcomeSubtitle: "Turn any book into an interactive audio experience",
    uploadDoc: "Upload your book",
    talkWithRawway: "Talk with your voice",
    discussContent: "Explore ideas",
    start: "Start",
    loginOrSignup: "Login or create an account",
    welcomeBack: "Welcome back",
    joinUs: "Join us",
    name: "Name",
    email: "Email",
    password: "Password",
    login: "Login",
    createAccount: "Create Account",
    noAccount: "Don't have an account? Create one",
    haveAccount: "Have an account? Login",
    or: "or",
    continueAsGuest: "Continue as guest",
    pressToConnect: "Press to connect",
    connected: "Connected",
    connecting: "Connecting...",
    rawwaySpeaking: "Rawi is speaking...",
    speakNow: "Speak now",
    noMessages: "No messages",
    startConversation: "Start a new conversation with Rawi",
    settings: "Settings",
    voice: "Voice",
    chooseVoice: "Choose Rawi's voice",
    language: "Language",
    appLanguage: "App Language",
    arabic: "العربية",
    english: "English",
    close: "Close",
    voices: "Voices",
    volumeLevel: "Volume Level",
    volumeBoost: "Volume Boost",
    volumeAuto: "Auto",
    account: "Account",
    logout: "Logout",
    fillAllFields: "Please fill all fields",
    enterName: "Please enter your name",
    error: "Error",
    loginError: "An error occurred during login",
    connectionFailed: "Connection failed - tap to retry",
    connectionError: "Connection failed",
    conversationError: "An error occurred in the conversation",
    ready: "Ready",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar");
  const [isRTL, setIsRTL] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem("@language");
      if (savedLang === "ar" || savedLang === "en") {
        setLanguageState(savedLang);
        setIsRTL(savedLang === "ar");
      }
    } catch (error) {
      console.error("Error loading language:", error);
    }
  };

  const setLanguage = useCallback(async (lang: Language) => {
    try {
      await AsyncStorage.setItem("@language", lang);
      setLanguageState(lang);
      setIsRTL(lang === "ar");
    } catch (error) {
      console.error("Error saving language:", error);
    }
  }, []);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, isRTL, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
