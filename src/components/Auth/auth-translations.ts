const authTranslations = {
  ar: {
    // Common
    emailField: "البريد الإلكتروني",
    passwordField: "كلمة المرور",
    or: "أو",
    sending: "جاري الإرسال...",
    verifying: "جاري التحقق...",
    seconds: "ثانية",
    termsAndConditions: "الشروط والأحكام",
    privacyPolicy: "سياسة الخصوصية",
    acceptTerms: "أوافق على",
    and: "و",
    somethingWentWrong: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    checkingSession: "جاري التحقق من حالة الجلسة...",
    code: "(الكود:",
    // Features
    featuresTitle: "مميزات منصتنا",
    educationalContent: "محتوى تعليمي",
    educationalContentDesc: "دروس شاملة في مختلف المجالات العلمية",
    interactiveCommunity: "مجتمع تفاعلي",
    interactiveCommunityDesc: "تواصل مع زملائك وشارك المعرفة",
    followUs: "تابعنا على",
    whyChooseUs: "لماذا تختار منصتنا؟",
    reliableContent: "محتوى علمي موثوق ومحدث باستمرار",
    supportiveCommunity: "مجتمع تعليمي تفاعلي وداعم",
    resourceLibrary: "وصول لمكتبة ضخمة من الموارد التعليمية",
  },
  en: {
    // Common
    emailField: "Email Address",
    passwordField: "Password",
    or: "Or",
    sending: "Sending...",
    verifying: "Verifying...",
    seconds: "seconds",
    termsAndConditions: "Terms and Conditions",
    privacyPolicy: "Privacy Policy",
    acceptTerms: "I agree to",
    and: "and",
    somethingWentWrong: "Something went wrong. Please try again.",
    checkingSession: "Checking session status...",
    code: "(Code:",
    // Features
    featuresTitle: "Our Platform Features",
    educationalContent: "Educational Content",
    educationalContentDesc: "Comprehensive lessons in various scientific fields",
    interactiveCommunity: "Interactive Community",
    interactiveCommunityDesc: "Connect with colleagues and share knowledge",
    followUs: "Follow Us On",
    whyChooseUs: "Why Choose Our Platform?",
    reliableContent: "Reliable and constantly updated scientific content",
    supportiveCommunity: "Interactive and supportive educational community",
    resourceLibrary: "Access to a huge library of educational resources",
  },
} as const

export type AuthTranslationKey = keyof typeof authTranslations.ar
export type AuthTranslations = typeof authTranslations.ar

export default authTranslations
