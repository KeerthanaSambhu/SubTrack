import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Sparkles, ArrowRight, Lock } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import PasswordInput from '../components/ui/PasswordInput';
import { Field, Input } from '../components/ui/FormControls';
import { FormAlert } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';
import { parseApiError } from '../api/client';
import { compactErrors, validateEmail } from '../lib/validation';

export default function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = compactErrors({
      email: validateEmail(values.email),
      password: values.password ? undefined : 'Enter your account password.',
    });
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await login({ email: values.email.trim(), password: values.password });
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      setErrors(fieldErrors);
      setFormError(message);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to review renewals and track expenses."
      footer={
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted">
          <span>New to SubTrack?</span>
          <Link
            to="/register"
            state={location.state}
            className="font-semibold text-lavender hover:underline inline-flex items-center gap-0.5"
          >
            <span>Create an account</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      }
    >
      {/* 1-Click Demo Quick Fill Banner */}
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-lavender/30 bg-gradient-to-r from-lavender/10 to-transparent p-3.5 shadow-sm">
        <div className="min-w-0 pr-2">
          <span className="flex items-center gap-1.5 text-xs font-bold text-fg">
            <Sparkles className="size-3.5 text-lavender" />
            <span>Interactive Demo Account</span>
          </span>
          <span className="block truncate text-[11px] font-mono text-muted mt-0.5">
            demo@subtrack.app · Password123
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setValues({ email: 'demo@subtrack.app', password: 'Password123' });
            setErrors({});
            setFormError('');
          }}
          className="shrink-0 rounded-xl bg-lavender px-3 py-1.5 text-xs font-semibold text-canvas shadow-sm transition-all hover:bg-lavender-strong active:scale-95"
        >
          Autofill
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormAlert message={formError} />

        <Field label="Email Address" error={errors.email}>
          {(ids) => (
            <Input
              {...ids}
              type="email"
              autoComplete="email"
              autoFocus
              value={values.email}
              onChange={set('email')}
              placeholder="name@company.com"
              error={errors.email}
            />
          )}
        </Field>

        <Field label="Password" error={errors.password}>
          {(ids) => (
            <PasswordInput
              {...ids}
              autoComplete="current-password"
              value={values.password}
              onChange={set('password')}
              placeholder="••••••••"
              error={errors.password}
            />
          )}
        </Field>

        <div className="pt-2">
          <Button type="submit" size="lg" className="w-full shadow-md" loading={submitting} variant="primary">
            <span>Sign in to Dashboard</span>
            <ArrowRight className="size-4 ml-1" />
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
