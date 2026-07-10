"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Shield, Key, CheckCircle, AlertCircle, ArrowRight } from "lucide-react"
import { useLanguage } from "@/components/Language/LanguageProvider"
import AuthLayout from "@/components/Auth/AuthLayout"
import AuthInput from "@/components/Auth/AuthInput"
import AuthButton from "@/components/Auth/AuthButton"
import authTranslations from "@/components/Auth/auth-translations"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showOtpForm, setShowOtpForm] = useState(false)
  const [_showOtpSent, setShowOtpSent] = useState(false)
  const [resetMethod, setResetMethod] = useState<"link" | "otp">("link")
  const [_primaryEmail, setPrimaryEmail] = useState("")

  const router = useRouter()
  const { language } = useLanguage()

  const t = {
    ...authTranslations[language],
    ...(language === "ar"
      ? {
          title: "نسيت كلمة المرور",
          subtitle: "اختر طريقة استعادة كلمة المرور",
          backToSignIn: "العودة إلى تسجيل الدخول",
          newPasswordField: "كلمة المرور الجديدة",
          confirmPasswordField: "تأكيد كلمة المرور الجديدة",
          linkMethod: "رابط إعادة التعيين",
          otpMethod: "كود التحقق",
          sendResetLink: "إرسال رابط إعادة التعيين",
          sendOtp: "إرسال كود التحقق",
          verifyCode: "تحقق من الكود",
          enterVerificationCode: "أدخل كود التحقق",
          codeSentTo: "تم إرسال كود مكون من 6 أرقام إلى",
          resendCode: "لم تستلم الكود؟ أعد الإرسال",
          changeEmail: "تغيير البريد الإلكتروني",
          resetPassword: "إعادة تعيين كلمة المرور",
          resetting: "جاري إعادة التعيين...",
          redirecting: "جاري التوجيه...",
          enterEmail: "الرجاء إدخال البريد الإلكتروني",
          enterOtpCode: "الرجاء إدخال كود التحقق المكون من 6 أرقام",
          passwordsNotMatch: "كلمات المرور غير متطابقة",
          passwordTooShort: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
          resetLinkSent: "تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني",
          otpSent: "تم إرسال كود التحقق إلى",
          codeVerified: "تم التحقق من الكود بنجاح. سيتم توجيهك إلى صفحة إعادة تعيين كلمة المرور.",
          passwordResetSuccess: "تم إعادة تعيين كلمة المرور بنجاح!",
          invalidOtp: "كود التحقق غير صالح",
          resetFailed: "فشل إعادة تعيين كلمة المرور",
          userNotFound: "لم يتم العثور على مستخدم بهذا البريد الإلكتروني",
          otpExpired: "انتهت صلاحية كود التحقق. يرجى طلب كود جديد",
          otpNotVerified: "لم يتم التحقق من الكود. يرجى التحقق من الكود أولاً",
          samePassword: "لا يمكن استخدام كلمة المرور الحالية. يرجى اختيار كلمة مرور جديدة",
          passwordComplexity: "كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل، حرف صغير واحد، رقم واحد، وحرف خاص واحد",
          primaryEmailNote: "ملاحظة: سيتم إعادة تعيين كلمة المرور لحسابك الأساسي",
        }
      : {
          title: "Forgot Password",
          subtitle: "Choose a password recovery method",
          backToSignIn: "Back to Sign In",
          newPasswordField: "New Password",
          confirmPasswordField: "Confirm New Password",
          linkMethod: "Reset Link",
          otpMethod: "Verification Code",
          sendResetLink: "Send Reset Link",
          sendOtp: "Send Verification Code",
          verifyCode: "Verify Code",
          enterVerificationCode: "Enter Verification Code",
          codeSentTo: "A 6-digit code has been sent to",
          resendCode: "Didn't receive code? Resend",
          changeEmail: "Change Email",
          resetPassword: "Reset Password",
          resetting: "Resetting...",
          redirecting: "Redirecting...",
          enterEmail: "Please enter your email",
          enterOtpCode: "Please enter 6-digit verification code",
          passwordsNotMatch: "Passwords do not match",
          passwordTooShort: "Password must be at least 8 characters",
          resetLinkSent: "Password reset link has been sent to your email",
          otpSent: "Verification code sent to",
          codeVerified: "Code verified successfully. You will be redirected to the password reset page.",
          passwordResetSuccess: "Password has been reset successfully!",
          invalidOtp: "Invalid verification code",
          resetFailed: "Failed to reset password",
          userNotFound: "User not found with this email",
          otpExpired: "OTP code has expired. Please request a new code",
          otpNotVerified: "OTP not verified. Please verify your OTP first",
          samePassword: "Cannot use current password. Please choose a new password",
          passwordComplexity: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
          primaryEmailNote: "Note: Password will be reset for your primary account",
        }),
  }

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (response.ok) {
        setSuccess(t.resetLinkSent)
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
    if (!email) { setError(t.enterEmail); return }
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "reset" }),
      })
      const data = await response.json()
      if (response.ok) {
        setShowOtpSent(true)
        setShowOtpForm(true)
        setSuccess(`${t.otpSent} ${email}`)
        if (data.primaryEmail) {
          setPrimaryEmail(data.primaryEmail)
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
        body: JSON.stringify({ email, otpCode, purpose: "reset" }),
      })
      const data = await response.json()
      if (response.ok) {
        setSuccess(t.codeVerified)
        if (data.user && data.user.email !== email) {
          setPrimaryEmail(data.user.email)
          setSuccess((prev) => prev + ` (الإيميل الأساسي: ${data.user.email})`)
        }
        if (data.redirectUrl) {
          setTimeout(() => router.push(data.redirectUrl), 2000)
        }
      } else {
        switch (data.error) {
          case "User not found": setError(t.userNotFound); break
          case "Invalid OTP code": setError(t.invalidOtp); break
          case "OTP code has expired": setError(t.otpExpired); break
          default: setError(data.error || t.invalidOtp)
        }
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

  return (
    <AuthLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-blue-500/20 border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Mail className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">{t.title}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t.subtitle}</p>
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

        {/* Reset Method Tabs */}
        <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button type="button" onClick={() => setResetMethod("link")} className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${resetMethod === "link" ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"}`}>
            <Mail className="w-4 h-4 inline ml-1" /> {t.linkMethod}
          </button>
          <button type="button" onClick={() => setResetMethod("otp")} className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${resetMethod === "otp" ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"}`}>
            <Key className="w-4 h-4 inline ml-1" /> {t.otpMethod}
          </button>
        </div>

        {/* Link Reset Form */}
        {resetMethod === "link" && !success && (
          <form onSubmit={handleSendLink} className="space-y-5">
            <AuthInput icon={<Mail className="w-4 h-4" />} type="email" placeholder="example@email.com" value={email} onChange={setEmail} autoFocus />
            <AuthButton type="submit" variant="primary" isLoading={isLoading} loadingText={t.sending}>
              {t.sendResetLink} <ArrowRight className="w-4 h-4" />
            </AuthButton>
          </form>
        )}

        {/* OTP Reset Form */}
        {resetMethod === "otp" && (
          <div className="space-y-5">
            {!showOtpForm ? (
              <>
                <AuthInput icon={<Mail className="w-4 h-4" />} type="email" placeholder="example@email.com" value={email} onChange={setEmail} autoFocus />
                <AuthButton variant="primary" onClick={handleSendOtp} isLoading={isLoading} loadingText={t.sending} disabled={!email}>
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
                  <button type="button" onClick={handleSendOtp} className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">{t.resendCode}</button>
                </div>
                <div className="mt-4">
                  <button type="button" onClick={() => { setShowOtpForm(false); setShowOtpSent(false); setOtpCode(""); setPrimaryEmail("") }} className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">{t.changeEmail}</button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Back to Sign In */}
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mt-8 text-center">
          <Link href="/sign-in" className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">{t.backToSignIn}</Link>
        </motion.p>
      </motion.div>
    </AuthLayout>
  )
}
