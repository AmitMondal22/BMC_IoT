import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdLogin } from 'react-icons/md';
import { TbLoader2 } from 'react-icons/tb';
import { HiSignal } from 'react-icons/hi2';
import { BiShield } from 'react-icons/bi';
import { BsDropletHalf } from 'react-icons/bs';

export default function LoginPage() {
  const { login }               = useAuth();
  const navigate                = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState('');
  const [ready, setReady]       = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (name) => ({
    width: '100%',
    padding: '12px 42px',
    borderRadius: 10,
    border: `1.5px solid ${focused === name ? '#eab308' : '#e5e7eb'}`,
    background: focused === name ? '#fffbeb' : '#f9fafb',
    fontSize: 14,
    color: '#000000',
    outline: 'none',
    transition: 'all 0.18s ease',
    boxShadow: focused === name ? '0 0 0 3px rgba(234,179,8,0.12)' : 'none',
    fontFamily: 'inherit',
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes logoFloat {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50%      { transform: translateY(-5px) rotate(-3deg); }
        }
        @keyframes spinIcon { to { transform: rotate(360deg); } }
        @keyframes shimmerBar {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }

        .lbtn { transition: all 0.18s ease; }
        .lbtn:hover:not(:disabled) { filter: brightness(1.05); transform: translateY(-1px); box-shadow: 0 10px 32px rgba(234,179,8,0.3) !important; }
        .lbtn:active:not(:disabled) { transform: scale(0.98) translateY(0); }
        .demo-fill { cursor: pointer; }
        .demo-fill:hover { text-decoration: underline; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0px 1000px #f9fafb inset !important; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', system-ui, sans-serif",
        background: '#fafafa', // Light off-white background
        position: 'relative',
        overflow: 'hidden',
        padding: '24px 16px',
      }}>
        {/* Background ambient yellow glow effects */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: 400, height: 400, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(234,179,8,0.06) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: 350, height: 350, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(234,179,8,0.04) 0%, transparent 60%)' }} />

        {/* Floating Logo/Brand Header above form */}
        <div style={{
          width: '100%',
          maxWidth: 420,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2,
          animation: ready ? 'fadeUp 0.5s ease-out forwards' : 'none',
          opacity: ready ? 1 : 0,
        }}>
          {/* Logo container */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: '#fef9c3',
            border: '1px solid #fde68a',
            borderRadius: 14,
            padding: '8px 16px',
            marginBottom: 24,
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: 'linear-gradient(135deg, #ca8a04, #facc15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(234,179,8,0.3)',
              animation: 'logoFloat 3.5s ease-in-out infinite',
            }}>
              <BsDropletHalf size={15} color="#000000" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#000000', letterSpacing: '-0.2px' }}>BMC IoT Platform</span>
          </div>

          {/* Form Card (White container) */}
          <div style={{
            width: '100%',
            background: '#ffffff',
            borderRadius: 24,
            padding: '36px 32px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3), 0 1px 3px rgba(255,255,255,0.05)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Top accent bar */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'linear-gradient(90deg, #ca8a04, #eab308, #facc15, #eab308, #ca8a04)',
              backgroundSize: '300% 100%',
              animation: 'shimmerBar 3s linear infinite',
            }} />

            {/* Header text */}
            <div style={{ marginBottom: 26, textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 20, padding: '3px 10px', marginBottom: 12 }}>
                <HiSignal size={11} color="#ca8a04" />
                <span style={{ fontSize: 10, fontWeight: 800, color: '#854d0e', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Operator Access</span>
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#000000', letterSpacing: '-0.6px', marginBottom: 6 }}>
                Welcome back
              </h2>
              <p style={{ fontSize: 13, color: '#737373' }}>
                Sign in to access your BMC monitoring dashboard
              </p>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div style={{ marginBottom: 14, textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#000000', marginBottom: 6 }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <MdEmail
                    size={17}
                    color={focused === 'email' ? '#eab308' : '#737373'}
                    style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', transition: 'color 0.18s' }}
                  />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused('')}
                    placeholder="admin@bmcplatform.com"
                    autoComplete="email"
                    style={{
                      ...inputStyle('email'),
                      border: `1.5px solid ${focused === 'email' ? '#eab308' : '#e5e7eb'}`,
                      background: focused === 'email' ? '#fffbeb' : '#f9fafb',
                      boxShadow: focused === 'email' ? '0 0 0 3px rgba(234,179,8,0.12)' : 'none',
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 14, textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#000000', marginBottom: 6 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <MdLock
                    size={17}
                    color={focused === 'pwd' ? '#eab308' : '#737373'}
                    style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', transition: 'color 0.18s' }}
                  />
                  <input
                    id="login-password"
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused('pwd')}
                    onBlur={() => setFocused('')}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    style={{
                      ...inputStyle('pwd'),
                      paddingRight: 42,
                      border: `1.5px solid ${focused === 'pwd' ? '#eab308' : '#e5e7eb'}`,
                      background: focused === 'pwd' ? '#fffbeb' : '#f9fafb',
                      boxShadow: focused === 'pwd' ? '0 0 0 3px rgba(234,179,8,0.12)' : 'none',
                    }}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#737373', padding: 4 }}>
                    {showPwd ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#000000', cursor: 'pointer', userSelect: 'none' }}>
                  <input type="checkbox" style={{ accentColor: '#eab308', width: 14, height: 14 }} />
                  Remember me
                </label>
                <a href="/forgot-password" style={{ fontSize: 12, fontWeight: 700, color: '#ca8a04', textDecoration: 'none' }}>
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="lbtn"
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 11, border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 800,
                  color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: loading
                    ? '#eab308'
                    : 'linear-gradient(135deg, #ca8a04 0%, #eab308 50%, #facc15 100%)',
                  boxShadow: '0 4px 18px rgba(234,179,8,0.45)',
                  opacity: loading ? 0.75 : 1,
                  letterSpacing: '-0.1px',
                }}
              >
                {loading
                  ? <TbLoader2 size={18} style={{ animation: 'spinIcon 0.9s linear infinite' }} />
                  : <MdLogin size={18} />}
                {loading ? 'Signing in…' : 'Sign In to Dashboard'}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0 16px' }}>
              <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
              <span style={{ fontSize: 10, color: '#d4d4d8', fontWeight: 600, letterSpacing: '0.07em' }}>DEMO ACCESS</span>
              <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
            </div>

            {/* Demo card */}
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef08a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BiShield size={16} color="#ca8a04" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#854d0e', marginBottom: 5 }}>Demo Credentials</div>
                <div style={{ fontSize: 12, color: '#a16207', lineHeight: 1.9 }}>
                  <span style={{ color: '#a16207' }}>Email · </span>
                  <strong className="demo-fill" style={{ color: '#000000', borderBottom: '1px dashed #ca8a04' }} onClick={() => setEmail('admin@bmcplatform.com')}>
                    admin@bmcplatform.com
                  </strong>
                  <br />
                  <span style={{ color: '#a16207' }}>Password · </span>
                  <strong className="demo-fill" style={{ color: '#000000', borderBottom: '1px dashed #ca8a04' }} onClick={() => setPassword('Admin@123456')}>
                    Admin@123456
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 11, color: '#737373', marginTop: 24 }}>
            © 2026 BMC IoT Platform · Industrial Dairy Monitoring
          </p>
        </div>
      </div>
    </>
  );
}
