// src/app/features/auth/auth-dialog/auth-dialog.ts
import {
  Component,
  inject,
  signal,
  InjectionToken,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ZardDialogRef } from '@shared/components/dialog/dialog-ref';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import {
  AuthService,
  UserRole,
  RegisterDto,
  LoginDto,
  VerifyAccountDto,
} from '@core/services/auth.service';

export const ZARD_DIALOG_DATA = new InjectionToken<unknown>('ZardDialogData');

type Step =
  | 'role-selection'
  | 'register'
  | 'verify'
  | 'login-role-selection'
  | 'login'
  | 'forgot-password'
  | 'reset-password';

@Component({
  selector: 'app-auth-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ZardInputDirective],
  template: `
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />

    <div
      class="relative w-full rounded-[18px] bg-white text-[#0F172A] overflow-y-auto max-h-[90vh]"
      style="font-family:'Poppins',sans-serif;box-shadow:0 4px 12px rgba(30,58,95,.06)"
      (click)="$event.stopPropagation()"
    >
      <!-- Close -->
      <button
        type="button"
        (click)="close()"
        class="absolute top-3.5 right-3.5 z-20 w-7 h-7 rounded-full flex items-center justify-center
                     bg-[#F1F5F9] border border-[#E2E8F0] cursor-pointer text-[#64748B]
                     hover:bg-[#E2E8F0] hover:text-[#0F172A] transition-all duration-150"
        aria-label="Close"
      >
        <svg
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <!-- ═══ ROLE SELECTION (REGISTER) ═══ -->
      @if (step() === 'role-selection') {
      <div
        class="relative z-10 flex flex-col gap-5 px-6 pt-7 pb-7 animate-fadeUp"
      >
        <ng-container *ngTemplateOutlet="brandTpl"></ng-container>
        <div class="flex flex-col gap-1.5">
          <div class="w-full h-[3px] rounded-full bg-[#E2E8F0]">
            <div
              class="h-full rounded-full bg-[#2563EB] transition-all duration-500"
              style="width:50%"
            ></div>
          </div>
          <span
            class="text-[0.57rem] tracking-[.14em] uppercase text-[#94A3B8]"
            style="font-family:'DM Mono',monospace"
          >
            Step 1 of 2 — Account type
          </span>
        </div>
        <div class="flex flex-col gap-1">
          <h2
            class="text-[1.75rem] leading-none m-0 text-[#0F172A]"
            style="font-family:'Poppins',sans-serif;font-weight:800;letter-spacing:-0.02em"
          >
            Join as…
          </h2>
          <p
            class="text-[.82rem] text-[#64748B] font-light leading-relaxed m-0"
          >
            Choose how you want to use Tazkarts
          </p>
        </div>
        <ng-container
          *ngTemplateOutlet="
            rolePairTpl;
            context: { selectFn: selectRegRole, activeRole: regRole() }
          "
        ></ng-container>
        <p class="text-center text-[.8rem] text-[#64748B]">
          Already have an account?
          <button
            type="button"
            class="bg-transparent border-0 p-0 text-[#2563EB] font-semibold cursor-pointer hover:opacity-75 transition-opacity text-[.8rem]"
            (click)="goto('login-role-selection')"
          >
            Sign in
          </button>
        </p>
      </div>
      }

      <!-- ═══ REGISTER FORM ═══ -->
      @if (step() === 'register') {
      <div
        class="relative z-10 flex flex-col gap-5 px-6 pt-7 pb-7 animate-fadeUp"
      >
        <ng-container
          *ngTemplateOutlet="backTpl; context: { target: 'role-selection' }"
        ></ng-container>
        <div class="flex flex-col gap-1.5">
          <div class="w-full h-[3px] rounded-full bg-[#E2E8F0]">
            <div
              class="h-full rounded-full transition-all duration-500 w-full"
              [class]="regRole() === 'user' ? 'bg-[#D97706]' : 'bg-[#2563EB]'"
            ></div>
          </div>
          <span
            class="text-[0.57rem] tracking-[.14em] uppercase text-[#94A3B8]"
            style="font-family:'DM Mono',monospace"
          >
            Step 2 of 2 — Your details
          </span>
        </div>
        <div class="flex flex-col gap-1">
          <span [class]="badgeClass(regRole())">
            {{
              regRole() === 'organizer'
                ? 'Organizer Account'
                : 'Attendee Account'
            }}
          </span>
          <h2
            class="text-[1.75rem] leading-none m-0 text-[#0F172A]"
            style="font-family:'Poppins',sans-serif;font-weight:800;letter-spacing:-0.02em"
          >
            Create account
          </h2>
        </div>
        <form
          [formGroup]="registerForm"
          (ngSubmit)="onRegister()"
          class="flex flex-col gap-3.5"
        >
          @if (regRole() === 'organizer') {
          <div class="flex flex-col gap-1.5">
            <label
              class="text-[.73rem] font-semibold text-[#475569] tracking-[.01em]"
              >Organization Name *</label
            >
            <input
              z-input
              formControlName="name"
              type="text"
              placeholder="Cairo Creative Hub"
              autocomplete="organization"
              [class]="inputClass()"
            />
            @if (f('name').invalid && f('name').touched) {
            <span class="text-[.68rem] text-red-500">Required</span> }
          </div>
          } @else {
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <label
                class="text-[.73rem] font-semibold text-[#475569] tracking-[.01em]"
                >First Name *</label
              >
              <input
                z-input
                formControlName="firstName"
                type="text"
                placeholder="Ahmed"
                autocomplete="given-name"
                [class]="inputClass()"
              />
              @if (f('firstName').invalid && f('firstName').touched) {
              <span class="text-[.68rem] text-red-500">Required</span> }
            </div>
            <div class="flex flex-col gap-1.5">
              <label
                class="text-[.73rem] font-semibold text-[#475569] tracking-[.01em]"
                >Last Name *</label
              >
              <input
                z-input
                formControlName="lastName"
                type="text"
                placeholder="Hassan"
                autocomplete="family-name"
                [class]="inputClass()"
              />
              @if (f('lastName').invalid && f('lastName').touched) {
              <span class="text-[.68rem] text-red-500">Required</span> }
            </div>
          </div>
          }
          <div class="flex flex-col gap-1.5">
            <label
              class="text-[.73rem] font-semibold text-[#475569] tracking-[.01em]"
              >Email *</label
            >
            <input
              z-input
              formControlName="email"
              type="email"
              placeholder="you@example.com"
              autocomplete="email"
              [class]="inputClass()"
            />
            @if (f('email').invalid && f('email').touched) {
            <span class="text-[.68rem] text-red-500">Valid email required</span>
            }
          </div>
          <div class="flex flex-col gap-1.5">
            <label
              class="text-[.73rem] font-semibold text-[#475569] tracking-[.01em]"
              >Password *</label
            >
            <input
              z-input
              formControlName="password"
              type="password"
              placeholder="Min. 6 characters"
              autocomplete="new-password"
              [class]="inputClass()"
            />
            @if (f('password').invalid && f('password').touched) {
            <span class="text-[.68rem] text-red-500">Min. 6 characters</span> }
          </div>
          <ng-container *ngTemplateOutlet="alertsTpl"></ng-container>
          <button
            type="submit"
            [class]="ctaClass(regRole())"
            [disabled]="registerForm.invalid || busy()"
          >
            <span class="flex items-center gap-2">
              @if (busy()) { <span class="spinner"></span> Creating… } @else {
              Create Account }
            </span>
            @if (!busy()) { <span class="cta-arrow">→</span> }
          </button>
        </form>
        <p class="text-center text-[.8rem] text-[#64748B]">
          Have an account?
          <button
            type="button"
            class="bg-transparent border-0 p-0 text-[#2563EB] font-semibold cursor-pointer hover:opacity-75 transition-opacity text-[.8rem]"
            (click)="goto('login-role-selection')"
          >
            Sign in
          </button>
        </p>
      </div>
      }

      <!-- ═══ VERIFY EMAIL ═══ -->
      @if (step() === 'verify') {
      <div
        class="relative z-10 flex flex-col gap-5 px-6 pt-7 pb-7 animate-fadeUp"
      >
        <div class="flex flex-col items-center gap-3 text-center">
          <div
            class="w-16 h-16 rounded-[18px] flex items-center justify-center
                        bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706]"
          >
            <svg
              width="30"
              height="30"
              fill="none"
              stroke="currentColor"
              stroke-width="1.4"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <h2
            class="text-[1.75rem] leading-none m-0 text-[#0F172A]"
            style="font-family:'Poppins',sans-serif;font-weight:800;letter-spacing:-0.02em"
          >
            Check your inbox
          </h2>
          <p
            class="text-[.82rem] text-[#64748B] font-light leading-relaxed m-0"
          >
            We sent a verification code to<br />
            <strong class="text-[#0F172A] font-semibold">{{
              pendingEmail()
            }}</strong>
          </p>
        </div>
        <form
          [formGroup]="verifyForm"
          (ngSubmit)="onVerify()"
          class="flex flex-col gap-3.5"
        >
          <div class="flex flex-col gap-1.5">
            <label
              class="text-[.73rem] font-semibold text-[#475569] tracking-[.01em]"
              >Verification Code *</label
            >
            <input
              z-input
              formControlName="code"
              type="text"
              maxlength="10"
              placeholder="· · · · · ·"
              inputmode="numeric"
              autocomplete="one-time-code"
              [class]="
                inputClass() +
                ' font-mono tracking-[.22em] text-[1.05rem] text-center'
              "
            />
          </div>
          <ng-container *ngTemplateOutlet="alertsTpl"></ng-container>
          <button
            type="submit"
            [class]="ctaClass('user')"
            [disabled]="verifyForm.invalid || busy()"
          >
            <span class="flex items-center gap-2">
              @if (busy()) {
              <span class="spinner spinner-dark"></span> Verifying… } @else {
              Verify &amp; Continue }
            </span>
            @if (!busy()) { <span class="cta-arrow">→</span> }
          </button>
        </form>
        <p class="text-center text-[.8rem] text-[#64748B]">
          Wrong email?
          <button
            type="button"
            class="bg-transparent border-0 p-0 text-[#2563EB] font-semibold cursor-pointer hover:opacity-75 transition-opacity text-[.8rem]"
            (click)="goto('role-selection')"
          >
            Go back
          </button>
        </p>
      </div>
      }

      <!-- ═══ LOGIN ROLE SELECTION ═══ -->
      @if (step() === 'login-role-selection') {
      <div
        class="relative z-10 flex flex-col gap-5 px-6 pt-7 pb-7 animate-fadeUp"
      >
        <ng-container *ngTemplateOutlet="brandTpl"></ng-container>
        <div class="flex flex-col gap-1">
          <h2
            class="text-[1.75rem] leading-none m-0 text-[#0F172A]"
            style="font-family:'Poppins',sans-serif;font-weight:800;letter-spacing:-0.02em"
          >
            Welcome back
          </h2>
          <p class="text-[.82rem] text-[#64748B] font-light m-0">
            Who are you logging in as?
          </p>
        </div>
        <ng-container
          *ngTemplateOutlet="
            rolePairTpl;
            context: { selectFn: selectLoginRole, activeRole: loginRole() }
          "
        ></ng-container>
        <p class="text-center text-[.8rem] text-[#64748B]">
          New here?
          <button
            type="button"
            class="bg-transparent border-0 p-0 text-[#2563EB] font-semibold cursor-pointer hover:opacity-75 transition-opacity text-[.8rem]"
            (click)="goto('role-selection')"
          >
            Sign up
          </button>
        </p>
      </div>
      }

      <!-- ═══ LOGIN FORM ═══ -->
      @if (step() === 'login') {
      <div
        class="relative z-10 flex flex-col gap-5 px-6 pt-7 pb-7 animate-fadeUp"
      >
        <ng-container
          *ngTemplateOutlet="
            backTpl;
            context: { target: 'login-role-selection' }
          "
        ></ng-container>
        <div class="flex flex-col gap-1">
          <span [class]="badgeClass(loginRole())">
            {{ loginRole() === 'organizer' ? 'Organizer' : 'Attendee' }}
          </span>
          <h2
            class="text-[1.75rem] leading-none m-0 text-[#0F172A]"
            style="font-family:'Poppins',sans-serif;font-weight:800;letter-spacing:-0.02em"
          >
            Sign in
          </h2>
        </div>
        <form
          [formGroup]="loginForm"
          (ngSubmit)="onLogin()"
          class="flex flex-col gap-3.5"
        >
          <div class="flex flex-col gap-1.5">
            <label
              class="text-[.73rem] font-semibold text-[#475569] tracking-[.01em]"
              >Email</label
            >
            <input
              z-input
              formControlName="email"
              type="email"
              placeholder="you@example.com"
              autocomplete="email"
              [class]="inputClass()"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <label
                class="text-[.73rem] font-semibold text-[#475569] tracking-[.01em]"
                >Password</label
              >
              <button
                type="button"
                class="bg-transparent border-0 p-0 text-[.73rem] font-medium text-[#2563EB] cursor-pointer hover:opacity-75 transition-opacity"
                (click)="goto('forgot-password')"
              >
                Forgot?
              </button>
            </div>
            <input
              z-input
              formControlName="password"
              type="password"
              placeholder="Your password"
              autocomplete="current-password"
              [class]="inputClass()"
            />
          </div>
          <ng-container *ngTemplateOutlet="alertsTpl"></ng-container>
          <button
            type="submit"
            [class]="ctaClass(loginRole())"
            [disabled]="loginForm.invalid || busy()"
          >
            <span class="flex items-center gap-2">
              @if (busy()) {
              <span
                class="spinner"
                [class.spinner-dark]="loginRole() === 'user'"
              ></span>
              Signing in… } @else { Sign in as
              {{ loginRole() === 'organizer' ? 'Organizer' : 'Attendee' }} }
            </span>
            @if (!busy()) { <span class="cta-arrow">→</span> }
          </button>
        </form>
        <p class="text-center text-[.8rem] text-[#64748B]">
          No account?
          <button
            type="button"
            class="bg-transparent border-0 p-0 text-[#2563EB] font-semibold cursor-pointer hover:opacity-75 transition-opacity text-[.8rem]"
            (click)="goto('role-selection')"
          >
            Sign up
          </button>
        </p>
      </div>
      }

      <!-- ═══ FORGOT PASSWORD ═══ -->
      @if (step() === 'forgot-password') {
      <div
        class="relative z-10 flex flex-col gap-5 px-6 pt-7 pb-7 animate-fadeUp"
      >
        <ng-container
          *ngTemplateOutlet="backTpl; context: { target: 'login' }"
        ></ng-container>
        <div class="flex flex-col gap-1">
          <h2
            class="text-[1.75rem] leading-none m-0 text-[#0F172A]"
            style="font-family:'Poppins',sans-serif;font-weight:800;letter-spacing:-0.02em"
          >
            Forgot password
          </h2>
          <p class="text-[.82rem] text-[#64748B] font-light m-0">
            Enter your email and we'll send reset instructions
          </p>
        </div>
        <form
          [formGroup]="forgotForm"
          (ngSubmit)="onForgot()"
          class="flex flex-col gap-3.5"
        >
          <div class="flex flex-col gap-1.5">
            <label
              class="text-[.73rem] font-semibold text-[#475569] tracking-[.01em]"
              >Email</label
            >
            <input
              z-input
              formControlName="email"
              type="email"
              placeholder="you@example.com"
              autocomplete="email"
              [class]="inputClass()"
            />
          </div>
          <ng-container *ngTemplateOutlet="alertsTpl"></ng-container>
          <button
            type="submit"
            [class]="ctaClass('organizer')"
            [disabled]="forgotForm.invalid || busy()"
          >
            <span class="flex items-center gap-2">
              @if (busy()) { <span class="spinner"></span> Sending… } @else {
              Send Reset Link }
            </span>
            @if (!busy()) { <span class="cta-arrow">→</span> }
          </button>
        </form>
      </div>
      }

      <!-- ═══ RESET PASSWORD ═══ -->
      @if (step() === 'reset-password') {
      <div
        class="relative z-10 flex flex-col gap-5 px-6 pt-7 pb-7 animate-fadeUp"
      >
        <ng-container
          *ngTemplateOutlet="backTpl; context: { target: 'login' }"
        ></ng-container>
        <div class="flex flex-col gap-1">
          <h2
            class="text-[1.75rem] leading-none m-0 text-[#0F172A]"
            style="font-family:'Poppins',sans-serif;font-weight:800;letter-spacing:-0.02em"
          >
            Reset password
          </h2>
          <p class="text-[.82rem] text-[#64748B] font-light m-0">
            Enter the token sent to your inbox
          </p>
        </div>
        <form
          [formGroup]="resetForm"
          (ngSubmit)="onReset()"
          class="flex flex-col gap-3.5"
        >
          <div class="flex flex-col gap-1.5">
            <label
              class="text-[.73rem] font-semibold text-[#475569] tracking-[.01em]"
              >Email</label
            >
            <input
              z-input
              formControlName="email"
              type="email"
              autocomplete="email"
              [class]="inputClass()"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label
              class="text-[.73rem] font-semibold text-[#475569] tracking-[.01em]"
              >Reset Token</label
            >
            <input
              z-input
              formControlName="token"
              type="text"
              autocomplete="one-time-code"
              [class]="inputClass() + ' font-mono tracking-[.22em] text-center'"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label
              class="text-[.73rem] font-semibold text-[#475569] tracking-[.01em]"
              >New Password</label
            >
            <input
              z-input
              formControlName="newPassword"
              type="password"
              autocomplete="new-password"
              [class]="inputClass()"
            />
          </div>
          <ng-container *ngTemplateOutlet="alertsTpl"></ng-container>
          <button
            type="submit"
            [class]="ctaClass('organizer')"
            [disabled]="resetForm.invalid || busy()"
          >
            <span class="flex items-center gap-2">
              @if (busy()) { <span class="spinner"></span> Resetting… } @else {
              Reset Password }
            </span>
            @if (!busy()) { <span class="cta-arrow">→</span> }
          </button>
        </form>
      </div>
      }

      <!-- ═══ SHARED TEMPLATES ═══ -->

      <!-- Brand -->
      <ng-template #brandTpl>
        <div class="flex items-center gap-2.5">
          <div
            class="w-[30px] h-[30px] rounded-full shrink-0 flex items-center justify-center
                      bg-[#2563EB] text-white"
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 2v4M18 2v4M3 10h18M3 6a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6z"
              />
            </svg>
          </div>
          <span class="text-[1.1rem] font-bold text-[#0F172A]">Tazkarts</span>
        </div>
      </ng-template>

      <!-- Back button -->
      <ng-template #backTpl let-target="target">
        <button
          type="button"
          (click)="goto(target)"
          class="inline-flex items-center gap-1.5 bg-transparent border-0 p-0 min-h-[28px]
                       text-[.76rem] font-medium text-[#64748B] cursor-pointer w-fit
                       hover:text-[#0F172A] transition-colors duration-200"
        >
          <svg
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19 12H5M12 5l-7 7 7 7"
            />
          </svg>
          Back
        </button>
      </ng-template>

      <!-- Role pair -->
      <ng-template
        #rolePairTpl
        let-selectFn="selectFn"
        let-activeRole="activeRole"
      >
        <div class="grid grid-cols-2 gap-3">
          <!-- Organizer -->
          <button
            type="button"
            (click)="selectFn('organizer')"
            class="relative flex flex-col items-center gap-2.5 py-[18px] px-3.5 rounded-[14px]
                         bg-white cursor-pointer text-center
                         transition-all duration-200 hover:-translate-y-0.5 border"
            [style.border-color]="
              activeRole === 'organizer' ? 'rgba(37,99,235,.6)' : '#E2E8F0'
            "
            [style.background]="
              activeRole === 'organizer' ? 'rgba(37,99,235,.04)' : '#FFFFFF'
            "
            [style.box-shadow]="
              activeRole === 'organizer'
                ? '0 0 0 3px rgba(37,99,235,.1)'
                : '0 1px 3px rgba(30,58,95,.04)'
            "
          >
            <div
              class="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center
                        bg-[#2563EB] text-white transition-all duration-200"
              [style.opacity]="activeRole === 'organizer' ? '1' : '0'"
              [style.transform]="
                activeRole === 'organizer' ? 'scale(1)' : 'scale(.5)'
              "
            >
              <svg
                width="10"
                height="10"
                fill="none"
                stroke="currentColor"
                stroke-width="2.8"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div
              class="w-11 h-11 rounded-[12px] flex items-center justify-center
                        bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB]"
            >
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 7a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM16 3v4M8 3v4M3 11h18"
                />
              </svg>
            </div>
            <strong class="text-[.92rem] font-700 text-[#0F172A]"
              >Organizer</strong
            >
            <span class="text-[.67rem] text-[#64748B] font-light leading-snug"
              >Create &amp; manage events</span
            >
          </button>

          <!-- Attendee -->
          <button
            type="button"
            (click)="selectFn('user')"
            class="relative flex flex-col items-center gap-2.5 py-[18px] px-3.5 rounded-[14px]
                         bg-white cursor-pointer text-center
                         transition-all duration-200 hover:-translate-y-0.5 border"
            [style.border-color]="
              activeRole === 'user' ? 'rgba(217,119,6,.6)' : '#E2E8F0'
            "
            [style.background]="
              activeRole === 'user' ? 'rgba(217,119,6,.04)' : '#FFFFFF'
            "
            [style.box-shadow]="
              activeRole === 'user'
                ? '0 0 0 3px rgba(217,119,6,.1)'
                : '0 1px 3px rgba(30,58,95,.04)'
            "
          >
            <div
              class="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center
                        bg-[#D97706] text-white transition-all duration-200"
              [style.opacity]="activeRole === 'user' ? '1' : '0'"
              [style.transform]="
                activeRole === 'user' ? 'scale(1)' : 'scale(.5)'
              "
            >
              <svg
                width="10"
                height="10"
                fill="none"
                stroke="currentColor"
                stroke-width="2.8"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div
              class="w-11 h-11 rounded-[12px] flex items-center justify-center
                        bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706]"
            >
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </div>
            <strong class="text-[.92rem] font-700 text-[#0F172A]"
              >Attendee</strong
            >
            <span class="text-[.67rem] text-[#64748B] font-light leading-snug"
              >Discover &amp; book events</span
            >
          </button>
        </div>
      </ng-template>

      <!-- Alerts -->
      <ng-template #alertsTpl>
        @if (err()) {
        <div
          role="alert"
          class="flex items-start gap-2 px-3.5 py-2.5 rounded-[9px] text-[.78rem] leading-relaxed
                      bg-red-50 border border-red-200 text-red-600"
        >
          <svg
            class="shrink-0 mt-0.5"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <path stroke-linecap="round" d="M12 8v4M12 16h.01" />
          </svg>
          {{ err() }}
        </div>
        } @if (ok()) {
        <div
          role="status"
          class="flex items-start gap-2 px-3.5 py-2.5 rounded-[9px] text-[.78rem] leading-relaxed
                      bg-green-50 border border-green-200 text-green-700"
        >
          <svg
            class="shrink-0 mt-0.5"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {{ ok() }}
        </div>
        }
      </ng-template>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        font-family: 'Poppins', sans-serif;
      }

      @keyframes fadeUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-fadeUp {
        animation: fadeUp 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      .cta-arrow {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.25);
        font-size: 1rem;
        transition: transform 0.2s;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.35);
        border-top-color: #fff;
        animation: spin 0.7s linear infinite;
        flex-shrink: 0;
      }
      .spinner-dark {
        border-color: rgba(229, 231, 235, 0.3);
        border-top-color: #2563eb;
      }
    `,
  ],
})
export class AuthDialog implements OnInit, OnDestroy {
  private readonly dialogRef = inject(ZardDialogRef);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly dialogData: { mode?: 'login' | 'register' } =
    (inject(ZARD_DIALOG_DATA, { optional: true }) as any) ?? {};

  step = signal<Step>('login-role-selection');
  regRole = signal<UserRole>('user');
  loginRole = signal<UserRole>('user');
  pendingEmail = signal('');
  busy = signal(false);
  err = signal('');
  ok = signal('');

  registerForm!: FormGroup;
  verifyForm!: FormGroup;
  loginForm!: FormGroup;
  forgotForm!: FormGroup;
  resetForm!: FormGroup;

  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnInit() {
    this.buildForms();
    this.step.set(
      this.dialogData?.mode === 'register'
        ? 'role-selection'
        : 'login-role-selection'
    );
  }
  ngOnDestroy() {
    this.timers.forEach(clearTimeout);
  }
  close() {
    this.dialogRef.close();
  }
  private after(ms: number, fn: () => void) {
    const id = setTimeout(fn, ms);
    this.timers.push(id);
  }

  inputClass(): string {
    return [
      'w-full box-border',
      'bg-white border border-[#E2E8F0] rounded-[9px]',
      'text-[#0F172A] text-[.88rem] placeholder:text-[#94A3B8]',
      'px-[.9rem] py-[.65rem] outline-none',
      'transition-all duration-200',
      'focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,.1)]',
    ].join(' ');
  }

  badgeClass(role: UserRole): string {
    const base =
      'inline-flex items-center w-fit px-2.5 py-[3px] rounded-full mb-1 text-[.6rem] tracking-[.1em] uppercase border';
    return role === 'user'
      ? `${base} bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]`
      : `${base} bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]`;
  }

  ctaClass(role: UserRole): string {
    const base = [
      'w-full flex items-center justify-between',
      'px-5 py-[.78rem] border-0 rounded-[12px]',
      'font-bold text-[.9rem] cursor-pointer relative overflow-hidden',
      'transition-all duration-200',
      'disabled:opacity-40 disabled:cursor-not-allowed',
    ].join(' ');
    return role === 'user'
      ? `${base} bg-[#D97706] text-white shadow-[0_4px_16px_rgba(217,119,6,.28)] hover:bg-[#B45309]`
      : `${base} bg-[#2563EB] text-white shadow-[0_4px_16px_rgba(37,99,235,.28)] hover:bg-[#1D4ED8]`;
  }

  private buildForms() {
    this.verifyForm = this.fb.group({ code: ['', Validators.required] });
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      token: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
    });
    this.buildRegisterForm();
  }

  private buildRegisterForm() {
    const prev = this.registerForm?.value ?? {};
    this.registerForm =
      this.regRole() === 'organizer'
        ? this.fb.group({
            name: [
              prev.name ?? '',
              [Validators.required, Validators.minLength(2)],
            ],
            email: [prev.email ?? '', [Validators.required, Validators.email]],
            password: [
              prev.password ?? '',
              [Validators.required, Validators.minLength(6)],
            ],
          })
        : this.fb.group({
            firstName: [prev.firstName ?? '', Validators.required],
            lastName: [prev.lastName ?? '', Validators.required],
            email: [prev.email ?? '', [Validators.required, Validators.email]],
            password: [
              prev.password ?? '',
              [Validators.required, Validators.minLength(6)],
            ],
          });
  }

  f(name: string) {
    return this.registerForm.get(name)!;
  }
  goto(s: Step) {
    this.step.set(s);
    this.err.set('');
    this.ok.set('');
  }
  private clear() {
    this.err.set('');
    this.ok.set('');
  }

  selectRegRole = (r: UserRole) => {
    this.regRole.set(r);
    this.buildRegisterForm();
    this.goto('register');
  };
  selectLoginRole = (r: UserRole) => {
    this.loginRole.set(r);
    this.goto('login');
  };

  onRegister() {
    if (this.registerForm.invalid || this.busy()) return;
    this.busy.set(true);
    this.clear();
    this.auth
      .register(this.registerForm.value as RegisterDto, this.regRole())
      .subscribe({
        next: (r) => {
          this.busy.set(false);
          if (r.success) {
            const email = this.registerForm.get('email')!.value;
            this.pendingEmail.set(email);
            if (this.regRole() === 'user') {
              this.ok.set(
                'Account created! Check your email for the verification code.'
              );
              this.after(1200, () => this.goto('verify'));
            } else {
              this.ok.set('Organizer account created! Please sign in.');
              this.after(1500, () => {
                this.loginRole.set('organizer');
                this.loginForm.patchValue({ email });
                this.goto('login');
              });
            }
          } else {
            this.err.set(r.message || 'Registration failed');
          }
        },
        error: (e) => {
          this.busy.set(false);
          this.err.set(e?.error?.message || 'Registration failed');
        },
      });
  }

  onVerify() {
    if (this.verifyForm.invalid || this.busy()) return;
    this.busy.set(true);
    this.clear();
    const dto: VerifyAccountDto = {
      email: this.pendingEmail(),
      code: this.verifyForm.get('code')!.value,
    };
    this.auth.verifyAccount(dto).subscribe({
      next: (r) => {
        this.busy.set(false);
        if (r.success) {
          this.ok.set('Email verified! Redirecting to sign in…');
          this.after(1200, () => {
            this.loginRole.set('user');
            this.loginForm.patchValue({ email: this.pendingEmail() });
            this.goto('login');
          });
        } else {
          this.err.set(r.message || 'Verification failed');
        }
      },
      error: (e) => {
        this.busy.set(false);
        this.err.set(e?.error?.message || 'Invalid or expired code');
      },
    });
  }

  onLogin() {
    if (this.loginForm.invalid || this.busy()) return;
    this.busy.set(true);
    this.clear();
    const role = this.loginRole();
    this.auth.login(this.loginForm.value as LoginDto, role).subscribe({
      next: (r) => {
        this.busy.set(false);
        if (r.success) {
          if (role === 'user') {
            this.ok.set('Welcome! Setting up your feed…');
            this.after(700, () => {
              this.dialogRef.close();
              this.router.navigate(['/select-categories']);
            });
          } else {
            this.ok.set('Welcome back! Redirecting…');
            this.after(900, () => {
              this.dialogRef.close();
              this.router.navigate(['/dashboard']);
            });
          }
        } else {
          this.err.set(r.message || 'Login failed');
        }
      },
      error: (e) => {
        this.busy.set(false);
        this.err.set(e?.error?.message || 'Login failed');
      },
    });
  }

  onForgot() {
    if (this.forgotForm.invalid || this.busy()) return;
    this.busy.set(true);
    this.clear();
    this.auth
      .forgotPassword(this.forgotForm.value, this.loginRole())
      .subscribe({
        next: (r) => {
          this.busy.set(false);
          if (r.success) {
            this.ok.set('Reset link sent! Check your inbox.');
            this.after(2500, () => {
              this.resetForm.patchValue({
                email: this.forgotForm.get('email')!.value,
              });
              this.goto('reset-password');
            });
          } else {
            this.err.set(r.message || 'Failed to send reset link');
          }
        },
        error: (e) => {
          this.busy.set(false);
          this.err.set(e?.error?.message || 'Failed');
        },
      });
  }

  onReset() {
    if (this.resetForm.invalid || this.busy()) return;
    this.busy.set(true);
    this.clear();
    this.auth.resetPassword(this.resetForm.value, this.loginRole()).subscribe({
      next: (r) => {
        this.busy.set(false);
        if (r.success) {
          this.ok.set('Password reset! You can now sign in.');
          this.after(2000, () => {
            this.loginForm.patchValue({
              email: this.resetForm.get('email')!.value,
            });
            this.goto('login');
          });
        } else {
          this.err.set(r.message || 'Reset failed');
        }
      },
      error: (e) => {
        this.busy.set(false);
        this.err.set(e?.error?.message || 'Reset failed');
      },
    });
  }
}
