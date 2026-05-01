// src/app/features/payment/payment.ts
//
// Payment page for ticket purchases
// Accessible from event-detail via "Buy Ticket" button
// Shows payment form with Visa, Mastercard, and other payment methods

import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TicketService } from '@core/services/ticket.service';
import { AuthService } from '@core/services/auth.service';
import {
  LucideAngularModule,
  CreditCard,
  Wallet,
  Star,
  Lock,
  User,
  Calendar,
  ShieldCheck,
} from 'lucide-angular';

type PaymentMethod = 'card' | 'wallet' | 'points';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    LucideAngularModule,
  ],
  template: `
    <div class="payment-root">
      <!-- ── HERO SECTION ── -->
      <header class="payment-hero">
        <div class="payment-orb" aria-hidden="true"></div>
        <div class="payment-hero__body">
          <div class="payment-eyebrow">
            <span class="payment-tag">Secure Payment</span>
          </div>
          <h1 class="payment-title">
            <span class="payment-lmask"
              ><span class="payment-lword payment-lword--stroke "
                >Complete Your</span
              ></span
            >
            <span class="payment-lmask"
              ><span class="payment-lword payment-lword--1">Payment</span></span
            >
          </h1>
          <p class="payment-sub">
            Your payment is secured with 256-bit SSL encryption.
          </p>
        </div>
      </header>

      <!-- ── MAIN CONTENT ── -->
      <main class="payment-content">
        <div class="payment-container">
          <!-- ── PAYMENT METHOD SELECTOR ── -->
          <section class="payment-section">
            <h2 class="payment-section-title">Payment Method</h2>
            <div class="payment-method-tabs">
              <button
                class="payment-method-tab"
                [class.payment-method-tab--active]="selectedMethod() === 'card'"
                (click)="selectedMethod.set('card')"
              >
                <lucide-angular
                  [img]="creditCard"
                  class="payment-method-icon"
                ></lucide-angular>
                <span>Credit / Debit Card</span>
              </button>
              <button
                class="payment-method-tab"
                [class.payment-method-tab--active]="
                  selectedMethod() === 'wallet'
                "
                (click)="selectedMethod.set('wallet')"
              >
                <lucide-angular
                  [img]="wallet"
                  class="payment-method-icon"
                ></lucide-angular>
                <span>Wallet Payment</span>
              </button>
              <button
                class="payment-method-tab"
                [class.payment-method-tab--active]="
                  selectedMethod() === 'points'
                "
                (click)="selectedMethod.set('points')"
              >
                <lucide-angular
                  [img]="star"
                  class="payment-method-icon"
                ></lucide-angular>
                <span>Points Payment</span>
              </button>
            </div>
          </section>

          <!-- ── CARD FORM (visible only when card is selected) ── -->
          @if (selectedMethod() === 'card') {
          <section class="payment-section">
            <form
              [formGroup]="cardForm"
              (ngSubmit)="submitPayment()"
              class="payment-form"
            >
              <!-- Card Number -->
              <div class="payment-form-group">
                <label class="payment-form-label">Card Number</label>
                <div class="payment-form-input-wrapper">
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    formControlName="cardNumber"
                    class="payment-form-input"
                    maxlength="19"
                  />
                </div>
              </div>

              <!-- Cardholder Name -->
              <div class="payment-form-group">
                <label class="payment-form-label">Cardholder Name</label>
                <div class="payment-form-input-wrapper">
                  <lucide-angular
                    [img]="user"
                    class="payment-form-input-icon"
                  ></lucide-angular>
                  <input
                    type="text"
                    placeholder="Name as on card"
                    formControlName="cardholderName"
                    class="payment-form-input"
                  />
                </div>
              </div>

              <!-- Expiry & CVV -->
              <div class="payment-form-row">
                <div class="payment-form-group">
                  <label class="payment-form-label">Expiry Date</label>
                  <div class="payment-form-input-wrapper">
                    <lucide-angular
                      [img]="calendar"
                      class="payment-form-input-icon"
                    ></lucide-angular>
                    <input
                      type="text"
                      placeholder="MM / YY"
                      formControlName="expiryDate"
                      class="payment-form-input"
                      maxlength="5"
                    />
                  </div>
                </div>

                <div class="payment-form-group">
                  <label class="payment-form-label">CVV</label>
                  <div class="payment-form-input-wrapper">
                    <lucide-angular
                      [img]="lock"
                      class="payment-form-input-icon"
                    ></lucide-angular>
                    <input
                      type="password"
                      placeholder="•••"
                      formControlName="cvv"
                      class="payment-form-input"
                      maxlength="4"
                    />
                  </div>
                </div>
              </div>

              <!-- Security Badge -->
              <div class="payment-security-badge">
                <lucide-angular
                  [img]="shieldCheck"
                  class="payment-security-badge-icon"
                ></lucide-angular>
                <span>Secured by 256-bit SSL</span>
              </div>

              <!-- Price Summary -->
              <div class="payment-summary">
                <div class="payment-summary-row">
                  <span>Ticket Price</span>
                  <span>EGP 350</span>
                </div>
                <div class="payment-summary-divider"></div>
                <div class="payment-summary-row payment-summary-total">
                  <span>Total</span>
                  <span>EGP 350</span>
                </div>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="payment-submit-btn"
                [disabled]="!cardForm.valid || processing()"
              >
                @if (processing()) {
                <span class="payment-spinner"></span>
                Processing… } @else {
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                Confirm & Pay – EGP 350 }
              </button>
            </form>
          </section>
          }

          <!-- ── OTHER PAYMENT METHODS (placeholder) ── -->
          @if (selectedMethod() !== 'card') {
          <section class="payment-section">
            <div class="payment-method-placeholder">
              <p>
                {{
                  selectedMethod() === 'wallet'
                    ? 'Wallet Payment'
                    : 'Points Payment'
                }}
                coming soon
              </p>
            </div>
          </section>
          }
        </div>
      </main>

      <!-- ── FOOTER SPACER ── -->
      <div style="height:3rem"></div>
    </div>
  `,
  styles: [
    `
      :host {
        --gold: #f59e0b;
        --coral: #2563eb;
        --green: #22c55e;
        --bg: #ffffff;
        --bg2: #f8faff;
        --bg3: #eef2ff;
        --text: #1e3a5f;
        --muted: #64748b;
        --bdr: #e2e8f0;
        --bdrhi: #cbd5e1;
        font-family: 'Plus Jakarta Sans', sans-serif;
        display: block;
        color: var(--text);
      }

      .payment-root {
        padding: 0;
        min-height: auto;
      }

      /* Hero */
      .payment-hero {
        position: relative;
        overflow: hidden;
        padding: 2.5rem 1.75rem 2rem;
        background: var(--bg2);
      }

      .payment-orb {
        position: absolute;
        width: 360px;
        height: 360px;
        top: -140px;
        right: -80px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 0;
        background: radial-gradient(
          circle,
          rgba(37, 99, 235, 0.06) 0%,
          transparent 65%
        );
      }

      .payment-hero__body {
        position: relative;
        z-index: 1;
      }

      .payment-eyebrow {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.9rem;
      }

      .payment-tag {
        display: inline-flex;
        align-items: center;
        padding: 3px 10px;
        border-radius: 100px;
        font-family: 'DM Mono', monospace;
        font-size: 0.59rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        background: rgba(37, 99, 235, 0.08);
        border: 1px solid rgba(37, 99, 235, 0.2);
        color: var(--coral);
      }

      .payment-title {
        font-family: 'Bebas Neue', sans-serif;
        font-size: clamp(2.8rem, 7vw, 4.8rem);
        letter-spacing: 0.03em;
        line-height: 0.9;
        color: #1e3a8a;
        margin: 0 0 0.65rem;
        display: flex;
        flex-direction: column;
      }

      .payment-lmask {
        overflow: hidden;
        display: block;
      }

      .payment-lword {
        display: inline-block;
        color: #1e3a8a;
      }

      .payment-lword--stroke {
        color: transparent;
        -webkit-text-stroke: 2px #1e3a8a;
      }

      .payment-accent {
        color: #1e40af;
        font-style: normal;
      }

      .payment-sub {
        font-size: 0.84rem;
        color: var(--muted);
        margin: 0;
        font-weight: 300;
        line-height: 1.6;
      }

      /* Main Content */
      .payment-content {
        padding: 0 1.75rem 2rem;
      }

      .payment-container {
        max-width: 650px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .payment-section {
        background: var(--bg);
        border: 1px solid var(--bdr);
        border-radius: 16px;
        padding: 2rem;
        animation: slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        box-shadow: 0 4px 16px rgba(30, 58, 95, 0.08);
        transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .payment-section:hover {
        box-shadow: 0 8px 24px rgba(30, 58, 95, 0.12);
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }

      .payment-section-title {
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--text);
        margin: 0 0 1.25rem;
        letter-spacing: 0.02em;
      }

      /* Payment Method Tabs */
      .payment-method-tabs {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 0.75rem;
      }

      .payment-method-tab {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem 0.75rem;
        border-radius: 12px;
        border: 2px solid var(--bdr);
        background: var(--bg);
        color: var(--muted);
        font-size: 0.8rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .payment-method-tab:hover {
        border-color: var(--coral);
        color: var(--coral);
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(37, 99, 235, 0.15);
      }

      .payment-method-tab--active {
        border-color: var(--coral);
        background: rgba(37, 99, 235, 0.08);
        color: var(--coral);
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.12);
      }

      .payment-method-icon {
        width: 24px;
        height: 24px;
        stroke-width: 2;
      }

      /* Form */
      .payment-form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .payment-form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .payment-form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .payment-form-label {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }

      .payment-card-icons {
        display: flex;
        gap: 0.3rem;
        opacity: 0.6;
      }

      .payment-form-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      .payment-form-input-icon {
        position: absolute;
        left: 12px;
        color: var(--muted);
        opacity: 0.6;
        pointer-events: none;
        z-index: 1;
        width: 18px;
        height: 18px;
        stroke-width: 2;
        transition: all 0.2s ease;
      }

      .payment-label-icon {
        width: 14px;
        height: 14px;
        stroke-width: 2;
        opacity: 0.6;
      }

      .payment-form-input {
        width: 100%;
        padding: 0.9rem 1rem 0.9rem 42px;
        border: 1.5px solid var(--bdr);
        border-radius: 10px;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 0.9rem;
        color: var(--text);
        background: var(--bg);
        transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        outline: none;
      }

      .payment-form-input::placeholder {
        color: var(--muted);
        opacity: 0.6;
      }

      .payment-form-input:focus {
        border-color: var(--coral);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1),
          inset 0 0 0 1px rgba(37, 99, 235, 0.05);
        background: rgba(37, 99, 235, 0.02);
      }

      .payment-form-input:focus + .payment-form-input-icon,
      .payment-form-input:focus ~ .payment-form-input-icon {
        color: var(--coral);
        opacity: 1;
      }

      .payment-form-input:hover:not(:focus) {
        border-color: var(--bdrhi);
      }

      /* Security Badge */
      .payment-security-badge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        border-radius: 10px;
        background: rgba(22, 163, 74, 0.06);
        border: 1px solid rgba(22, 163, 74, 0.2);
        font-size: 0.8rem;
        color: #16a34a;
        transition: all 0.2s ease;
      }

      .payment-security-badge:hover {
        background: rgba(22, 163, 74, 0.1);
        border-color: rgba(22, 163, 74, 0.3);
        transform: translateX(2px);
      }

      .payment-security-badge-icon {
        flex-shrink: 0;
        width: 16px;
        height: 16px;
        stroke-width: 2;
      }

      /* Summary */
      .payment-summary {
        padding: 1.25rem 0;
        border-top: 1px solid var(--bdr);
        border-bottom: 1px solid var(--bdr);
      }

      .payment-summary-row {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        font-size: 0.9rem;
        color: var(--muted);
      }

      .payment-summary-divider {
        height: 1px;
        background: var(--bdr);
        margin: 0.5rem 0;
      }

      .payment-summary-total {
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--text);
      }

      /* Submit Button */
      .payment-submit-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 1rem 1.5rem;
        border: none;
        border-radius: 12px;
        background: linear-gradient(
          135deg,
          var(--coral) 0%,
          rgba(37, 99, 235, 0.9) 100%
        );
        color: white;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        position: relative;
        overflow: hidden;
        margin-top: 0.75rem;
      }

      .payment-submit-btn::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.1) 0%,
          transparent 55%
        );
        pointer-events: none;
      }

      .payment-submit-btn:hover:not(:disabled) {
        transform: translateY(-3px);
        box-shadow: 0 12px 32px rgba(37, 99, 235, 0.35);
      }

      .payment-submit-btn:active:not(:disabled) {
        transform: translateY(-1px);
      }

      .payment-submit-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }

      .payment-spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .payment-method-placeholder {
        text-align: center;
        padding: 3rem 2rem;
        color: var(--muted);
      }

      /* Responsive */
      @media (max-width: 640px) {
        .payment-hero {
          padding: 2rem 1rem 1.5rem;
        }

        .payment-content {
          padding: 0 1rem 2rem;
        }

        .payment-section {
          padding: 1.5rem;
        }

        .payment-form-row {
          grid-template-columns: 1fr;
        }

        .payment-method-tabs {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class PaymentComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authSvc = inject(AuthService);
  private ticketSvc = inject(TicketService);
  private destroy$ = new Subject<void>();

  // Lucide icons
  creditCard = CreditCard;
  wallet = Wallet;
  star = Star;
  lock = Lock;
  user = User;
  calendar = Calendar;
  shieldCheck = ShieldCheck;

  selectedMethod = signal<PaymentMethod>('card');
  cardForm!: FormGroup;
  ticketId = signal<string | null>(null);
  processing = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.initializeForm();

    // Get ticket ID from query params
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        if (params['ticketId']) {
          this.ticketId.set(params['ticketId']);
        }
      });
  }

  private initializeForm() {
    this.cardForm = this.fb.group({
      cardNumber: ['', [Validators.required, Validators.minLength(19)]],
      cardholderName: ['', [Validators.required, Validators.minLength(2)]],
      expiryDate: [
        '',
        [Validators.required, Validators.pattern(/^\d{2}\/\d{2}$/)],
      ],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
    });
  }

  submitPayment() {
    if (!this.cardForm.valid || this.processing()) return;

    this.processing.set(true);
    // Add your payment processing logic here
    // For now, simulate a delay
    setTimeout(() => {
      this.processing.set(false);
      // Navigate to success or payment confirmation page
      this.router.navigate(['/user-dashboard/bookings']);
    }, 2000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack() {
    window.history.length > 1
      ? window.history.back()
      : this.router.navigate(['/user-dashboard']);
  }
}
