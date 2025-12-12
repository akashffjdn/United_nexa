import { useState, useRef } from 'react';
import { Eye, EyeOff, ArrowUpRight, Truck, Package, MapPin } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { loginSchema } from '../../schemas';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState<'email' | 'password' | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const validationTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const { login, loading } = useAuth();

  const getCurrentFinancialYear = () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };

  const validateField = (name: string, value: string) => {
    try {
      const fieldSchema = (loginSchema.shape as any)[name];
      if (fieldSchema) {
        const result = fieldSchema.safeParse(value);
        if (!result.success) {
          setFormErrors(prev => ({ ...prev, [name]: result.error.issues[0].message }));
        } else {
          setFormErrors(prev => {
            const next = { ...prev };
            delete next[name];
            return next;
          });
        }
      }
    } catch (e) {}
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
    if (validationTimeouts.current.email) clearTimeout(validationTimeouts.current.email);
    validationTimeouts.current.email = setTimeout(() => {
      validateField('email', val);
    }, 1000);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (formErrors.password) setFormErrors(prev => ({ ...prev, password: '' }));
    if (validationTimeouts.current.password) clearTimeout(validationTimeouts.current.password);
    validationTimeouts.current.password = setTimeout(() => {
      validateField('password', val);
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationResult = loginSchema.safeParse({ email, password });
    if (!validationResult.success) {
      const newErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((err: any) => {
        if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
      });
      setFormErrors(newErrors);
      return;
    }
    if (loading) return;
    try {
      await login(email, password, getCurrentFinancialYear());
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground overflow-hidden relative">
      {/* Custom Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap');
        
        .font-display { font-family: 'Playfair Display', serif; }
        .font-body { font-family: 'DM Sans', sans-serif; }
        
        /* Entry Animations */
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes expandWidth {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        
        /* Logistics Animations */
        @keyframes moveTruck {
          0% { transform: translateX(-100px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(calc(100% + 100px)); opacity: 0; }
        }
        
        @keyframes movePackage {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.5); opacity: 0.3; }
        }
        
        @keyframes drawPath {
          0% { stroke-dashoffset: 1000; }
          100% { stroke-dashoffset: 0; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .animate-slideUp { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fadeIn { animation: fadeIn 1s ease forwards; }
        .animate-expandWidth { animation: expandWidth 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-truck { animation: moveTruck 12s linear infinite; }
        .animate-package { animation: movePackage 2s ease-in-out infinite; }
        .animate-pulse-dot { animation: pulse 2s ease-in-out infinite; }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-path { animation: drawPath 3s ease forwards; stroke-dasharray: 1000; stroke-dashoffset: 1000; }
        
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-700 { animation-delay: 0.7s; }
        .delay-1000 { animation-delay: 1s; }
        
        .input-underline {
          background: linear-gradient(90deg, 
            hsl(var(--primary)) 0%, 
            hsl(var(--primary) / 0.7) 50%, 
            hsl(var(--primary)) 100%
          );
          transform-origin: left;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .btn-primary-custom {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          position: relative;
          overflow: hidden;
        }
        
        .btn-primary-custom::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent,
            hsl(var(--primary-foreground) / 0.2),
            transparent
          );
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }
        
        .btn-primary-custom:hover:not(:disabled)::before {
          transform: translateX(100%);
        }
        
        /* Clean input styles */
        .clean-input {
          outline: none !important;
          box-shadow: none !important;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          border-radius: 0;
        }
        
        .clean-input:focus,
        .clean-input:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }
        
        .clean-input:-webkit-autofill,
        .clean-input:-webkit-autofill:hover,
        .clean-input:-webkit-autofill:focus,
        .clean-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px hsl(var(--background)) inset !important;
          -webkit-text-fill-color: hsl(var(--foreground)) !important;
          caret-color: hsl(var(--foreground)) !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        
        *:focus, *:focus-visible {
          outline: none;
        }
        
        /* Gradient mesh for light mode */
        .gradient-mesh {
          background: 
            radial-gradient(at 20% 20%, hsl(var(--primary) / 0.08) 0%, transparent 50%),
            radial-gradient(at 80% 80%, hsl(var(--primary) / 0.05) 0%, transparent 50%),
            radial-gradient(at 40% 60%, hsl(var(--primary) / 0.03) 0%, transparent 50%);
        }
        
        /* Route line styles */
        .route-line {
          stroke: hsl(var(--primary) / 0.3);
          stroke-width: 2;
          fill: none;
          stroke-linecap: round;
          stroke-dasharray: 8 4;
        }
        
        /* Location dot */
        .location-dot {
          fill: hsl(var(--primary));
        }
        
        /* Card with subtle border */
        .form-card {
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          box-shadow: 
            0 4px 6px -1px hsl(var(--foreground) / 0.05),
            0 2px 4px -2px hsl(var(--foreground) / 0.05);
        }
      `}</style>

      {/* Animated Background - Works for both light and dark */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient Mesh Background */}
        <div className="absolute inset-0 gradient-mesh" />
        
        {/* Animated Route SVG */}
        <svg className="absolute inset-0 w-full h-full opacity-40" preserveAspectRatio="none">
          {/* Curved route path */}
          <path 
            className="route-line animate-path"
            d="M -50 400 Q 200 350 400 450 T 800 400 T 1200 500 T 1600 400"
          />
          <path 
            className="route-line animate-path delay-500"
            d="M -50 600 Q 300 550 500 650 T 900 580 T 1300 650 T 1700 600"
            style={{ animationDelay: '0.5s' }}
          />
        </svg>
        
        {/* Animated location dots */}
        <div className="absolute top-[35%] left-[15%] animate-pulse-dot" style={{ animationDelay: '0s' }}>
          <div className="w-3 h-3 rounded-full bg-primary/40" />
        </div>
        <div className="absolute top-[45%] left-[30%] animate-pulse-dot" style={{ animationDelay: '0.5s' }}>
          <div className="w-2 h-2 rounded-full bg-primary/30" />
        </div>
        <div className="absolute top-[38%] left-[45%] animate-pulse-dot" style={{ animationDelay: '1s' }}>
          <div className="w-3 h-3 rounded-full bg-primary/40" />
        </div>
        
        {/* Moving truck animation */}
        <div className="absolute top-[42%] left-0 w-full">
          <div className="animate-truck">
            <Truck className="w-8 h-8 text-primary/30" />
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-[20%] right-[15%] animate-float opacity-20">
          <Package className="w-6 h-6 text-primary" />
        </div>
        <div className="absolute bottom-[25%] left-[20%] animate-float opacity-15" style={{ animationDelay: '1s' }}>
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <div className="absolute top-[60%] right-[25%] animate-float opacity-20" style={{ animationDelay: '2s' }}>
          <Package className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 min-h-screen flex">
        
        {/* Left Side - Branding */}
        <div className="hidden lg:flex w-1/2 flex-col justify-between p-16 xl:p-20">
          
          {/* Logo */}
          <div className="opacity-0 animate-slideUp">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 border-2 border-primary flex items-center justify-center rounded-lg">
                <span className="font-display text-2xl font-bold text-primary">U</span>
              </div>
              <span className="font-body text-sm tracking-[0.3em] text-primary uppercase">
                United Transport
              </span>
            </div>
          </div>

          {/* Main Title */}
          <div className="space-y-8 max-w-xl">
            <h1 className="opacity-0 animate-slideUp delay-200">
              <span className="font-display text-7xl xl:text-8xl font-medium leading-[0.9] tracking-tight text-foreground">
                Move with
              </span>
              <br />
              <span className="font-display text-7xl xl:text-8xl font-medium leading-[0.9] tracking-tight italic text-primary">
                confidence.
              </span>
            </h1>
            
            <div className="w-24 h-px bg-primary/40 opacity-0 animate-expandWidth delay-400" />
            
            <p className="font-body text-lg text-muted-foreground leading-relaxed max-w-md opacity-0 animate-slideUp delay-300">
              Precision logistics management. Real-time tracking. 
              Enterprise-grade security for your operations.
            </p>
            
            {/* Animated Stats */}
            <div className="flex gap-8 pt-4 opacity-0 animate-slideUp delay-500">
              <div className="text-center">
                <div className="font-display text-3xl font-semibold text-foreground">2.4M+</div>
                <div className="font-body text-xs text-muted-foreground uppercase tracking-wider mt-1">Deliveries</div>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <div className="font-display text-3xl font-semibold text-foreground">99.9%</div>
                <div className="font-body text-xs text-muted-foreground uppercase tracking-wider mt-1">Uptime</div>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <div className="font-display text-3xl font-semibold text-foreground">150+</div>
                <div className="font-body text-xs text-muted-foreground uppercase tracking-wider mt-1">Cities</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between opacity-0 animate-fadeIn delay-700">
            <span className="font-body text-xs tracking-[0.2em] text-muted-foreground uppercase">
              Est. 2024
            </span>
            <span className="font-body text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} All rights reserved
            </span>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-md">
            
            {/* Mobile Logo */}
            <div className="lg:hidden mb-12 opacity-0 animate-slideUp">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 border-2 border-primary flex items-center justify-center rounded-lg">
                  <span className="font-display text-xl font-bold text-primary">U</span>
                </div>
                <span className="font-body text-xs tracking-[0.3em] text-primary uppercase">
                  United Transport
                </span>
              </div>
            </div>

            {/* Form Card */}
            <div className="form-card rounded-2xl p-8 lg:p-10 opacity-0 animate-slideUp delay-100">
              
              {/* Form Header */}
              <div className="mb-10">
                <span className="font-body text-xs tracking-[0.3em] text-primary uppercase mb-3 block">
                  Welcome back
                </span>
                <h2 className="font-display text-3xl lg:text-4xl font-medium tracking-tight text-foreground">
                  Sign in to your
                  <br />
                  <span className="italic">account</span>
                </h2>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                
                {/* Email Field */}
                <div className="opacity-0 animate-slideUp delay-200">
                  <label 
                    htmlFor="email"
                    className={`font-body text-xs tracking-[0.15em] uppercase mb-2 block transition-colors duration-300 ${
                      isFocused === 'email' ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={email}
                      onChange={handleEmailChange}
                      onFocus={() => setIsFocused('email')}
                      onBlur={() => setIsFocused(null)}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      className={`clean-input w-full bg-transparent font-body text-base text-foreground py-3 border-b-2 transition-colors placeholder:text-muted-foreground/50 ${
                        formErrors.email ? 'border-destructive' : 'border-border'
                      }`}
                      placeholder="name@company.com"
                      required
                    />
                    <div 
                      className="absolute bottom-0 left-0 h-0.5 input-underline"
                      style={{ 
                        width: '100%',
                        transform: isFocused === 'email' ? 'scaleX(1)' : 'scaleX(0)'
                      }}
                    />
                  </div>
                  {formErrors.email && (
                    <p className="font-body text-xs text-destructive mt-2">{formErrors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="opacity-0 animate-slideUp delay-300">
                  <label 
                    htmlFor="password"
                    className={`font-body text-xs tracking-[0.15em] uppercase mb-2 block transition-colors duration-300 ${
                      isFocused === 'password' ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={password}
                      onChange={handlePasswordChange}
                      onFocus={() => setIsFocused('password')}
                      onBlur={() => setIsFocused(null)}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      className={`clean-input w-full bg-transparent font-body text-base text-foreground py-3 pr-12 border-b-2 transition-colors placeholder:text-muted-foreground/50 ${
                        formErrors.password ? 'border-destructive' : 'border-border'
                      }`}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-primary transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <div 
                      className="absolute bottom-0 left-0 h-0.5 input-underline"
                      style={{ 
                        width: '100%',
                        transform: isFocused === 'password' ? 'scaleX(1)' : 'scaleX(0)'
                      }}
                    />
                  </div>
                  {formErrors.password && (
                    <p className="font-body text-xs text-destructive mt-2">{formErrors.password}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-4 opacity-0 animate-slideUp delay-400">
                  <button
                    type="submit"
                    disabled={loading || !email || !password || Object.keys(formErrors).length > 0}
                    className="group w-full font-body text-sm tracking-[0.15em] uppercase py-4 btn-primary-custom font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative flex items-center justify-center gap-3">
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      ) : (
                        <>
                          Continue
                          <ArrowUpRight 
                            size={18} 
                            className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" 
                          />
                        </>
                      )}
                    </span>
                  </button>
                </div>

              </form>
            </div>

            {/* Security Badge */}
            <div className="mt-8 flex items-center justify-center gap-2 opacity-0 animate-fadeIn delay-500">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="font-body text-xs text-muted-foreground">
                256-bit SSL encryption
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};