import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, AlertTriangle, FileText, Wrench, ClipboardCheck, User } from 'lucide-react';
import type { Notification, NotificationCategory } from '../../hooks/useNotifications';

// ─── Category metadata ────────────────────────────────────────────────────────
const CATEGORY_META: Record<NotificationCategory, {
  label: string;
  icon: React.ReactNode;
  bg: string;
  text: string;
  border: string;
}> = {
  vehicle_doc: {
    label:  'Vehicle / Trailer Documents',
    icon:   <FileText size={13} />,
    bg:     'bg-card',
    text:   'text-red-700',
    border: 'border-red-100',
  },
  employee_doc: {
    label:  'Employee Documents',
    icon:   <User size={13} />,
    bg:     'bg-amber-50',
    text:   'text-amber-700',
    border: 'border-amber-100',
  },
  driver_doc: {
    label:  'Driver Documents',
    icon:   <FileText size={13} />,
    bg:     'bg-card',
    text:   'text-orange-700',
    border: 'border-orange-100',
  },
  maintenance: {
    label:  'Upcoming Services',
    icon:   <Wrench size={13} />,
    bg:     'bg-card',
    text:   'text-blue-700',
    border: 'border-blue-100',
  },
  test_approval: {
    label:  'Pending Test Approvals',
    icon:   <ClipboardCheck size={13} />,
    bg:     'bg-card',
    text:   'text-purple-700',
    border: 'border-purple-100',
  },
};

// ─── Small helpers ────────────────────────────────────────────────────────────
function UrgencyBadge({ days }: { days: number }) {
  const abs     = Math.abs(days);
  const overdue = days < 0;
  const cls     = (overdue || days <= 7)
    ? 'bg-red-100 text-red-700'
    : days <= 14
      ? 'bg-orange-100 text-orange-700'
      : 'bg-yellow-100 text-yellow-700';
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap ${cls}`}>
      {overdue ? `${abs}d overdue` : `${days}d left`}
    </span>
  );
}

function UrgencyIcon({ urgency }: { urgency: Notification['urgency'] }) {
  const cls = urgency === 'critical'
    ? 'text-red-500'
    : urgency === 'high'
      ? 'text-orange-500'
      : 'text-yellow-500';
  return <AlertTriangle size={14} className={`mt-0.5 flex-shrink-0 ${cls}`} />;
}

// ─── Notification Panel ───────────────────────────────────────────────────────
interface NotificationPanelProps {
  notifications: Notification[];
  loading:       boolean;
  totalCount:    number;
  onClose:       () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications, loading, totalCount, onClose,
}) => {
  const navigate = useNavigate();

  const grouped = notifications.reduce<Record<string, Notification[]>>((acc, n) => {
    if (!acc[n.category]) acc[n.category] = [];
    acc[n.category].push(n);
    return acc;
  }, {});

  const handleClick = (n: Notification) => {
    navigate(n.navigateTo);
    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-[400px] bg-card rounded-xl shadow-2xl border border-theme overflow-hidden z-50 max-h-[600px] flex flex-col">

      {/* Panel header */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bell size={17} />
          <span className="font-semibold text-sm">Notifications</span>
          {totalCount > 0 && (
            <span className="bg-card/20 text-xs px-2 py-0.5 rounded-full font-medium">{totalCount}</span>
          )}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-card/20 rounded transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1 min-h-0">
        {loading ? (
          <div className="p-8 text-center text-secondary">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2" />
            <p className="text-sm">Loading notifications…</p>
          </div>
        ) : totalCount === 0 ? (
          <div className="p-8 text-center text-secondary">
            <Bell size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs mt-1 text-secondary">No pending notifications</p>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, items]) => {
            const meta = CATEGORY_META[cat as NotificationCategory];
            return (
              <div key={cat}>
                {/* Section header */}
                <div className={`px-4 py-2 ${meta.bg} border-y ${meta.border} flex items-center gap-2`}>
                  <span className={meta.text}>{meta.icon}</span>
                  <span className={`text-[11px] font-semibold ${meta.text} uppercase tracking-wide`}>
                    {meta.label}
                  </span>
                  <span className={`ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.text} border ${meta.border}`}>
                    {items.length}
                  </span>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-50">
                  {items.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className="px-4 py-3 hover:bg-[rgba(255,255,255,0.03)] cursor-pointer transition-colors group"
                    >
                      <div className="flex items-start gap-2">
                        {n.category === 'test_approval' ? (
                          <ClipboardCheck size={14} className="mt-0.5 flex-shrink-0 text-purple-500" />
                        ) : (
                          <UrgencyIcon urgency={n.urgency} />
                        )}

                        <div className="flex-1 min-w-0">
                          {/* Title row */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-primary truncate leading-tight">
                              {n.title}
                            </span>
                            {n.daysLeft !== undefined && <UrgencyBadge days={n.daysLeft} />}
                          </div>

                          {/* Subtitle — rich detail */}
                          {n.subtitle && (
                            <p className="text-[11px] text-secondary truncate mt-0.5 leading-tight">
                              {n.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {!loading && totalCount > 0 && (
        <div className="px-4 py-2 border-t border-theme bg-card flex-shrink-0">
          <p className="text-[11px] text-center text-secondary">
            {totalCount} notification{totalCount !== 1 ? 's' : ''} · Click an item to navigate
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Bell button + badge + panel ─────────────────────────────────────────────
interface NotificationBellProps {
  notifications:  Notification[];
  loading:        boolean;
  totalCount:     number;
  isOpen:         boolean;
  onToggle:       () => void;
  onClose:        () => void;
  containerRef:   React.RefObject<HTMLDivElement | null>;
  buttonClassName?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications, loading, totalCount,
  isOpen, onToggle, onClose, containerRef,
  buttonClassName,
}) => (
  <div className="relative" ref={containerRef}>
    <button
      onClick={onToggle}
      className={buttonClassName ?? 'relative p-2 rounded-lg hover:bg-card/20 transition-colors !text-white'}
      title={totalCount > 0 ? `${totalCount} notification${totalCount !== 1 ? 's' : ''}` : 'No notifications'}
    >
      <Bell size={20} />
      {/* Badge — always visible */}
      <span className={`absolute -top-0.5 -right-0.5 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center border-2 border-white/80 shadow-sm transition-colors ${totalCount > 0 ? 'bg-red-500' : 'bg-gray-400/80'}`}>
        {totalCount > 99 ? '99+' : totalCount}
      </span>
    </button>

    {isOpen && (
      <NotificationPanel
        notifications={notifications}
        loading={loading}
        totalCount={totalCount}
        onClose={onClose}
      />
    )}
  </div>
);
