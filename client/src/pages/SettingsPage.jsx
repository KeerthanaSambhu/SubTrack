import { useState } from 'react';
import { LogOut, Shield, User, Coins, Check } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import PasswordInput from '../components/ui/PasswordInput';
import { Field, Input, Select } from '../components/ui/FormControls';
import { FormAlert } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';
import { useSubscriptions } from '../context/SubscriptionsContext';
import { useToast } from '../context/ToastContext';
import { userApi } from '../api/endpoints';
import { parseApiError, tokenStorage } from '../api/client';
import { CURRENCIES } from '../lib/constants';
import { formatDate, initials } from '../lib/format';
import { compactErrors, validateEmail, validateName, validateNewPassword } from '../lib/validation';

function Section({ title, description, icon: Icon, children }) {
  return (
    <section className="card grid gap-6 p-5 sm:p-7 md:grid-cols-[240px_1fr] md:gap-10 shadow-[var(--shadow-card)] hover:border-line-strong transition-all duration-200">
      <div>
        <div className="flex items-center gap-2 mb-1">
          {Icon && (
            <span className="flex size-6 items-center justify-center rounded-lg bg-raised text-lavender border border-line">
              <Icon className="size-3.5" aria-hidden />
            </span>
          )}
          <h2 className="font-display text-base font-bold text-fg tracking-tight">{title}</h2>
        </div>
        {description && <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function ProfileForm() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [values, setValues] = useState({ name: user.name, email: user.email });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const changed = values.name.trim() !== user.name || values.email.trim().toLowerCase() !== user.email;

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = compactErrors({ name: validateName(values.name), email: validateEmail(values.email) });
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const { user: updated } = await userApi.updateProfile({ name: values.name.trim(), email: values.email.trim() });
      setUser(updated);
      setValues({ name: updated.name, email: updated.email });
      toast.success('Profile updated');
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      setErrors(fieldErrors);
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <FormAlert message={formError} />
      <div className="flex items-center gap-4 rounded-2xl border border-line-subtle bg-raised/30 p-3.5">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-lavender/25 to-lavender/5 font-display text-xl font-bold text-lavender ring-1 ring-lavender/25 shadow-md">
          {initials(values.name || user.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-base font-bold text-fg tracking-tight">{user.name}</p>
          <p className="truncate text-xs text-muted font-mono">{user.email}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Display Name" error={errors.name}>
          {(ids) => <Input {...ids} value={values.name} onChange={set('name')} autoComplete="name" maxLength={60} error={errors.name} />}
        </Field>
        <Field label="Email Address" error={errors.email}>
          {(ids) => <Input {...ids} type="email" value={values.email} onChange={set('email')} autoComplete="email" error={errors.email} />}
        </Field>
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" loading={saving} disabled={!changed} variant="primary">
          Save changes
        </Button>
      </div>
    </form>
  );
}

function CurrencyPreference() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const handleChange = async (event) => {
    const currency = event.target.value;
    setSaving(true);
    try {
      const { user: updated } = await userApi.updateProfile({ currency });
      setUser(updated);
      toast.success(`Currency set to ${currency}`);
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <Field
        label="Preferred Reporting Currency"
        hint="All dashboard headline analytics, charts, and summary metrics will automatically calculate in this currency."
      >
        {(ids) => (
          <Select {...ids} value={user.currency} onChange={handleChange} disabled={saving} className="sm:max-w-xs font-mono font-medium">
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.value} ({c.symbol}) — {c.label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <div className="flex items-center gap-2 text-xs text-faint">
        <Check className="size-3.5 text-lime" aria-hidden />
        <span>Individual subscriptions still retain their original billing currency</span>
      </div>
    </div>
  );
}

function PasswordForm() {
  const toast = useToast();
  const empty = { currentPassword: '', newPassword: '', confirmPassword: '' };
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = compactErrors({
      currentPassword: values.currentPassword ? undefined : 'Enter your current password.',
      newPassword:
        validateNewPassword(values.newPassword) ||
        (values.newPassword === values.currentPassword ? 'Choose a password different from your current one.' : undefined),
      confirmPassword: values.confirmPassword === values.newPassword ? undefined : "Passwords don't match.",
    });
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const data = await userApi.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      if (data?.token) {
        tokenStorage.set(data.token);
      }
      setValues(empty);
      toast.success('Password updated successfully');
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      setErrors(fieldErrors);
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormAlert message={formError} />
      <Field label="Current Password" error={errors.currentPassword}>
        {(ids) => (
          <PasswordInput {...ids} value={values.currentPassword} onChange={set('currentPassword')} autoComplete="current-password" error={errors.currentPassword} />
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New Password" error={errors.newPassword} hint="At least 8 characters, a letter and a number.">
          {(ids) => (
            <PasswordInput {...ids} value={values.newPassword} onChange={set('newPassword')} autoComplete="new-password" error={errors.newPassword} />
          )}
        </Field>
        <Field label="Confirm New Password" error={errors.confirmPassword}>
          {(ids) => (
            <PasswordInput {...ids} value={values.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" error={errors.confirmPassword} />
          )}
        </Field>
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" variant="secondary" loading={saving}>
          Update password
        </Button>
      </div>
    </form>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { subscriptions } = useSubscriptions();

  return (
    <>
      <PageHeader
        title="Account & Preferences"
        description="Configure your workspace, security settings, and data preferences."
      />
      <div className="space-y-5 lg:space-y-6">
        <Section title="Profile Information" description="Your identification credentials and workspace name." icon={User}>
          <ProfileForm />
        </Section>

        <Section title="Currency & Localization" description="Default presentation currency for summaries and charts." icon={Coins}>
          <CurrencyPreference />
        </Section>

        <Section title="Security & Authentication" description="Ensure your account is protected with strong credentials." icon={Shield}>
          <PasswordForm />
        </Section>

        <Section title="Account Status" description="Membership details and session controls.">
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-line-subtle bg-raised/40 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-faint">Member since</dt>
              <dd className="mt-1 font-display text-sm font-bold text-fg">{formatDate(new Date(user.createdAt))}</dd>
            </div>
            <div className="rounded-2xl border border-line-subtle bg-raised/40 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-faint">Subscriptions</dt>
              <dd className="mt-1 font-display text-sm font-bold text-fg tabular">{subscriptions.length} tracked</dd>
            </div>
            <div className="rounded-2xl border border-line-subtle bg-raised/40 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-faint">Base Currency</dt>
              <dd className="mt-1 font-display text-sm font-bold text-fg font-mono">{user.currency}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-col gap-3 border-t border-line-subtle pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted font-mono">Signed in as {user.email}</p>
            <Button variant="danger-ghost" size="sm" onClick={logout}>
              <LogOut className="size-4" aria-hidden />
              <span>Sign out</span>
            </Button>
          </div>
        </Section>
      </div>
    </>
  );
}
