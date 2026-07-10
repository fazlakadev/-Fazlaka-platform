'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function DesktopAuthPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const port = searchParams.get('port') || '8580';
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return;

    const login = async () => {
      try {
        const res = await fetch('/api/auth/desktop-exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }),
        });

        const data = await res.json();
        if (!data.success) {
          setError(data.error || 'فشل تسجيل الدخول');
          return;
        }

        const params = new URLSearchParams({
          token: data.token,
          user: JSON.stringify({
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }),
        });

        window.location.href = `http://localhost:${port}/callback?${params}`;
      } catch {
        setError('فشل الاتصال بالخادم');
      }
    };

    login();
  }, [status, session, port]);

  if (status === 'loading') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>جاري التحميل...</h2>
        </div>
      </div>
    );
  }

  if (status === 'authenticated' && error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>خطأ</h2>
          <p style={styles.text}>{error}</p>
          <button
            onClick={() => signIn('google', { callbackUrl: `/auth/desktop?port=${port}` })}
            style={styles.button}
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <div style={styles.container}>
        <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
        <div style={styles.card}>
          <h2 style={styles.title}>جاري تسجيل الدخول...</h2>
          <p style={styles.text}>مرحباً {session.user?.name}</p>
          <div style={styles.spinner} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>تسجيل الدخول إلى فذلكة</h2>
        <p style={styles.text}>استخدم حساب Google الخاص بك للدخول إلى تطبيق سطح المكتب</p>
        <button
          onClick={() => signIn('google', { callbackUrl: `/auth/desktop?port=${port}` })}
          style={styles.button}
        >
          <span style={styles.googleIcon}>G</span>
          تسجيل الدخول بـ Google
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: '#030712',
    fontFamily: 'system-ui, sans-serif',
    direction: 'rtl',
  },
  card: {
    textAlign: 'center',
    padding: '48px',
    background: '#0F172A',
    borderRadius: '24px',
    border: '1px solid #1E293B',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    maxWidth: '400px',
    width: '90%',
  },
  title: {
    color: '#E2E8F0',
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '12px',
    marginTop: 0,
  },
  text: {
    color: '#94A3B8',
    fontSize: '14px',
    marginBottom: '24px',
    marginTop: 0,
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 32px',
    background: '#1E293B',
    color: '#E2E8F0',
    border: '1px solid #334155',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    outline: 'none',
  },
  googleIcon: {
    background: '#4285F4',
    color: 'white',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '3px solid #1E293B',
    borderTop: '3px solid #6366F1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto',
  },
};
