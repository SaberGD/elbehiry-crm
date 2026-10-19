import React, { useState } from 'react';
import { Loader2, LogOut, ShieldAlert } from 'lucide-react';
import { ElBeheryLogo } from '../components/common/ElBeheryLogo';
import { authErrorMessage, useAuth } from '../context/AuthContext';

type Mode = 'login' | 'reset' | 'setup';

const inputCls =
  'w-full p-3 bg-[#0f131b] border border-white/10 text-[#dfe2ee] rounded-xl text-sm placeholder:text-[#8d9197] focus:outline-none focus:border-[#abcae9]/60';

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    dir="rtl"
    className="min-h-screen bg-[#07090e] flex items-center justify-center p-4 text-[#dfe2ee] font-sans"
  >
    <div className="w-full max-w-sm bg-[#181c24] border border-white/10 rounded-2xl p-6 shadow-2xl">
      <div className="flex justify-center mb-5">
        <ElBeheryLogo size="xl" />
      </div>
      {children}
    </div>
  </div>
);

export const LoadingScreen: React.FC = () => (
  <Shell>
    <div className="flex justify-center py-6 text-[#abcae9]">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  </Shell>
);

export const BlockedScreen: React.FC<{ kind: 'no_profile' | 'inactive' }> = ({ kind }) => {
  const { logout, profile } = useAuth();
  return (
    <Shell>
      <div className="text-center space-y-3">
        <ShieldAlert className="w-10 h-10 mx-auto text-[#e9c349]" />
        <h2 className="font-bold text-base">
          {kind === 'inactive' ? 'حسابك معطّل' : 'حسابك غير مفعّل في النظام'}
        </h2>
        <p className="text-xs text-[#c3c7cd] leading-relaxed">
          {kind === 'inactive'
            ? `الحساب ${profile?.email ?? ''} تم إيقافه. تواصل مع مدير النظام.`
            : 'تم تسجيل الدخول لكن لا توجد صلاحيات مرتبطة بحسابك. تواصل مع مدير النظام لتفعيله.'}
        </p>
        <button
          onClick={logout}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#262a33] hover:bg-[#31353e] rounded-xl text-xs font-semibold cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> تسجيل الخروج
        </button>
      </div>
    </Shell>
  );
};

export const LoginPage: React.FC = () => {
  const { login, resetPassword, bootstrapAdmin, needsBootstrap } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else if (mode === 'setup') await bootstrapAdmin({ name, email, password, phone });
      else {
        await resetPassword(email);
        setInfo('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <h1 className="text-center font-bold text-base mb-1">
        {mode === 'setup' ? 'إعداد النظام لأول مرة' : mode === 'reset' ? 'استعادة كلمة المرور' : 'تسجيل الدخول'}
      </h1>
      <p className="text-center text-[11px] text-[#8d9197] mb-5">
        {mode === 'setup'
          ? 'أنشئ حساب مدير النظام الأول. هذه الشاشة تظهر مرة واحدة فقط.'
          : 'نظام إدارة العملاء والمبيعات — EL.BEHERY'}
      </p>

      <form onSubmit={submit} className="space-y-3">
        {mode === 'setup' && (
          <>
            <input className={inputCls} placeholder="الاسم الكامل" required value={name} onChange={(e) => setName(e.target.value)} />
            <input className={inputCls} placeholder="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </>
        )}
        <input
          className={inputCls}
          type="email"
          dir="ltr"
          placeholder="البريد الإلكتروني"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {mode !== 'reset' && (
          <input
            className={inputCls}
            type="password"
            dir="ltr"
            placeholder="كلمة المرور"
            required
            minLength={6}
            autoComplete={mode === 'setup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">{error}</p>}
        {info && <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#7295b3] hover:bg-[#82a5c3] disabled:opacity-60 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === 'setup' ? 'إنشاء حساب المدير' : mode === 'reset' ? 'إرسال رابط الاستعادة' : 'دخول'}
        </button>
      </form>

      <div className="mt-4 text-center text-xs space-y-1.5">
        {mode === 'login' && (
          <button onClick={() => { setMode('reset'); setError(''); }} className="text-[#abcae9] hover:underline cursor-pointer">
            نسيت كلمة المرور؟
          </button>
        )}
        {mode !== 'login' && (
          <button onClick={() => { setMode('login'); setError(''); setInfo(''); }} className="text-[#abcae9] hover:underline cursor-pointer">
            العودة لتسجيل الدخول
          </button>
        )}
        {mode === 'login' && needsBootstrap && (
          <div>
            <button onClick={() => { setMode('setup'); setError(''); }} className="text-[#e9c349] hover:underline cursor-pointer">
              أول مرة؟ إعداد حساب المدير
            </button>
          </div>
        )}
      </div>
    </Shell>
  );
};
