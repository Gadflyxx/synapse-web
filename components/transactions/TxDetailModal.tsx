import React from 'react';

/**
 * Safe URL rendering helper.
 *
 * Chain-supplied and user-entered URLs are attacker-influenceable input.
 * Rendering them directly into an `href` allows `javascript:`, `data:`,
 * `vbscript:` and similar scheme injection. This helper only treats a URL
 * as clickable when it parses to an absolute http(s) URL; everything else
 * is rendered as inert text.
 */
export function getSafeHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Renders a chain-supplied URL as a clickable link only when it is a safe
 * http(s) URL. Unsafe schemes (javascript:, data:, vbscript:, ...) and
 * malformed values are rendered as plain, non-clickable text.
 */
export function SafeExternalLink({
  url,
  className,
  children,
}: {
  url: unknown;
  className?: string;
  children?: React.ReactNode;
}) {
  const safeUrl = getSafeHttpUrl(url);
  const label = children ?? (typeof url === 'string' ? url : '');

  if (!safeUrl) {
    return <span className={className}>{label}</span>;
  }

  return (
    <a
      href={safeUrl}
      className={className}
      target="_blank"
      rel="noopener noreferrer nofollow"
    >
      {label}
    </a>
  );
}

export interface TxDetailModalProps {
  open: boolean;
  onClose: () => void;
  tx?: {
    hash?: string;
    from?: string;
    to?: string;
    value?: string;
    status?: string;
    callbackUrl?: string;
    label?: string;
    memo?: string;
  } | null;
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="tx-detail-field">
      <span className="tx-detail-field-label">{label}</span>
      <span className="tx-detail-field-value">{value ?? '—'}</span>
    </div>
  );
}

export default function TxDetailModal({ open, onClose, tx }: TxDetailModalProps) {
  if (!open) return null;

  return (
    <div className="tx-detail-modal" role="dialog" aria-modal="true">
      <div className="tx-detail-modal-header">
        <h2>Transaction details</h2>
        <button type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className="tx-detail-modal-body">
        <Field label="Hash" value={tx?.hash} />
        <Field label="From" value={tx?.from} />
        <Field label="To" value={tx?.to} />
        <Field label="Value" value={tx?.value} />
        <Field label="Status" value={tx?.status} />
        <Field label="Label" value={tx?.label} />
        <Field label="Memo" value={tx?.memo} />
        <Field
          label="Callback URL"
          value={<SafeExternalLink url={tx?.callbackUrl} />}
        />
      </div>
    </div>
  );
}
