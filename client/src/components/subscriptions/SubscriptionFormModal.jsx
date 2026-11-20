import { useEffect, useState } from 'react';
import { ChevronDown, Sparkles, Calendar, DollarSign, Tag, Info } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Field, Input, Select, Textarea, SegmentedControl } from '../ui/FormControls';
import { FormAlert } from '../ui/Feedback';
import { useSubscriptions } from '../../context/SubscriptionsContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../api/client';
import { BILLING_CYCLES, CATEGORIES, CURRENCIES, STATUSES } from '../../lib/constants';
import { monthlyCost, nextPaymentDate, yearlyCost } from '../../lib/billing';
import { formatMoney } from '../../lib/format';
import { parseDate, toISODate, today } from '../../lib/dates';

const MAX_AMOUNT = 10000000;

function initialValues(subscription, defaultCurrency) {
  if (subscription) {
    return {
      name: subscription.name,
      amount: String(subscription.amount),
      currency: subscription.currency,
      category: subscription.category,
      billingCycle: subscription.billingCycle,
      nextPaymentDate: toISODate(nextPaymentDate(subscription) || parseDate(subscription.nextPaymentDate)),
      startDate: subscription.startDate.slice(0, 10),
      status: subscription.status,
      notes: subscription.notes || '',
    };
  }
  return {
    name: '',
    amount: '',
    currency: defaultCurrency || 'INR',
    category: 'entertainment',
    billingCycle: 'monthly',
    nextPaymentDate: '',
    startDate: '',
    status: 'active',
    notes: '',
  };
}

function validate(values) {
  const errors = {};
  const name = values.name.trim();
  if (!name) errors.name = 'Give this subscription a name.';
  else if (name.length > 60) errors.name = 'Keep the name under 60 characters.';

  const amount = Number(values.amount);
  if (values.amount === '') errors.amount = 'Enter how much you pay.';
  else if (!Number.isFinite(amount) || amount <= 0) errors.amount = 'Enter an amount greater than zero.';
  else if (amount > MAX_AMOUNT) errors.amount = 'That amount looks too large.';

  const next = parseDate(values.nextPaymentDate);
  if (!next) errors.nextPaymentDate = 'Choose the next payment date.';

  if (values.startDate) {
    const start = parseDate(values.startDate);
    if (!start) errors.startDate = 'Enter a valid date.';
    else if (next && start > next) errors.startDate = 'The start date must be on or before the next payment.';
  }

  if (values.notes.length > 500) errors.notes = 'Notes can be up to 500 characters.';
  return errors;
}

const ADVANCED_FIELDS = ['startDate', 'status', 'notes'];

export default function SubscriptionFormModal() {
  const { form, closeForm, create, update } = useSubscriptions();
  const { user } = useAuth();
  const toast = useToast();
  const editing = form.subscription;

  const [values, setValues] = useState(() => initialValues(null, user?.currency));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (!form.open) return;
    setValues(initialValues(form.subscription, user?.currency));
    setErrors({});
    setFormError('');
    setShowMore(false);
  }, [form.open, form.subscription, user?.currency]);

  const set = (field) => (eventOrValue) => {
    const value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue;
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length > 0) {
      if (ADVANCED_FIELDS.some((f) => found[f])) setShowMore(true);
      return;
    }

    const next = parseDate(values.nextPaymentDate);
    const now = today();
    const startDate = values.startDate || toISODate(next < now ? next : now);

    const payload = {
      name: values.name.trim(),
      amount: Number(values.amount),
      currency: values.currency,
      category: values.category,
      billingCycle: values.billingCycle,
      nextPaymentDate: values.nextPaymentDate,
      startDate,
      status: values.status,
      notes: values.notes.trim(),
    };

    setSubmitting(true);
    try {
      if (editing) {
        await update(editing.id, payload);
        toast.success(`${payload.name} updated successfully`);
      } else {
        await create(payload);
        toast.success(`${payload.name} added to your active subscriptions`);
      }
      closeForm();
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      setErrors(fieldErrors);
      setFormError(message);
      if (ADVANCED_FIELDS.some((f) => fieldErrors[f])) setShowMore(true);
    } finally {
      setSubmitting(false);
    }
  };

  const amountNumber = Number(values.amount);
  const showEstimate = Number.isFinite(amountNumber) && amountNumber > 0;
  const preview = { amount: amountNumber, billingCycle: values.billingCycle };

  return (
    <Modal
      open={form.open}
      onClose={closeForm}
      busy={submitting}
      title={editing ? `Edit ${editing.name}` : 'New Subscription'}
      description={editing ? 'Update pricing, billing cycle, or renewal schedule.' : 'Add your service details to calculate monthly burn and track upcoming renewals.'}
      footer={
        <div className="flex w-full items-center justify-end gap-2.5">
          <Button variant="secondary" onClick={closeForm} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="subscription-form" loading={submitting} variant="primary">
            {editing ? 'Save changes' : 'Add subscription'}
          </Button>
        </div>
      }
    >
      <form id="subscription-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormAlert message={formError} />

        <Field label="Service Name" error={errors.name}>
          {(ids) => (
            <Input
              {...ids}
              data-autofocus
              value={values.name}
              onChange={set('name')}
              placeholder="e.g. Netflix, GitHub Copilot, Spotify, AWS"
              maxLength={60}
              autoComplete="off"
              error={errors.name}
            />
          )}
        </Field>

        <div>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <Field label="Subscription Cost" error={errors.amount}>
              {(ids) => (
                <Input
                  {...ids}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={values.amount}
                  onChange={set('amount')}
                  placeholder="0.00"
                  error={errors.amount}
                  className="tabular text-base font-medium"
                />
              )}
            </Field>
            <Field label="Currency">
              {(ids) => (
                <Select {...ids} value={values.currency} onChange={set('currency')} className="w-28 font-mono">
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.value} ({c.symbol})
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
            Billing Cadence
          </label>
          <SegmentedControl
            label="Billing cadence"
            options={BILLING_CYCLES}
            value={values.billingCycle}
            onChange={set('billingCycle')}
          />
          {showEstimate && (
            <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-lavender/25 bg-lavender/[0.06] px-3.5 py-2.5 text-xs text-fg">
              <Sparkles className="size-3.5 text-lavender shrink-0" aria-hidden />
              <div className="tabular">
                {values.billingCycle === 'monthly' ? (
                  <span>
                    Annual run rate:{' '}
                    <strong className="font-semibold text-lavender">{formatMoney(yearlyCost(preview), values.currency)}</strong> / year
                  </span>
                ) : (
                  <span>
                    Monthly equivalent:{' '}
                    <strong className="font-semibold text-lavender">{formatMoney(monthlyCost(preview), values.currency)}</strong> / mo
                    {' · '}
                    Annual: <strong className="font-semibold text-fg">{formatMoney(yearlyCost(preview), values.currency)}</strong>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            {(ids) => (
              <Select {...ids} value={values.category} onChange={set('category')}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Next Payment Date" error={errors.nextPaymentDate}>
            {(ids) => (
              <Input
                {...ids}
                type="date"
                value={values.nextPaymentDate}
                onChange={set('nextPaymentDate')}
                error={errors.nextPaymentDate}
              />
            )}
          </Field>
        </div>

        {/* Collapsible advanced section */}
        <div className="rounded-2xl border border-line-subtle bg-raised/30 transition-colors hover:border-line">
          <button
            type="button"
            onClick={() => setShowMore((s) => !s)}
            aria-expanded={showMore}
            aria-controls="more-details"
            className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted transition-colors hover:text-fg"
          >
            <span>
              Additional Options
              <span className="ml-2 font-normal lowercase tracking-normal text-faint">(start date, status, notes)</span>
            </span>
            <ChevronDown className={`size-4 transition-transform duration-200 ${showMore ? 'rotate-180' : ''}`} aria-hidden />
          </button>

          {showMore && (
            <div id="more-details" className="animate-fade-in space-y-4 border-t border-line-subtle px-4 pb-4 pt-4">
              <Field
                label="Subscription Start Date"
                optional
                error={errors.startDate}
                hint="When you first subscribed. Used for historical spending analysis."
              >
                {(ids) => (
                  <Input
                    {...ids}
                    type="date"
                    value={values.startDate}
                    onChange={set('startDate')}
                    max={values.nextPaymentDate || undefined}
                    error={errors.startDate}
                  />
                )}
              </Field>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                  Tracking Status
                </label>
                <SegmentedControl label="Status" options={STATUSES} value={values.status} onChange={set('status')} size="sm" />
                {values.status !== 'active' && (
                  <p className="mt-2 text-xs text-faint leading-relaxed">
                    {values.status === 'paused' ? 'Paused' : 'Cancelled'} subscriptions are preserved in your records but excluded from monthly spending calculations and payment alerts.
                  </p>
                )}
              </div>

              <Field label="Personal Notes" optional error={errors.notes} hint={`${values.notes.length}/500`}>
                {(ids) => (
                  <Textarea
                    {...ids}
                    value={values.notes}
                    onChange={set('notes')}
                    maxLength={500}
                    placeholder="e.g. Shared with roommates, annual discount applies in November, virtual card on file…"
                    error={errors.notes}
                  />
                )}
              </Field>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
