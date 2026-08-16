import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from './AppContext.tsx';
import { Key, Mail, ShieldAlert, User, Smartphone, Globe, Landmark, Check, MapPin, Upload } from 'lucide-react';
import { TaraptiLogo } from './TaraptiLogo.tsx';
import { useLocationCascade } from '../hooks/useLocationCascade.ts';
import { LocationDropdown } from './LocationDropdown.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../utils/apiFetch';

export const Auth: React.FC = () => {
  const { t } = useTranslation();
  const { setCurrentUser, logApiDiagnostic } = useApp();
  const [mode, setMode] = useState<'login' | 'register_1' | 'register_2' | 'forgot' | 'reset' | 'upload_logo'>('login');
  
  // Logo Upload States & Functions
  const [isUploading, setIsUploading] = useState(false);

  const getLogoName = (type: 'main' | 'login' | 'chat') => {
    if (type === 'chat') return 'Floating Chat';
    if (type === 'login') return 'Halaman Login';
    return 'Utama (Menu)';
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'login' | 'chat') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setSuccessMsg('');
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const res = await apiFetch('/api/upload-logo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: base64, type })
        });
        if (res.ok) {
          setSuccessMsg(`Logo ${getLogoName(type)} berhasil diunggah! Memuat ulang...`);
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setErrorMsg(`Gagal mengunggah logo ${getLogoName(type)}.`);
        }
      } catch (err) {
        setErrorMsg('Terjadi kesalahan saat mengunggah.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoDelete = async (type: 'main' | 'login' | 'chat') => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsUploading(true);

    try {
      const res = await apiFetch('/api/delete-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      if (res.ok) {
        setSuccessMsg(`Logo ${getLogoName(type)} berhasil dihapus! Memuat ulang...`);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setErrorMsg(`Gagal menghapus logo ${getLogoName(type)}.`);
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan saat menghapus logo.');
    } finally {
      setIsUploading(false);
    }
  };

  // Registration States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappLocalNumber, setWhatsappLocalNumber] = useState('');
  const [password, setPassword] = useState('');

  // Location Cascade Hook
  const {
    countries,
    provinces,
    cities,
    selectedCountry,
    selectedProvince,
    selectedCity,
    setSelectedCountry,
    setSelectedProvince,
    setSelectedCity,
    isLoadingCountries,
    isLoadingProvinces,
    isLoadingCities,
    dialCode
  } = useLocationCascade();
  
  // Helper for E.164 normalization
  const normalizePhoneNumber = (code: string, local: string) => {
    const cleanedCode = code.replace('+', '');
    const cleanedLocal = local.replace(/^0+/, '');
    return `+${cleanedCode}${cleanedLocal}`;
  };



  // Other States
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent, customCreds?: { email: string; pass: string }) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const loginEmail = customCreds ? customCreds.email : email;
    const loginPass = customCreds ? customCreds.pass : password;

    if (!loginEmail || !loginPass) {
      setErrorMsg('Please specify both registered Email and Password.');
      return;
    }

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token || data.accessToken) {
          localStorage.setItem('accessToken', data.token || data.accessToken);
        }
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        setCurrentUser(data.user);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Invalid credentials.');
      }
    } catch (err) {
      setErrorMsg('Network anomaly. Failed to establish secure connection.');
    }
  };

  const handleNextStepRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!firstName || !lastName || !password || !email) {
      setErrorMsg('All fields are required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Invalid email format.');
      return;
    }

    setIsValidating(true);
    try {
      const res = await apiFetch(`/api/auth/check-availability?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.email_taken) {
          setErrorMsg('Email is already in use.');
        } else {
          // Generate a placeholder username from email
          const baseUser = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
          const randomSuffix = Math.floor(Math.random() * 1000);
          setUsername(`${baseUser}${randomSuffix}`);
          setMode('register_2');
        }
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to check account availability.');
      }
    } catch (err) {
      setErrorMsg('Network issue. Failed to verify availability.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRegisterComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedCountry) {
      setErrorMsg('Country selection is required.');
      return;
    }
    if (!selectedProvince) {
      setErrorMsg('Province selection is required.');
      return;
    }
    if (!selectedCity) {
      setErrorMsg('City selection is required.');
      return;
    }
    if (!whatsappLocalNumber) {
      setErrorMsg('WhatsApp number is required.');
      return;
    }

    setIsSubmitting(true);
    const normalizedWhatsapp = normalizePhoneNumber(dialCode, whatsappLocalNumber);
    const requestPayload = {
      firstName,
      lastName,
      username,
      email,
      password,
      whatsappNumber: normalizedWhatsapp,
      country: selectedCountry.name,
      province: selectedProvince.name,
      city: selectedCity.name,
    };

    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      let resData = null;
      try {
        resData = await res.json();
      } catch {
        resData = { rawStatus: res.status };
      }

      logApiDiagnostic('REGISTER_USER', {
        url: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestPayload
      }, res, resData);

      if (res.ok) {
        if (resData.token || resData.accessToken) {
          localStorage.setItem('accessToken', resData.token || resData.accessToken);
        }
        if (resData.refreshToken) {
          localStorage.setItem('refreshToken', resData.refreshToken);
        }
        setSuccessMsg('Registration successful! Welcome to Tarapti...');
        setTimeout(() => {
          setCurrentUser(resData.user);
        }, 1500);
      } else {
        setErrorMsg(resData.error || 'Registration failed.');
      }
    } catch (err) {
      logApiDiagnostic('REGISTER_USER_ERROR', {
        url: '/api/auth/register',
        method: 'POST',
        body: requestPayload
      }, undefined, undefined, err);
      setErrorMsg('Network error. Failed to complete registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await apiFetch(`/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        setSuccessMsg('A security verification code was dispatched to your WhatsApp and registered Email.');
        setTimeout(() => {
          setMode('reset');
          setSuccessMsg('');
        }, 3000);
      } else {
        setErrorMsg('Email address not found in our trader registries.');
      }
    } catch (e) {
      setErrorMsg('An error occurred during verification dispatch.');
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await apiFetch(`/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword: password })
      });

      if (res.ok) {
        setSuccessMsg('Security credentials updated. Logging in...');
        setTimeout(() => {
          handleLogin(null as any);
        }, 2000);
      } else {
        setErrorMsg('Failed to update passwords.');
      }
    } catch (e) {
      setErrorMsg('A network error occurred.');
    }
  };

  return (
    <div 
      id="auth-screen" 
      className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden bg-[#020617] font-sans animate-in fade-in duration-700"
    >
      {/* Sleek, professional technical grid overlay - restored for dark theme */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.04)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] z-0 pointer-events-none" />
      
      {/* Premium ambient light & radial glow mesh (Vercel-style, ultra clean) */}
      <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[120%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18),rgba(14,165,233,0.08)_40%,transparent_70%)] blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-[40%] -left-[20%] w-[60%] h-[50%] bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.12),transparent_60%)] blur-[100px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 right-[10%] w-[50%] h-[40%] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_60%)] blur-[100px] z-0 pointer-events-none" />
      
      {/* Floating ambient particles (Data nodes) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0.15, 0.35, 0.15], 
              scale: [1, 1.2, 1],
              x: [0, Math.random() * 40 - 20, 0],
              y: [0, Math.random() * 40 - 20, 0]
            }}
            transition={{ 
              duration: 10 + i * 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute w-1 h-1 bg-indigo-400 rounded-full blur-[1px]"
            style={{
              top: `${20 + i * 12}%`,
              left: `${15 + (i * 17) % 70}%`,
            }}
          />
        ))}
      </div>

      {/* Dynamic warm spotlight behind the main card to provide clean contrast and luxury aesthetic */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08),transparent_60%)] blur-[90px] z-0 pointer-events-none" />
      
      {/* Refined subtle top border accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent z-0" />

      {/* Main Container */}
      <div className="w-full max-w-[340px] z-10 space-y-6">
        
        {/* Branding Logo & Header */}
        <div className="flex flex-col items-center text-center space-y-1 select-none animate-in fade-in slide-in-from-top-4 duration-700">
          <TaraptiLogo height={96} textColor="#ffffff" type="login" />
        </div>

        {/* Deep Dark Glassmorphic Card - Now with darker base */}
        <div className="bg-[#0d121f]/95 backdrop-blur-[50px] border border-white/10 rounded-[32px] p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative overflow-hidden ring-1 ring-white/5 animate-in zoom-in-95 duration-500">
          {/* subtle internal glows and glass flares */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/15 rounded-full blur-3xl opacity-25" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/15 rounded-full blur-3xl opacity-15" />

          
          {/* Moving glass flare effect */}
          <motion.div 
            animate={{ 
              left: ['-100%', '200%'],
              opacity: [0, 0.5, 0]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              repeatDelay: 4,
              ease: "linear" 
            }}
            className="absolute top-0 w-24 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg] pointer-events-none z-10" 
          />

          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          
          {/* Header Title with premium accent */}
          <div className="mb-6">
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              {mode === 'login' && t('auth.authorizeAccess')}
              {mode === 'register_1' && t('auth.dataStep1')}
              {mode === 'register_2' && t('auth.locationStep2')}
              {mode === 'forgot' && t('auth.forgotTitle')}
              {mode === 'reset' && t('auth.resetTitle')}
              {mode === 'upload_logo' && 'Upload & Kelola Logo'}
            </h2>
            <p className="text-[11px] leading-relaxed text-slate-400 mt-1.5 font-medium">
              {mode === 'login' && t('auth.loginDesc')}
              {mode === 'register_1' && t('auth.register1Desc')}
              {mode === 'register_2' && t('auth.register2Desc')}
              {mode === 'forgot' && t('auth.forgotDesc')}
              {mode === 'reset' && t('auth.resetDesc')}
              {mode === 'upload_logo' && 'Ubah logo utama atau logo floating chat agar sesuai dengan brand Anda.'}
            </p>
          </div>

          {/* Validation Alerts */}
          {errorMsg && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-[10px] mb-4 flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-[10px] mb-4 flex items-start gap-2 animate-pulse">
              <Check size={14} className="shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* AUTHORIZATION FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-white transition-all group-focus-within:drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" size={14} />
                  <input
                    type="email"
                    required
                    placeholder="name@youremail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-300/50 focus:outline-none focus:border-indigo-400/80 focus:ring-1 focus:ring-indigo-500/40 focus:bg-white/[0.14] transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_1px_4px_rgba(0,0,0,0.3)] font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Password</label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setErrorMsg(''); }}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative group">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-white transition-all group-focus-within:drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" size={14} />
                  <input
                    type="password"
                    required
                    placeholder="Security key"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-300/50 focus:outline-none focus:border-indigo-400/80 focus:ring-1 focus:ring-indigo-500/40 focus:bg-white/[0.14] transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_1px_4px_rgba(0,0,0,0.3)] font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-[11px] uppercase tracking-widest transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
              >
                Authorize Connection
              </button>
            </form>
          )}

          {/* REGISTRATION STEP 1 */}
          {mode === 'register_1' && (
            <form onSubmit={handleNextStepRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">First Name</label>
                  <input
                    type="text"
                    required
                    disabled={isValidating}
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-300/50 focus:outline-none focus:border-indigo-400/80 focus:ring-1 focus:ring-indigo-500/40 focus:bg-white/[0.14] transition-all disabled:opacity-40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_1px_4px_rgba(0,0,0,0.3)] font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Last Name</label>
                  <input
                    type="text"
                    required
                    disabled={isValidating}
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-300/50 focus:outline-none focus:border-indigo-400/80 focus:ring-1 focus:ring-indigo-500/40 focus:bg-white/[0.14] transition-all disabled:opacity-40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_1px_4px_rgba(0,0,0,0.3)] font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Password</label>
                <div className="relative group">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-white transition-all group-focus-within:drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" size={14} />
                  <input
                    type="password"
                    required
                    disabled={isValidating}
                    placeholder="Create security key"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-300/50 focus:outline-none focus:border-indigo-400/80 focus:ring-1 focus:ring-indigo-500/40 focus:bg-white/[0.14] transition-all disabled:opacity-40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_1px_4px_rgba(0,0,0,0.3)] font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-white transition-all group-focus-within:drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" size={14} />
                  <input
                    type="email"
                    required
                    disabled={isValidating}
                    placeholder="name@youremail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-300/50 focus:outline-none focus:border-indigo-400/80 focus:ring-1 focus:ring-indigo-500/40 focus:bg-white/[0.14] transition-all disabled:opacity-40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_1px_4px_rgba(0,0,0,0.3)] font-medium"
                  />
                </div>
              </div>



              <button
                type="submit"
                disabled={isValidating}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-[11px] uppercase tracking-widest transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isValidating ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </form>
          )}

          {/* REGISTRATION STEP 2 */}
          {mode === 'register_2' && (
            <form onSubmit={handleRegisterComplete} className="space-y-4">
              
              <LocationDropdown
                label="Country"
                options={countries}
                value={selectedCountry}
                onChange={setSelectedCountry}
                isLoading={isLoadingCountries}
                disabled={isSubmitting}
                placeholder="Select Country"
                id="country-select"
              />

              <LocationDropdown
                label="Province"
                options={provinces}
                value={selectedProvince}
                onChange={setSelectedProvince}
                isLoading={isLoadingProvinces}
                disabled={!selectedCountry || isSubmitting}
                placeholder="Select Province"
                id="province-select"
              />

              <LocationDropdown
                label="City"
                options={cities}
                value={selectedCity}
                onChange={setSelectedCity}
                isLoading={isLoadingCities}
                disabled={!selectedProvince || isSubmitting}
                placeholder="Select City"
                id="city-select"
              />

              <div className="space-y-1.5 pt-1">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">WhatsApp</label>
                <div className="flex gap-2">
                  <div className="w-16 bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-xl px-2 py-2.5 text-xs text-indigo-300 text-center flex items-center justify-center font-mono font-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_1px_4px_rgba(0,0,0,0.3)]">
                    {dialCode || '+...'}
                  </div>
                  <input
                    type="tel"
                    required
                    disabled={isSubmitting}
                    placeholder="812..."
                    value={whatsappLocalNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setWhatsappLocalNumber(val);
                    }}
                    className="flex-1 bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-300/50 focus:outline-none focus:border-indigo-400/80 focus:ring-1 focus:ring-indigo-500/40 focus:bg-white/[0.14] transition-all disabled:opacity-40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_1px_4px_rgba(0,0,0,0.3)] font-medium"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setMode('register_1')}
                  className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-black rounded-xl text-[11px] transition-all duration-200 disabled:opacity-50 active:scale-[0.98]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[1.5] py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-[11px] transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Join...</span>
                    </>
                  ) : (
                    <span>Join Now</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-white transition-all group-focus-within:drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" size={14} />
                  <input
                    type="email"
                    required
                    placeholder="name@youremail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-300/50 focus:outline-none focus:border-indigo-400/80 focus:ring-1 focus:ring-indigo-500/40 focus:bg-white/[0.14] transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_1px_4px_rgba(0,0,0,0.3)] font-medium"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-[11px] uppercase tracking-widest transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
              >
                Verify Identity
              </button>
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); }}
                className="w-full text-center text-[10px] text-slate-400 hover:text-white pt-1.5 block font-black transition-colors"
              >
                Return to Login
              </button>
            </form>
          )}

          {/* RESET PASSWORD */}
          {mode === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">New Password</label>
                <div className="relative group">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-white transition-all group-focus-within:drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" size={14} />
                  <input
                    type="password"
                    required
                    placeholder="Create security key"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-300/50 focus:outline-none focus:border-indigo-400/80 focus:ring-1 focus:ring-indigo-500/40 focus:bg-white/[0.14] transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_1px_4px_rgba(0,0,0,0.3)] font-medium"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-[11px] uppercase tracking-widest transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
              >
                Confirm Reset
              </button>
            </form>
          )}

          {/* LOGO UPLOAD & MANAGEMENT */}
          {mode === 'upload_logo' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Main Logo Section */}
              <div className="space-y-2 p-3 bg-white/[0.03] border border-white/5 rounded-2xl relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Logo Utama (Menu)</span>
                  <span className="text-[8px] text-slate-500 font-bold">PNG, JPG, SVG</span>
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">Logo ini ditampilkan di bagian header aplikasi utama (dengan background terang).</p>
                <div className="flex gap-2 pt-1">
                  <label className="flex-1 block bg-indigo-600 hover:bg-indigo-500 text-white font-black text-center py-2 px-3 rounded-xl cursor-pointer transition text-[9px] uppercase tracking-wider select-none">
                    Upload Baru
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/svg+xml" 
                      className="hidden" 
                      disabled={isUploading}
                      onChange={(e) => handleLogoUpload(e, 'main')} 
                    />
                  </label>
                  <button 
                    type="button"
                    disabled={isUploading}
                    onClick={() => handleLogoDelete('main')}
                    className="py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold rounded-xl transition text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    Hapus
                  </button>
                </div>
              </div>

              {/* Login Page Logo Section */}
              <div className="space-y-2 p-3 bg-white/[0.03] border border-white/5 rounded-2xl relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Logo Halaman Login</span>
                  <span className="text-[8px] text-slate-500 font-bold">PNG, JPG, SVG</span>
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">Logo ini ditampilkan di atas form login (dengan background gelap).</p>
                <div className="flex gap-2 pt-1">
                  <label className="flex-1 block bg-indigo-600 hover:bg-indigo-500 text-white font-black text-center py-2 px-3 rounded-xl cursor-pointer transition text-[9px] uppercase tracking-wider select-none">
                    Upload Baru
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/svg+xml" 
                      className="hidden" 
                      disabled={isUploading}
                      onChange={(e) => handleLogoUpload(e, 'login')} 
                    />
                  </label>
                  <button 
                    type="button"
                    disabled={isUploading}
                    onClick={() => handleLogoDelete('login')}
                    className="py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold rounded-xl transition text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    Hapus
                  </button>
                </div>
              </div>

              {/* Chat Logo Section */}
              <div className="space-y-2 p-3 bg-white/[0.03] border border-white/5 rounded-2xl relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Logo Floating Chat</span>
                  <span className="text-[8px] text-slate-500 font-bold">PNG, JPG, SVG</span>
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">Logo ini digunakan untuk floating chat asisten di pojok kanan bawah.</p>
                <div className="flex gap-2 pt-1">
                  <label className="flex-1 block bg-indigo-600 hover:bg-indigo-500 text-white font-black text-center py-2 px-3 rounded-xl cursor-pointer transition text-[9px] uppercase tracking-wider select-none">
                    Upload Baru
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/svg+xml" 
                      className="hidden" 
                      disabled={isUploading}
                      onChange={(e) => handleLogoUpload(e, 'chat')} 
                    />
                  </label>
                  <button 
                    type="button"
                    disabled={isUploading}
                    onClick={() => handleLogoDelete('chat')}
                    className="py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold rounded-xl transition text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    Hapus
                  </button>
                </div>
              </div>

              {/* Back button */}
              <button
                type="button"
                disabled={isUploading}
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                className="w-full text-center text-[10px] text-slate-400 hover:text-white pt-1 block font-black transition-colors uppercase tracking-widest cursor-pointer disabled:opacity-40"
              >
                ← Kembali ke Login
              </button>
            </div>
          )}

          {/* Bottom navigation switches */}
          {mode === 'login' && (
            <div className="space-y-3.5 mt-5 text-center">
              <p className="text-[10px] text-slate-400 font-medium">
                New member?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register_1'); setErrorMsg(''); }}
                  className="text-indigo-400 font-black hover:text-indigo-300"
                >
                  Register
                </button>
              </p>
            </div>
          )}

          {mode.startsWith('register') && (
            <div className="space-y-3 mt-5 text-center">
              <p className="text-[10px] text-slate-400 font-medium">
                Already a member?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMsg(''); }}
                  className="text-indigo-400 font-black hover:text-indigo-300"
                >
                  Log In
                </button>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
