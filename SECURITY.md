# Security Policy — Synapse Core

This document describes the responsible-disclosure policy for the **Synapse Core**
Soroban transaction-lifecycle dashboard.

---

## Scope

The following are **in scope** for vulnerability reports:

| Asset                           | Description                                                                   |
| ------------------------------- | ----------------------------------------------------------------------------- |
| `synapse-web` (this repository) | Next.js dashboard, wallet-signing UI, Soroban client code                     |
| Smart contract interactions     | Anything in `lib/soroban/` that touches contract calls or signed transactions |
| Authentication / wallet flows   | `lib/wallet/` — Freighter / xBull wallet connection, signing prompts          |

The following are **out of scope**:

- The Stellar Testnet / Mainnet infrastructure itself (report to Stellar Development Foundation)
- Third-party wallet extensions (Freighter, xBull) — report directly to those projects
- Issues already publicly disclosed in the project's GitHub issue tracker
- Denial-of-service against the Soroban RPC endpoint
- Reports with no realistic attack vector (e.g. self-XSS requiring full attacker control)

---

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Use one of the following private channels:

1. **GitHub Private Security Advisory** (preferred):
   [Open a private advisory](https://github.com/Synapse-bridgez/synapse-web/security/advisories/new)
   — this keeps the report confidential until a fix is ready.

2. **Email** (fallback if GitHub advisory is unavailable):
   `security@synapse-bridgez.example.com`
   — encrypt with the PGP key linked in the advisory page if you can.

### What to include

A good report includes:

- A clear description of the vulnerability and its potential impact
- Steps to reproduce (PoC code or a short video are very helpful)
- Affected component / file path
- Suggested severity (CVSS score or informal Low / Medium / High / Critical)
- Whether you have already disclosed this anywhere else

---

## Response Timeline

| Event                                | Target                                                           |
| ------------------------------------ | ---------------------------------------------------------------- |
| Acknowledgement of receipt           | Within **48 hours**                                              |
| Initial triage & severity assessment | Within **5 business days**                                       |
| Fix or mitigation available          | Within **30 days** for Critical/High, **60 days** for Medium/Low |
| Public disclosure                    | After fix is deployed; coordinated with reporter                 |

We will keep you informed of progress throughout and credit you in the release notes
unless you request anonymity.

---

## Safe-Harbour Statement

We consider security research conducted in good faith and in accordance with this
policy to be authorised. We will not pursue civil or criminal action against researchers
who:

- Report vulnerabilities privately through the channels above before public disclosure
- Do not exfiltrate or destroy data beyond what is necessary to demonstrate the issue
- Do not perform attacks against users or production infrastructure
- Give us reasonable time to address the issue before disclosure

Automated scans of the Soroban Testnet RPC endpoint at high rate are **not** covered
by this safe-harbour.

---

## Acknowledgments

We thank the following researchers for responsibly disclosing security issues
(listed after public disclosure with permission):

_No acknowledgements yet — be the first!_

---

## `security.txt`

This project publishes a machine-readable `/.well-known/security.txt` file per
[RFC 9116](https://www.rfc-editor.org/rfc/rfc9116).

**Renewal owner**: Project maintainers (@Synapse-bridgez).
The file must be renewed before its `Expires` date by opening a PR that updates
only that field. Set a calendar reminder.
