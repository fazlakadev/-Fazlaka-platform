"use client"

import { useState, useEffect } from "react"
import { signIn, signOut, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, User, CheckCircle, AlertCircle, Shield, Key, Home, ArrowRight } from "lucide-react"
import { useLanguage } from "@/components/Language/LanguageProvider"
import AuthLayout from "@/components/Auth/AuthLayout"
import AuthInput from "@/components/Auth/AuthInput"
import AuthButton from "@/components/Auth/AuthButton"
import authTranslations from "@/components/Auth/auth-translations"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showOtpForm, setShowOtpForm] = useState(false)
  const [_showOtpSent, setShowOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [authMethod, setAuthMethod] = useState<"password" | "magic" | "otp">("password")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [showResendVerification, setShowResendVerification] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const { language } = useLanguage()

  const message = searchParams.get("message")
  const errorParam = searchParams.get("error")

  const t = {
    ...authTranslations[language],
    ...(language === "ar"
      ? {
          welcomeBack: "مرحباً بعودتك",
          chooseAuthMethod: "اختر طريقة تسجيل الدخول المناسبة لك",
          rememberMe: "تذكرني",
          forgotPassword: "نسيت كلمة المرور؟",
          signIn: "تسجيل الدخول",
          signInWithGoogle: "تسجيل الدخول باستخدام Google",
          passwordMethod: "كلمة المرور",
          otpMethod: "كود التحقق",
          magicLinkMethod: "رابط سحري",
          sendOtp: "إرسال كود التحقق",
          verifyCode: "تحقق من الكود",
          enterVerificationCode: "أدخل كود التحقق",
          codeSentTo: "تم إرسال كود مكون من 6 أرقام إلى",
          resendIn: "إعادة الإرسال خلال",
          resendCode: "لم تستلم الكود؟ أعد الإرسال",
          changeEmail: "تغيير البريد الإلكتروني",
          sendMagicLink: "إرسال رابط تسجيل الدخول",
          signingIn: "جاري تسجيل الدخول...",
          emailOrPasswordIncorrect: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
          unexpectedError: "حدث خطأ غير متوقع",
          googleSignInFailed: "فشل تسجيل الدخول باستخدام Google",
          enterEmail: "الرجاء إدخال البريد الإلكتروني",
          enterOtpCode: "الرجاء إدخال كود التحقق المكون من 6 أرقام",
          signInSuccessful: "تم تسجيل الدخول بنجاح!",
          otpSent: "تم إرسال كود التحقق إلى",
          magicLinkSent: "تم إرسال رابط تسجيل الدخول إلى بريدك الإلكتروني",
          alreadyLoggedIn: "أنت مسجل دخول بالفعل!",
          welcomeUser: "مرحباً بك",
          youAreLoggedIn: "أنت مسجل دخول بالفعل في حسابك.",
          goToHome: "الذهاب إلى الصفحة الرئيسية",
          logout: "تسجيل الخروج",
          credentialsError: "بيانات الاعتماد غير صحيحة",
          authError: "خطأ في المصادقة",
          accountNotVerified: "حسابك لم يتم تفعيله بعد. يرجى التحقق من بريدك الإلكتروني وتفعيل الحساب.",
          accountNotFound: "لا يوجد حساب بهذا البريد الإلكتروني.",
          incorrectPassword: "كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.",
          tooManyAttempts: "لقد تجاوزت عدد المحاولات المسموح به. يرجى المحاولة لاحقًا.",
          accountSuspended: "تم تعليق حسابك. يرجى التواصل مع الدعم الفني.",
          invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
          verificationEmailSent: "تم إرسال بريد التفعيل مرة أخرى. يرجى التحقق من بريدك الإلكتروني.",
          resendVerification: "إعادة إرسال بريد التفعيل",
          checkSpam: "لم تستلم البريد؟ تحقق من مجلد الرسائل غير المرغوب فيها (Spam).",
          needHelp: "تحتاج مساعدة؟",
          contactSupport: "تواصل مع الدعم الفني",
          mustAcceptTerms: "يجب الموافقة على الشروط والأحكام وسياسة الخصوصية",
          noAccount: "ليس لديك حساب؟",
          createAccount: "إنشاء حساب جديد",
        }
      : {
          welcomeBack: "Welcome Back",
          chooseAuthMethod: "Choose your preferred sign-in method",
          rememberMe: "Remember Me",
          forgotPassword: "Forgot Password?",
          signIn: "Sign In",
          signInWithGoogle: "Sign In with Google",
          passwordMethod: "Password",
          otpMethod: "Verification Code",
          magicLinkMethod: "Magic Link",
          sendOtp: "Send Verification Code",
          verifyCode: "Verify Code",
          enterVerificationCode: "Enter Verification Code",
          codeSentTo: "A 6-digit code has been sent to",
          resendIn: "Resend in",
          resendCode: "Didn't receive code? Resend",
          changeEmail: "Change Email",
          sendMagicLink: "Send Sign-In Link",
          signingIn: "Signing in...",
          emailOrPasswordIncorrect: "Email or password is incorrect",
          unexpectedError: "An unexpected error occurred",
          googleSignInFailed: "Failed to sign in with Google",
          enterEmail: "Please enter your email",
          enterOtpCode: "Please enter 6-digit verification code",
          signInSuccessful: "Sign in successful!",
          otpSent: "Verification code sent to",
          magicLinkSent: "Sign-in link has been sent to your email",
          alreadyLoggedIn: "You are already logged in!",
          welcomeUser: "Welcome",
          youAreLoggedIn: "You are already logged in to your account.",
          goToHome: "Go to Homepage",
          logout: "Logout",
          credentialsError: "Invalid credentials",
          authError: "Authentication error",
          accountNotVerified: "Your account has not been verified yet. Please check your email and activate your account.",
          accountNotFound: "No account found with this email address.",
          incorrectPassword: "Incorrect password. Please try again.",
          tooManyAttempts: "You have exceeded maximum number of attempts. Please try again later.",
          accountSuspended: "Your account has been suspended. Please contact support.",
          invalidCredentials: "Email or password is incorrect.",
          verificationEmailSent: "Verification email has been sent again. Please check your email.",
          resendVerification: "Resend verification email",
          checkSpam: "Didn't receive the email? Check your spam folder.",
          needHelp: "Need help?",
          contactSupport: "Contact support",
          mustAcceptTerms: "You must agree to Terms and Conditions and Privacy Policy",
          noAccount: "Don't have an account yet?",
          createAccount: "Create a new account",
        }),
  }

  useEffect(() => {
    if (status === "loading") return
    if (session) router.push("/")
  }, [session, status, router])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!acceptTerms) {
      setError(t.mustAcceptTerms)
      return
    }
    setIsLoading(true)
    setError("")
    setSuccess("")
    setShowResendVerification(false)

    try {
      const result = await signIn("credentials", { email, password, redirect: false })
      if (result?.error) {
        switch (result.error) {
          case "UserNotFound": setError(t.accountNotFound); break
          case "AccountNotVerified": setError(t.accountNotVerified); setShowResendVerification(true); break
          case "IncorrectPassword": setError(t.incorrectPassword); break
          case "TooManyAttempts": setError(t.tooManyAttempts); break
          case "AccountSuspended": setError(t.accountSuspended); break
          case "EmailIsRequired": setError(t.enterEmail); break
          default: setError(t.invalidCredentials)
        }
      } else if (result?.ok) {
        setSuccess(t.signInSuccessful)
        setTimeout(() => router.push("/"), 1500)
      } else {
        setError(t.unexpectedError)
      }
    } catch {
      setError(t.somethingWentWrong)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!acceptTerms) { setError(t.mustAcceptTerms); return }
    setIsLoading(true)
    setError("")
    try {
      const result = await signIn("google", { redirect: false })
      if (result?.error) {
        setError(t.googleSignInFailed)
      } else if (result?.ok) {
        setSuccess(t.signInSuccessful)
        setTimeout(() => router.push("/"), 1500)
      }
    } catch {
      setError(t.somethingWentWrong)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendOtp = async () => {
    if (!email) { setError(t.enterEmail); return }
    if (!acceptTerms) { setError(t.mustAcceptTerms); return }
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "login" }),
      })
      const data = await response.json()
      if (response.ok) {
        setShowOtpSent(true)
        setShowOtpForm(true)
        setCountdown(60)
        setSuccess(`${t.otpSent} ${email}`)
        if (process.env.NODE_ENV === "development" && data.otpCode) {
          setSuccess((prev) => prev + ` ${t.code} ${data.otpCode})`)
        }
      } else {
        setError(data.error || t.somethingWentWrong)
      }
    } catch {
      setError(t.somethingWentWrong)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) { setError(t.enterOtpCode); return }
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpCode, purpose: "login" }),
      })
      const data = await response.json()
      if (response.ok) {
        const result = await signIn("credentials", { email, password: "", redirect: false })
        if (result?.error) {
          if (data.success && data.user) {
            setSuccess(t.signInSuccessful)
            setTimeout(() => router.push("/"), 1500)
          } else {
            setError("فشل تسجيل الدخول بعد التحقق من الكود")
          }
        } else {
          setSuccess(t.signInSuccessful)
          setTimeout(() => router.push("/"), 1500)
        }
      } else {
        setError(data.error || "Invalid OTP code")
      }
    } catch {
      setError(t.somethingWentWrong)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!acceptTerms) { setError(t.mustAcceptTerms); return }
    setIsLoading(true)
    setError("")
    setSuccess("")
    try {
      const response = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (response.ok) {
        setSuccess(t.magicLinkSent)
        setEmail("")
      } else {
        setError(data.error || t.somethingWentWrong)
      }
    } catch {
      setError(t.somethingWentWrong)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (response.ok) {
        setSuccess(t.verificationEmailSent)
        setShowResendVerification(false)
      } else {
        setError(data.error || t.somethingWentWrong)
      }
    } catch {
      setError(t.somethingWentWrong)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "")
    setOtpCode(numericValue)
  }

  if (status === "loading") {
    return (
      <AuthLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t.checkingSession}</p>
        </div>
      </AuthLayout>
    )
  }

  if (session) {
    return (
      <AuthLayout>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl shadow-2xl dark:shadow-2xl dark:shadow-blue-500/20 border border-white/40 dark:border-gray-700/50 p-8">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.alreadyLoggedIn}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t.welcomeUser} {session.user?.name}، {t.youAreLoggedIn}
            </p>
            <div className="space-y-3">
              <AuthButton variant="primary" onClick={() => router.push("/")}>
                <Home className="w-4 h-4" /> {t.goToHome}
              </AuthButton>
              <AuthButton variant="secondary" onClick={() => signOut({ callbackUrl: "/sign-in" })}>
                {t.logout}
              </AuthButton>
            </div>
          </div>
        </motion.div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl shadow-2xl dark:shadow-2xl dark:shadow-blue-500/20 border border-white/40 dark:border-gray-700/50 p-6 sm:p-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">{t.welcomeBack}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t.chooseAuthMethod}</p>
        </motion.div>

        {/* Messages */}
        <AnimatePresence>
          {message && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center space-x-reverse space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-green-700 dark:text-green-300 text-sm">{message}</span>
            </motion.div>
          )}
          {errorParam && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center space-x-reverse space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-red-700 dark:text-red-300 text-sm">{errorParam === "CredentialsSignin" ? t.credentialsError : t.authError}</span>
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-start space-x-reverse space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                  {showResendVerification && (
                    <div className="mt-3 space-y-2">
                      <button onClick={handleResendVerification} disabled={isLoading} className="text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 underline">{t.resendVerification}</button>
                      <p className="text-xs text-red-600 dark:text-red-400">{t.checkSpam}</p>
                    </div>
                  )}
                  <div className="mt-3">
                    <a href="https://mail.google.com/mail/?view=cm&fs=1&to=fazlaka.contact@gmail.com" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 underline">{t.needHelp} {t.contactSupport}</a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center space-x-reverse space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-green-700 dark:text-green-300 text-sm">{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Google Sign In */}
        <AuthButton variant="google" onClick={handleGoogleSignIn} isLoading={isLoading} loadingText={t.signingIn}>
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t.signInWithGoogle}
        </AuthButton>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-gray-600"></div></div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">{t.or}</span>
          </div>
        </div>

        {/* Auth Method Tabs */}
        <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(["password", "otp", "magic"] as const).map((method) => {
            const labels = { password: t.passwordMethod, otp: t.otpMethod, magic: t.magicLinkMethod }
            const icons = { password: <Lock className="w-4 h-4 inline ml-1" />, otp: <Key className="w-4 h-4 inline ml-1" />, magic: <Mail className="w-4 h-4 inline ml-1" /> }
            return (
              <button key={method} type="button" onClick={() => setAuthMethod(method)} className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${authMethod === method ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"}`}>
                {icons[method]} {labels[method]}
              </button>
            )
          })}
        </div>

        {/* Password Form */}
        {authMethod === "password" && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <AuthInput icon={<Mail className="w-4 h-4" />} type="email" placeholder="example@email.com" value={email} onChange={setEmail} autoFocus />
            <AuthInput icon={<Lock className="w-4 h-4" />} type="password" placeholder="••••••••" value={password} onChange={setPassword} />
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded" />
                <label htmlFor="remember-me" className="mr-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer">{t.rememberMe}</label>
              </div>
              <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">{t.forgotPassword}</Link>
            </div>
            <div className="flex items-start">
              <input id="accept-terms" type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded mt-1" />
              <label htmlFor="accept-terms" className="mr-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer leading-relaxed">
                {t.acceptTerms}{" "}
                <Link href="/terms-conditions" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline">{t.termsAndConditions}</Link>{" "}
                {t.and}{" "}
                <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline">{t.privacyPolicy}</Link>
              </label>
            </div>
            <AuthButton type="submit" variant="primary" isLoading={isLoading} loadingText={t.signingIn} disabled={!acceptTerms}>
              {t.signIn} <ArrowRight className="w-4 h-4" />
            </AuthButton>
          </form>
        )}

        {/* OTP Form */}
        {authMethod === "otp" && (
          <div className="space-y-5">
            {!showOtpForm ? (
              <>
                <AuthInput icon={<Mail className="w-4 h-4" />} type="email" placeholder="example@email.com" value={email} onChange={setEmail} autoFocus />
                <div className="flex items-start">
                  <input id="accept-terms-otp" type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded mt-1" />
                  <label htmlFor="accept-terms-otp" className="mr-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer leading-relaxed">
                    {t.acceptTerms}{" "}
                    <Link href="/terms-conditions" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline">{t.termsAndConditions}</Link>{" "}
                    {t.and}{" "}
                    <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline">{t.privacyPolicy}</Link>
                  </label>
                </div>
                <AuthButton variant="primary" onClick={handleSendOtp} isLoading={isLoading} loadingText={t.sending} disabled={!email || !acceptTerms}>
                  <Shield className="w-4 h-4" /> {t.sendOtp}
                </AuthButton>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                    <Key className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t.enterVerificationCode}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t.codeSentTo} {email}</p>
                </div>
                <div className="mb-6">
                  <input type="text" value={otpCode} onChange={(e) => handleOtpChange(e.target.value)} maxLength={6} className="w-full text-center text-2xl font-bold tracking-widest py-3 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="000000" />
                </div>
                <AuthButton variant="primary" onClick={handleVerifyOtp} isLoading={isLoading} loadingText={t.verifying} disabled={otpCode.length !== 6}>
                  <CheckCircle className="w-4 h-4" /> {t.verifyCode}
                </AuthButton>
                <div className="mt-4 text-center">
                  <button type="button" onClick={handleSendOtp} disabled={countdown > 0} className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 disabled:text-gray-400 disabled:cursor-not-allowed">
                    {countdown > 0 ? `${t.resendIn} ${countdown} ${t.seconds}` : t.resendCode}
                  </button>
                </div>
                <div className="mt-4">
                  <button type="button" onClick={() => { setShowOtpForm(false); setShowOtpSent(false); setOtpCode("") }} className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">{t.changeEmail}</button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Magic Link Form */}
        {authMethod === "magic" && (
          <form onSubmit={handleMagicLinkSubmit} className="space-y-5">
            <AuthInput icon={<Mail className="w-4 h-4" />} type="email" placeholder="example@email.com" value={email} onChange={setEmail} autoFocus />
            <div className="flex items-start">
              <input id="accept-terms-magic" type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded mt-1" />
              <label htmlFor="accept-terms-magic" className="mr-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer leading-relaxed">
                {t.acceptTerms}{" "}
                <Link href="/terms-conditions" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline">{t.termsAndConditions}</Link>{" "}
                {t.and}{" "}
                <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline">{t.privacyPolicy}</Link>
              </label>
            </div>
            <AuthButton type="submit" variant="primary" isLoading={isLoading} loadingText={t.sending} disabled={!acceptTerms}>
              <Mail className="w-4 h-4" /> {t.sendMagicLink}
            </AuthButton>
          </form>
        )}

        {/* Sign Up Link */}
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mt-8 text-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t.noAccount}{" "}
            <Link href="/sign-up" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">{t.createAccount}</Link>
          </span>
        </motion.p>
      </motion.div>
    </AuthLayout>
  )
}
