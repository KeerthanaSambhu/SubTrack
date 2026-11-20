import { useState } from 'react';
import { Pencil, Trash2, Pause, Play, Calendar, DollarSign, Clock, Tag } from 'lucide-react';
import Modal, { ConfirmDialog } from '../ui/Modal';
import Button from '../ui/Button';
import { StatusBadge, CategoryBadge, SubscriptionAvatar } from '../ui/Badges';
import { useSubscriptions } from '../../context/SubscriptionsContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../api/client';
import { getCycle } from '../../lib/constants';
import { monthlyCost, nextPaymentDate, yearlyCost } from '../../lib/billing';
import { daysBetween, today } from '../../lib/dates';
import { formatDate, formatDaysLeft, formatMoney } from '../../lib/format';

function Detail({ label, icon: Icon, children }) {
  return (
    <div className="rounded-2xl border border-line-subtle bg-raised/50 p-3.5 transition-colors hover:border-line">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-faint">
        {Icon && <Icon className="size-3" aria-hidden />}
        <dt>{label}</dt>
      </div>
      <dd className="mt-1.5 text-sm font-semibold text-fg tabular">{children}</dd>
    </div>
  );
}

export default function SubscriptionDetailsModal() {
  const { detailsSubscription: sub, closeDetails, openEdit, remove, update } = useSubscriptions();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  if (!sub) return null;

  const cycle = getCycle(sub.billingCycle);
  const next = nextPaymentDate(sub);
  const daysLeft = next ? daysBetween(today(), next) : null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await remove(sub.id);
      toast.success(`${sub.name} deleted`);
      setConfirming(false);
      closeDetails();
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePause = async () => {
    const nextStatus = sub.status === 'active' ? 'paused' : 'active';
    setToggling(true);
    try {
      await update(sub.id, { status: nextStatus });
      toast.success(nextStatus === 'paused' ? `${sub.name} paused` : `${sub.name} is active again`);
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setToggling(false);
    }
  };

  return (
    <>
      <Modal
        open={Boolean(sub)}
        onClose={closeDetails}
        title="Subscription Overview"
        footer={
          <div className="flex w-full items-center justify-between gap-2.5">
            <Button
              variant="danger-ghost"
              size="sm"
              onClick={() => setConfirming(true)}
              className="mr-auto text-danger hover:bg-danger/10"
            >
              <Trash2 className="size-3.5" aria-hidden />
              <span>Delete</span>
            </Button>
            {sub.status !== 'cancelled' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTogglePause}
                loading={toggling}
              >
                {!toggling &&
                  (sub.status === 'active' ? (
                    <Pause className="size-3.5 text-warn" aria-hidden />
                  ) : (
                    <Play className="size-3.5 text-lime" aria-hidden />
                  ))}
                <span>{sub.status === 'active' ? 'Pause subscription' : 'Resume subscription'}</span>
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                closeDetails();
                openEdit(sub);
              }}
            >
              <Pencil className="size-3.5" aria-hidden />
              <span>Edit</span>
            </Button>
          </div>
        }
      >
        {/* Header Block */}
        <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
          <SubscriptionAvatar subscription={sub} size="lg" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-xl font-bold tracking-tight text-fg">
              {sub.name}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <CategoryBadge category={sub.category} showBg />
              <StatusBadge status={sub.status} />
            </div>
          </div>
        </div>

        {/* Headline Price */}
        <div className="mt-5 rounded-2xl border border-lavender/20 bg-gradient-to-r from-lavender/[0.08] via-raised/50 to-raised/30 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-lavender">
            Subscription Rate
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-display text-4xl font-extrabold text-fg tabular tracking-tight">
              {formatMoney(sub.amount, sub.currency)}
            </span>
            <span className="font-sans text-sm font-medium text-muted">
              per {cycle.noun} ({cycle.label})
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <dl className="mt-4 grid grid-cols-2 gap-2.5">
          <Detail label="Next payment" icon={Calendar}>
            {next ? (
              <div className="flex flex-col">
                <span>{formatDate(next)}</span>
                <span className="text-xs font-normal text-muted mt-0.5">
                  {formatDaysLeft(daysLeft)}
                </span>
              </div>
            ) : (
              <span className="text-faint font-normal">None scheduled</span>
            )}
          </Detail>
          <Detail label="Billing cadence" icon={Tag}>
            {cycle.label}
          </Detail>
          <Detail label="Monthly equivalent" icon={DollarSign}>
            {formatMoney(monthlyCost(sub), sub.currency)}
          </Detail>
          <Detail label="Yearly equivalent" icon={DollarSign}>
            {formatMoney(yearlyCost(sub), sub.currency)}
          </Detail>
          <Detail label="Started on" icon={Clock}>
            {formatDate(sub.startDate)}
          </Detail>
          <Detail label="Recorded on" icon={Clock}>
            {formatDate(new Date(sub.createdAt))}
          </Detail>
        </dl>

        {/* Optional Notes */}
        {sub.notes && (
          <div className="mt-4 rounded-2xl border border-line-subtle bg-raised/40 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-faint">
              Account Notes
            </h4>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-fg/90">
              {sub.notes}
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Delete ${sub.name}?`}
        message="This will permanently delete this subscription record and its renewal tracking. This action cannot be reversed."
      />
    </>
  );
}
