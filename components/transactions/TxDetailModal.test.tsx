import React from 'react';
import { render, screen } from '@testing-library/react';
import TxDetailModal from './TxDetailModal';

/**
 * Security regression tests for issue #180: XSS audit and remediation pass
 * across all chain-supplied data rendering paths.
 *
 * Chain data (callback URLs, arbitrary string fields) is attacker-influenceable
 * input in this app's threat model. These tests assert that malicious payloads
 * cannot be rendered as executable markup or as dangerous clickable links.
 */

const baseTx = {
  hash: '0xabc123',
  from: '0x1111111111111111111111111111111111111111',
  to: '0x2222222222222222222222222222222222222222',
  value: '1000000000000000000',
  status: 'success',
};

describe('TxDetailModal XSS remediation', () => {
  it('renders chain-supplied string fields as text, never as HTML', () => {
    const payload = '<img src=x onerror=alert(1)>';
    render(
      <TxDetailModal
        open
        onClose={() => {}}
        tx={{ ...baseTx, memo: payload }}
      />,
    );

    // The raw payload must appear as inert text content.
    expect(screen.getByText(payload)).toBeInTheDocument();
    // No element should have been injected from the payload.
    expect(document.querySelector('img')).toBeNull();
  });

  it('does not render a javascript: callback URL as a clickable link', () => {
    render(
      <TxDetailModal
        open
        onClose={() => {}}
        tx={{ ...baseTx, callbackUrl: 'javascript:alert(document.cookie)' }}
      />,
    );

    const links = Array.from(document.querySelectorAll('a'));
    for (const link of links) {
      expect(link.getAttribute('href') || '').not.toMatch(/^javascript:/i);
    }
  });

  it('does not render a data: callback URL as a clickable link', () => {
    render(
      <TxDetailModal
        open
        onClose={() => {}}
        tx={{
          ...baseTx,
          callbackUrl: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
        }}
      />,
    );

    const links = Array.from(document.querySelectorAll('a'));
    for (const link of links) {
      expect(link.getAttribute('href') || '').not.toMatch(/^data:/i);
    }
  });

  it('renders a valid http(s) callback URL as a safe clickable link', () => {
    render(
      <TxDetailModal
        open
        onClose={() => {}}
        tx={{ ...baseTx, callbackUrl: 'https://example.com/callback' }}
      />,
    );

    const link = screen.getByRole('link', { name: /example\.com/i });
    expect(link).toHaveAttribute('href', 'https://example.com/callback');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('renders address-book labels as inert text', () => {
    const payload = '<script>alert(1)</script>';
    render(
      <TxDetailModal
        open
        onClose={() => {}}
        tx={{ ...baseTx, toLabel: payload }}
      />,
    );

    expect(screen.getByText(payload)).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
  });
});
