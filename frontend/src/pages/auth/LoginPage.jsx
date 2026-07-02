import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Loader2, Shield, Activity, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-[55%] items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 gradient-brand" />
        <div className="absolute inset-0 opacity-30" style={{
          background: 'radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.15), transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(14,165,233,0.2), transparent 50%)'
        }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />

        <div className="relative z-10 text-center text-white p-12 max-w-lg animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-8 rounded-2xl glass flex items-center justify-center text-3xl font-bold animate-float">
            🥛
          </div>
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight">BMC IoT</h1>
          <p className="text-xl font-light opacity-90 leading-relaxed mb-10">
            Industrial Milk Cooler Monitoring Platform
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Shield, value: '500+', label: 'BMC Devices' },
              { icon: Activity, value: '99.9%', label: 'Uptime SLA' },
              { icon: Zap, value: '24/7', label: 'Live Monitoring' },
            ].map((item) => (
              <div key={item.label} className="glass rounded-2xl p-4 text-center">
                <item.icon size={22} className="mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">{item.value}</div>
                <div className="text-[11px] uppercase tracking-wider opacity-70 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand flex items-center justify-center text-2xl font-bold text-white">
              🥛
            </div>
            <h1 className="text-2xl font-bold text-t-primary">BMC IoT Platform</h1>
          </div>

          <h2 className="text-3xl font-bold text-t-primary mb-2">Welcome back</h2>
          <p className="text-sm text-t-secondary mb-8">Sign in to access your monitoring dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-2">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bmcplatform.com"
                className="w-full px-4 py-3 rounded-xl text-sm bg-surface-input border border-edge text-t-primary placeholder:text-t-muted outline-none transition-all duration-200 focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-surface-input border border-edge text-t-primary placeholder:text-t-muted outline-none transition-all duration-200 focus:border-brand focus:ring-2 focus:ring-brand/20 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-t-muted hover:text-t-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-t-secondary text-xs">
                <input type="checkbox" className="rounded accent-brand" />
                Remember me
              </label>
              <a href="/forgot-password" className="text-xs font-semibold text-brand hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand text-white font-semibold text-sm shadow-button hover:bg-brand-dark hover:shadow-lg active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-[11px] mt-10 px-4 py-3 rounded-xl bg-surface-dim text-t-muted">
            Demo: <strong className="text-t-secondary">admin@bmcplatform.com</strong> / <strong className="text-t-secondary">Admin@123456</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
