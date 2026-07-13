import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import AuthShell from './AuthShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const user = await login(data);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      const dest = location.state?.from?.pathname;
      navigate(dest || (user.role === 'admin' ? '/admin' : '/dashboard'), { replace: true });
    } catch (e) {
      toast.error(e.friendlyMessage || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = () =>
    toast('Please contact the salon to reset your password.', { icon: '🔑' });

  return (
    <AuthShell
      title={<>Welcome <span className="gold-text">Back</span></>}
      subtitle="Sign in to access your account"
      footer={
        <>
          Don’t have an account?{' '}
          <Link to="/register" className="font-medium text-gold hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="label">Email Address</label>
          <div className="relative">
            <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="email"
              className="input pl-11"
              placeholder="Enter your email address"
              {...register('email', { required: 'Email is required' })}
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type={show ? 'text' : 'password'}
              className="input px-11"
              placeholder="Enter your password"
              {...register('password', { required: 'Password is required' })}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-cream"
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>}
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={forgotPassword} className="text-sm text-gold hover:underline">
            Forgot Password?
          </button>
        </div>

        <button disabled={loading} className="btn-gold w-full">
          {loading ? 'Signing in…' : 'Sign In'} <ArrowRight size={16} />
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-line bg-white/[0.03] p-4 text-xs text-muted">
        <p className="font-medium text-cream/90">Demo accounts</p>
        <p className="mt-1">Admin: admin@luxesalon.com / Admin@123</p>
        <p>Customer: customer@luxesalon.com / Customer@123</p>
      </div>
    </AuthShell>
  );
}
