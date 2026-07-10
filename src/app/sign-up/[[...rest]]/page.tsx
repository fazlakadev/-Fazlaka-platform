"use client"

import { useState, useEffect } from "react"
import { signIn, signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, User, Shield, CheckCircle, AlertCircle, Home, Link2 } from "lucide-react"
import { useLanguage } from "@/components/Language/LanguageProvider"
import AuthLayout from "@/components/Auth/AuthLayout"
import AuthInput from "@/components/Auth/AuthInput"
import AuthButton from "@/components/Auth/AuthButton"
import authTranslations from "@/components/Auth/auth-translations"

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showOtpForm, setShowOtpForm] = useState(false)
  const [showMagicLinkSent, setShowMagicLinkSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [authMethod, setAuthMethod] = useState<"magiclink" | "otp">("magiclink")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()
  const { language, isRTL } = useLanguage()

  const t = {
    ...authTranslations[language],
    ...(language === "ar"
      ? {
          title: "إنشاء حساب جديد",
          joinCommunity: "انضم إلى مجتمع فذلكه التعليمي",
          chooseAuthMethod: "اختر طريقة التحقق المناسبة لك",
          nameField: "الاسم",
          confirmPasswordField: "تأكيد كلمة المرور",
          magicLinkMethod: "الرابط السحري",
          otpMethod: "كود التحقق",
          signUpWithGoogle: "التسجيل باستخدام Google",
          sendMagicLink: "إرسال الرابط السحري",
          sendOtp: "إرسال كود التحقق",
          verifyCode: "تحقق من الكود",
          enterVerificationCode: "أدخل كود التحقق",
          codeSentTo: "تم إرسال كود مكون من 6 أرقام إلى",
          magicLinkSentTo: "تم إرسال رابط تسجيل الدخول إلى",
          resendIn: "إعادة الإرسال خلال",
          resendCode: "لم تستلم الكود؟ أعد الإرسال",
          changeData: "تغيير البيانات",
          createAccount: "إنشاء حساب",
          creatingAccount: "جاري إنشاء الحساب...",
          nameEmailRequired: "الرجاء إدخال الاسم والبريد الإلكتروني",
          enterOtpCode: "الرجاء إدخال كود التحقق المكون من 6 أرقام",
          passwordsNotMatch: "كلمات المرور غير متطابقة",
          accountCreated: "تم إنشاء حسابك بنجاح!",
          otpSent: "تم إرسال كود التحقق إلى",
          magicLinkSent: "تم إرسال الرابط السحري إلى",
          googleSignUpFailed: "فشل التسجيل باستخدام Google",
          alreadyHaveAccount: "لديك حساب بالفعل!",
          welcomeUser: "مرحباً بك",
          youHaveAccount: "لديك حساب بالفعل في منصة فذلكه.",
          goToHome: "الذهاب إلى الصفحة الرئيسية",
          logout: "تسجيل الخروج",
          acceptTermsError: "يجب الموافقة على الشروط والأحكام وسياسة الخصوصية",
          emailExists: "هذا البريد الإلكتروني مسجل بالفعل كبريد أساسي أو ثانوي",
          emailVerifiedMsg: "تم التحقق من البريد الإلكتروني بنجاح",
          verificationRequired: "يجب التحقق من البريد الإلكتروني أولاً",
          haveAccount: "لديك حساب بالفعل؟",
          signIn: "تسجيل الدخول",
        }
      : {
          title: "Create New Account",
          joinCommunity: "Join the Fazlaka educational community",
          chooseAuthMethod: "Choose your preferred verification method",
          nameField: "Name",
          confirmPasswordField: "Confirm Password",
          magicLinkMethod: "Magic Link",
          otpMethod: "Verification Code",
          signUpWithGoogle: "Sign Up with Google",
          sendMagicLink: "Send Magic Link",
          sendOtp: "Send Verification Code",
          verifyCode: "Verify Code",
          enterVerificationCode: "Enter Verification Code",
          codeSentTo: "A 6-digit code has been sent to",
          magicLinkSentTo: "A magic link has been sent to",
          resendIn: "Resend in",
          resendCode: "Didn't receive the code? Resend",
          changeData: "Change Data",
          createAccount: "Create Account",
          creatingAccount: "Creating account...",
          nameEmailRequired: "Please enter name and email",
          enterOtpCode: "Please enter the 6-digit verification code",
          passwordsNotMatch: "Passwords do not match",
          accountCreated: "Your account has been created successfully!",
          otpSent: "Verification code sent to",
          magicLinkSent: "Magic link sent to",
          googleSignUpFailed: "Failed to sign up with Google",
          alreadyHaveAccount: "You already have an account!",
          welcomeUser: "Welcome",
          youHaveAccount: "You already have an account on the Fazlaka platform.",
          goToHome: "Go to Homepage",
          logout: "Logout",
          acceptTermsError: "You must agree to the Terms and Conditions and Privacy Policy",
          emailExists: "This email is already registered as a primary or secondary email",
          emailVerifiedMsg: "Email verified successfully",
          verificationRequired: "Email verification is required first",
          haveAccount: "Already have an account?",
          signIn: "Sign In",
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

  const handleGoogleSignUp = async () => {
    if (!acceptTerms) { setError(t.acceptTermsError); return }
    setIsLoading(true)
    setError("")
    try {
      const result = await signIn("google", { redirect: false })
      if (result?.error) {
        setError(t.googleSignUpFailed)
      } else if (result?.ok) {
        setSuccess(t.accountCreated)
        setTimeout(() => router.push("/"), 1500)
      }
    } catch {
      setError(t.somethingWentWrong)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMagicLink = async () => {
    if (!email || !name) { setError(t.nameEmailRequired); return }
    if (!acceptTerms) { setError(t.acceptTermsError); return }
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, purpose: "register" }),
      })
      const data = await response.json()
      if (response.ok) {
        setShowMagicLinkSent(true)
        setSuccess(`${t.magicLinkSent} ${email}`)
      } else {
        setError(data.error || t.somethingWentWrong)
      }
    } catch {
      setError(t.somethingWentWrong)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendOtp = async () => {
    if (!email || !name) { setError(t.nameEmailRequired); return }
    if (!acceptTerms) { setError(t.acceptTermsError); return }
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, purpose: "register" }),
      })
      const data = await response.json()
      if (response.ok) {
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
    if (!password || password !== confirmPassword) { setError(t.passwordsNotMatch); return }
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpCode, name, password, purpose: "register" }),
      })
      const data = await response.json()
      if (response.ok) {
        setSuccess(t.emailVerifiedMsg)
        const createResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, emailVerified: true }),
        })
        const createData = await createResponse.json()
        if (createResponse.ok) {
          setSuccess(t.accountCreated)
          setTimeout(() => router.push("/sign-in?message=Account created successfully"), 2000)
        } else {
          setError(createData.error || t.somethingWentWrong)
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
        <motion.div initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl dark:shadow-blue-500/10 border border-white/20 dark:border-gray-700/50 p-8">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.alreadyHaveAccount}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{t.welcomeUser} {session.user?.name}، {t.youHaveAccount}</p>
            <div className="space-y-3">
              <AuthButton variant="primary" onClick={() => router.push("/")}>
                <Home className="w-4 h-4" /> {t.goToHome}
              </AuthButton>
              <AuthButton variant="secondary" onClick={() => signOut({ callbackUrl: "/sign-up" })}>
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-blue-500/20 border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">{t.title}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t.joinCommunity}</p>
        </motion.div>

        {/* Messages */}
        <AnimatePresence>
          {error && (
            <motion.div key="error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center space-x-reverse space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
            </motion.div>
          )}
          {success && (
            <motion.div key="success" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center space-x-reverse space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-green-700 dark:text-green-300 text-sm">{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Google Sign Up */}
        <AuthButton variant="google" onClick={handleGoogleSignUp} isLoading={isLoading} loadingText={t.creatingAccount}>
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t.signUpWithGoogle}
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
          {(["magiclink", "otp"] as const).map((method) => {
            const labels = { magiclink: t.magicLinkMethod, otp: t.otpMethod }
            const icons = { magiclink: <Link2 className="w-4 h-4 inline ml-1" />, otp: <Shield className="w-4 h-4 inline ml-1" /> }
            return (
              <button key={method} type="button" onClick={() => setAuthMethod(method)} className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${authMethod === method ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"}`}>
                {icons[method]} {labels[method]}
              </button>
            )
          })}
        </div>

        {/* Magic Link Form */}
        {authMethod === "magiclink" && (
          <div className="space-y-5">
            {!showMagicLinkSent ? (
              <>
                <AuthInput icon={<User className="w-4 h-4" />} type="text" placeholder={isRTL ? "أدخل اسمك" : "Enter your name"} value={name} onChange={setName} autoFocus />
                <AuthInput icon={<Mail className="w-4 h-4" />} type="email" placeholder="example@email.com" value={email} onChange={setEmail} />
                <AuthInput icon={<Lock className="w-4 h-4" />} type="password" placeholder="••••••••••" value={password} onChange={setPassword} />
                <AuthInput icon={<Lock className="w-4 h-4" />} type="password" placeholder="••••••••••" value={confirmPassword} onChange={setConfirmPassword} />
                <div className="flex items-start">
                  <input id="accept-terms-magiclink" type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded mt-1" />
                  <label htmlFor="accept-terms-magiclink" className="mr-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer leading-relaxed">
                    {t.acceptTerms}{" "}
                    <Link href="/terms-conditions" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline">{t.termsAndConditions}</Link>{" "}
                    {t.and}{" "}
                    <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline">{t.privacyPolicy}</Link>
                  </label>
                </div>
                <AuthButton variant="primary" onClick={handleSendMagicLink} isLoading={isLoading} loadingText={t.sending} disabled={!email || !name || !password || !confirmPassword || password !== confirmPassword || !acceptTerms}>
                  <Link2 className="w-4 h-4" /> {t.sendMagicLink}
                </AuthButton>
              </>
            ) : (
              <div className="text-center">
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                    <Link2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t.magicLinkSentTo}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{email}</p>
                </div>
                <button type="button" onClick={() => setShowMagicLinkSent(false)} className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">{t.changeData}</button>
              </div>
            )}
          </div>
        )}

        {/* OTP Form */}
        {authMethod === "otp" && (
          <div className="space-y-5">
            {!showOtpForm ? (
              <>
                <AuthInput icon={<User className="w-4 h-4" />} type="text" placeholder={isRTL ? "أدخل اسمك" : "Enter your name"} value={name} onChange={setName} autoFocus />
                <AuthInput icon={<Mail className="w-4 h-4" />} type="email" placeholder="example@email.com" value={email} onChange={setEmail} />
                <div className="flex items-start">
                  <input id="accept-terms-otp" type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded mt-1" />
                  <label htmlFor="accept-terms-otp" className="mr-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer leading-relaxed">
                    {t.acceptTerms}{" "}
                    <Link href="/terms-conditions" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline">{t.termsAndConditions}</Link>{" "}
                    {t.and}{" "}
                    <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline">{t.privacyPolicy}</Link>
                  </label>
                </div>
                <AuthButton variant="primary" onClick={handleSendOtp} isLoading={isLoading} loadingText={t.sending} disabled={!email || !name || !acceptTerms}>
                  <Shield className="w-4 h-4" /> {t.sendOtp}
                </AuthButton>
              </>
            ) : (
              <div className="text-center">
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                    <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t.enterVerificationCode}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t.codeSentTo} {email}</p>
                </div>
                <div className="mb-6">
                  <input type="text" value={otpCode} onChange={(e) => handleOtpChange(e.target.value)} maxLength={6} className="w-full text-center text-2xl font-bold tracking-widest py-3 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="000000" />
                </div>
                <div className="space-y-4">
                  <AuthInput icon={<Lock className="w-4 h-4" />} type="password" placeholder="••••••••••" value={password} onChange={setPassword} />
                  <AuthInput icon={<Lock className="w-4 h-4" />} type="password" placeholder="••••••••••" value={confirmPassword} onChange={setConfirmPassword} />
                </div>
                <AuthButton variant="primary" onClick={handleVerifyOtp} isLoading={isLoading} loadingText={t.verifying} disabled={otpCode.length !== 6 || !password || password !== confirmPassword} className="mt-6">
                  <CheckCircle className="w-4 h-4" /> {t.createAccount}
                </AuthButton>
                <div className="mt-4 text-center">
                  <button type="button" onClick={handleSendOtp} disabled={countdown > 0} className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 disabled:text-gray-400 disabled:cursor-not-allowed">
                    {countdown > 0 ? `${t.resendIn} ${countdown} ${t.seconds}` : t.resendCode}
                  </button>
                </div>
                <div className="mt-4">
                  <button type="button" onClick={() => { setShowOtpForm(false); setOtpCode("") }} className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">{t.changeData}</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sign In Link */}
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mt-8 text-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t.haveAccount}{" "}
            <Link href="/sign-in" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">{t.signIn}</Link>
          </span>
        </motion.p>
      </motion.div>
    </AuthLayout>
  )
}
