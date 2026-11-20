import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { ArrowRight, Check } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import PasswordInput from '../components/ui/PasswordInput';
import { Field, Input } from '../components/ui/FormControls';
import { FormAlert } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { parseApiError } from '../api/client';
import { compactErrors, validateEmail, validateName, validateNewPassword } from '../lib/validation';

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [values, setValues] = useState({ name: '', email: '', password: '' });
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
      name: validateName(values.name),
      email: validateEmail(values.email),
      password: validateNewPassword(values.password),
    });
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const user = await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      toast.success(`Welcome to SubTrack, ${user.name.split(' ')[0]}!`);
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      setErrors(fieldErrors);
      setFormError(message);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start tracking subscriptions in under 60 seconds. No credit card required."
      footer={
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted">
          <span>Already registered?</span>
          <Link
            to="/login"
            state={location.state}
            className="font-semibold text-lavender hover:underline inline-flex items-center gap-0.5"
          >
            <span>Sign in</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormAlert message={formError} />

        <Field label="Full Name" error={errors.name}>
          {(ids) => (
            <Input
              {...ids}
              autoComplete="name"
              autoFocus
              value={values.name}
              onChange={set('name')}
              placeholder="e.g. Alex Morgan"
              maxLength={60}
              error={errors.name}
            />
          )}
        </Field>

        <Field label="Email Address" error={errors.email}>
          {(ids) => (
            <Input
              {...ids}
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={set('email')}
              placeholder="alex@example.com"
              error={errors.email}
            />
          )}
        </Field>

        <Field
          label="Password"
          error={errors.password}
          hint="Must be 8+ characters, with at least one letter and one number."
        >
          {(ids) => (
            <PasswordInput
              {...ids}
              autoComplete="new-password"
              value={values.password}
              onChange={set('password')}
              placeholder="Create a strong password"
              error={errors.password}
            />
          )}
        </Field>

        <div className="pt-2">
          <Button type="submit" size="lg" className="w-full shadow-md" loading={submitting} variant="primary">
            <span>Create Free Account</span>
            <ArrowRight className="size-4 ml-1" />
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
