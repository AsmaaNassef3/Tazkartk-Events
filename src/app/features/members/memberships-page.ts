// src/app/features/members/memberships-page.ts

import {
  Component,
  computed,
  HostListener,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { toast } from 'ngx-sonner';

import { MembershipService } from '@core/services/membership.service';
import { AuthService } from '@core/services/auth.service';
import { OrgMembership, MembershipStatus } from '@core/models/membership.model';
import { MemberFilterPipe } from '@shared/pipes/member-filter.pipe';

type ActiveTab = 'members' | 'pending' | 'banned';

@Component({
  selector: 'app-memberships-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe, MemberFilterPipe],

  styles: [
    `
      @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
      :host {
        --primary: #2563eb;
        --primary-hover: #2159d4;
        --primary-light: #eef2ff;
        --primary-subtle: #f0f4ff;
        --blue-accent: #3b82f6;
        --orange: #f97316;
        --orange-hover: #f59e0b;
        --green: #10b981;
        --green-hover: #059669;
        --red: #ef4444;
        --red-hover: #dc2626;
        --text-900: #0d2352;
        --text-700: #1e3a5f;
        --text-600: #334155;
        --text-500: #475569;
        --text-400: #64748b;
        --text-300: #94a3b8;
        --border: #e2e8f0;
        --border-light: #f1f5f9;
        --bg: #ffffff;
        --bg-light: #f8faff;
        --shadow-xs: 0 1px 2px rgba(13, 35, 82, 0.04);
        --shadow-sm: 0 2px 8px rgba(13, 35, 82, 0.06);
        --shadow-md: 0 4px 12px rgba(13, 35, 82, 0.08);
        --shadow-lg: 0 8px 28px rgba(13, 35, 82, 0.1);
        display: block;
      }
      @keyframes fade-up {
        from {
          opacity: 0;
          transform: translateY(14px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      @keyframes shimmer {
        from {
          background-position: -800px 0;
        }
        to {
          background-position: 800px 0;
        }
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      @keyframes pulse-ring {
        0% {
          box-shadow: 0 0 0 0 rgba(240, 180, 41, 0.4);
        }
        70% {
          box-shadow: 0 0 0 7px rgba(240, 180, 41, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(240, 180, 41, 0);
        }
      }
      .page-enter {
        animation: fade-up 0.38s cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      .spin {
        animation: spin 0.75s linear infinite;
      }

      .skeleton {
        background: linear-gradient(
          90deg,
          #f0f4ff 25%,
          #dbeafe 50%,
          #f0f4ff 75%
        );
        border-radius: 16px;
        border: 1.5px solid rgba(37, 99, 235, 0.15);
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.06);
      }

      /* ── Stat cards ── */
      .stat-card {
        background: linear-gradient(
          135deg,
          #ffffff 0%,
          rgba(37, 99, 235, 0.03) 100%
        );
        border: 1.5px solid var(--border);
        box-shadow: var(--shadow-sm);
        border-radius: 16px;
        padding: 16px;
        transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        position: relative;
        overflow: hidden;
      }
      .stat-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(
          90deg,
          var(--primary) 0%,
          #60a5fa 50%,
          transparent 100%
        );
        opacity: 0;
        transition: opacity 0.3s;
      }
      .stat-card:hover {
        border-color: var(--primary);
        box-shadow: 0 8px 24px rgba(37, 99, 235, 0.12);
        transform: translateY(-2px);
        background: linear-gradient(
          135deg,
          #ffffff 0%,
          rgba(37, 99, 235, 0.06) 100%
        );
      }
      .stat-card:hover::before {
        opacity: 1;
      }
      .stat-num {
        color: var(--text-900);
        font-size: 1.75rem;
        font-weight: 700;
        line-height: 1.1;
      }
      .stat-label {
        color: var(--text-500);
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-top: 8px;
      }
      .stat-icon {
        width: 36px;
        height: 36px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        float: right;
        transition: all 0.2s;
      }
      .stat-card:hover .stat-icon {
        transform: scale(1.1);
      }

      /* ── Tab bar ── */
      .tab-bar {
        display: flex;
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .tab-bar::-webkit-scrollbar {
        display: none;
      }
      .tab-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 10px 14px;
        border: none;
        background: none;
        cursor: pointer;
        flex-shrink: 0;
        font-family: 'DM Mono', monospace;
        font-size: 0.6rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--text-400);
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;
        transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        white-space: nowrap;
        font-weight: 500;
      }
      .tab-btn:hover {
        color: var(--primary);
      }
      .tab-btn.active {
        color: var(--primary);
        border-bottom-color: var(--primary);
        font-weight: 700;
        text-shadow: 0 0 8px rgba(37, 99, 235, 0.15);
      }
      .tab-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 17px;
        height: 17px;
        padding: 0 4px;
        border-radius: 100px;
        font-size: 0.54rem;
        font-weight: 700;
        background: linear-gradient(135deg, var(--primary) 0%, #60a5fa 100%);
        color: #fff;
        line-height: 1;
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
      }
      .tab-badge.dim {
        background: rgba(13, 35, 82, 0.08);
        color: var(--text-400);
        box-shadow: none;
      }

      /* ── Search ── */
      .search-wrap {
        position: relative;
        display: flex;
        align-items: center;
      }
      .search-input {
        background: linear-gradient(
          135deg,
          var(--bg) 0%,
          rgba(37, 99, 235, 0.02) 100%
        ) !important;
        border: 1.5px solid var(--border) !important;
        color: var(--text-900) !important;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 0.875rem;
        padding: 10px 14px !important;
        border-radius: 10px !important;
        transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1) !important;
      }
      .search-input::placeholder {
        color: var(--text-400) !important;
      }
      .search-input:focus {
        border-color: var(--primary) !important;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12) !important;
        outline: none !important;
        background: linear-gradient(
          135deg,
          var(--bg) 0%,
          rgba(37, 99, 235, 0.05) 100%
        ) !important;
      }

      /* ── Member card ── */
      .member-card {
        background: linear-gradient(
          135deg,
          #ffffff 0%,
          rgba(37, 99, 235, 0.04) 100%
        );
        border: 1.5px solid var(--border);
        box-shadow: var(--shadow-sm);
        border-radius: 16px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        position: relative;
        overflow: hidden;
      }
      .member-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          135deg,
          rgba(37, 99, 235, 0.03) 0%,
          rgba(59, 130, 246, 0.05) 100%
        );
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
      }
      .member-card:hover {
        border-color: rgba(37, 99, 235, 0.5);
        box-shadow: 0 8px 24px rgba(37, 99, 235, 0.12);
        transform: translateY(-4px);
        background: linear-gradient(
          135deg,
          #ffffff 0%,
          rgba(37, 99, 235, 0.08) 100%
        );
      }
      .member-card:hover::before {
        opacity: 1;
      }
      .member-card > * {
        position: relative;
        z-index: 1;
      }
      .mc-glow {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(
          90deg,
          var(--primary) 0%,
          #60a5fa 50%,
          transparent 100%
        );
        opacity: 0;
        transition: opacity 0.3s;
        border-radius: 0 0 16px 16px;
      }
      .member-card:hover .mc-glow {
        opacity: 1;
      }
      .pending-card {
        border-color: rgba(249, 115, 22, 0.3);
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.98) 0%,
          rgba(249, 115, 22, 0.04) 100%
        );
      }
      .pending-card::before {
        background: linear-gradient(
          135deg,
          rgba(249, 115, 22, 0.04) 0%,
          rgba(251, 191, 36, 0.02) 100%
        );
        opacity: 0.5;
      }
      .pending-card:hover {
        border-color: var(--orange-hover);
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.98) 0%,
          rgba(249, 115, 22, 0.08) 100%
        );
      }
      .banned-card {
        border-color: rgba(239, 68, 68, 0.3);
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.98) 0%,
          rgba(239, 68, 68, 0.04) 100%
        );
      }
      .banned-card::before {
        background: linear-gradient(
          135deg,
          rgba(239, 68, 68, 0.04) 0%,
          rgba(248, 113, 113, 0.02) 100%
        );
        opacity: 0.5;
      }
      .banned-card:hover {
        border-color: var(--red);
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.98) 0%,
          rgba(239, 68, 68, 0.08) 100%
        );
      }
      .approved-card {
        border-color: rgba(16, 185, 129, 0.2);
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.99) 0%,
          rgba(16, 185, 129, 0.03) 100%
        );
      }
      .approved-card::before {
        background: linear-gradient(
          135deg,
          rgba(16, 185, 129, 0.03) 0%,
          rgba(5, 150, 105, 0.02) 100%
        );
        opacity: 0.3;
      }
      .approved-card:hover {
        border-color: var(--green);
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.99) 0%,
          rgba(16, 185, 129, 0.06) 100%
        );
      }

      .avatar {
        width: 46px;
        height: 46px;
        border-radius: 13px;
        flex-shrink: 0;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Bebas Neue', sans-serif;
        font-size: 1.05rem;
        letter-spacing: 0.04em;
        color: #fff;
        box-shadow: 0 2px 8px rgba(13, 35, 82, 0.12);
        transition: all 0.2s;
      }
      .member-card:hover .avatar {
        box-shadow: 0 4px 12px rgba(13, 35, 82, 0.18);
        transform: scale(1.05);
      }
      .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .pending-card .avatar {
        box-shadow: 0 2px 8px rgba(249, 115, 22, 0.2);
      }
      .banned-card .avatar {
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
      }
      .approved-card .avatar {
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
        border: 2px solid var(--bg);
        transition: all 0.2s;
      }
      .status-dot.approved {
        background: var(--green);
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
      }
      .status-dot.pending {
        background: var(--orange-hover);
        animation: pulse-ring 2s infinite;
        box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
      }
      .status-dot.banned {
        background: var(--red);
        box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
      }

      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: 100px;
        font-family: 'DM Mono', monospace;
        font-size: 0.54rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        transition: all 0.2s;
        backdrop-filter: blur(4px);
      }
      .sp-approved {
        background: linear-gradient(
          135deg,
          rgba(16, 185, 129, 0.15) 0%,
          rgba(5, 150, 105, 0.1) 100%
        );
        border: 1px solid rgba(16, 185, 129, 0.35);
        color: var(--green-hover);
      }
      .sp-pending {
        background: linear-gradient(
          135deg,
          rgba(249, 115, 22, 0.15) 0%,
          rgba(251, 191, 36, 0.1) 100%
        );
        border: 1px solid rgba(249, 115, 22, 0.35);
        color: var(--orange);
      }
      .sp-banned {
        background: linear-gradient(
          135deg,
          rgba(239, 68, 68, 0.12) 0%,
          rgba(248, 113, 113, 0.08) 100%
        );
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: var(--red-hover);
      }
      .sp-rejected {
        background: linear-gradient(
          135deg,
          rgba(13, 35, 82, 0.08) 0%,
          rgba(37, 99, 235, 0.05) 100%
        );
        border: 1px solid rgba(37, 99, 235, 0.2);
        color: var(--text-500);
      }

      /* ── Action buttons ── */
      .action-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 8px 6px;
        border-radius: 10px;
        border: 1.5px solid;
        cursor: pointer;
        font-family: 'DM Mono', monospace;
        font-size: 0.58rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-weight: 600;
        transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        white-space: nowrap;
        background: none;
      }
      .action-btn svg {
        width: 14px;
        height: 14px;
      }
      .action-btn:hover:not(:disabled) {
        transform: translateY(-1px);
      }
      .action-btn.btn-approve {
        background: linear-gradient(
          135deg,
          rgba(16, 185, 129, 0.1) 0%,
          rgba(5, 150, 105, 0.05) 100%
        );
        color: var(--green-hover);
        border-color: rgba(16, 185, 129, 0.35);
      }
      .action-btn.btn-approve:hover {
        background: linear-gradient(
          135deg,
          rgba(16, 185, 129, 0.15) 0%,
          rgba(5, 150, 105, 0.1) 100%
        );
        border-color: var(--green);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.18);
      }
      .action-btn.btn-reject {
        background: linear-gradient(
          135deg,
          rgba(37, 99, 235, 0.06) 0%,
          rgba(59, 130, 246, 0.03) 100%
        );
        color: var(--text-500);
        border-color: var(--border);
      }
      .action-btn.btn-reject:hover {
        background: linear-gradient(
          135deg,
          rgba(37, 99, 235, 0.1) 0%,
          rgba(59, 130, 246, 0.05) 100%
        );
        border-color: rgba(37, 99, 235, 0.4);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
      }
      .action-btn.btn-ban {
        background: linear-gradient(
          135deg,
          rgba(249, 115, 22, 0.1) 0%,
          rgba(251, 191, 36, 0.05) 100%
        );
        color: var(--orange);
        border-color: rgba(249, 115, 22, 0.35);
      }
      .action-btn.btn-ban:hover {
        background: linear-gradient(
          135deg,
          rgba(249, 115, 22, 0.15) 0%,
          rgba(251, 191, 36, 0.1) 100%
        );
        border-color: var(--orange-hover);
        box-shadow: 0 4px 12px rgba(249, 115, 22, 0.18);
      }
      .action-btn.btn-unban {
        background: linear-gradient(
          135deg,
          rgba(37, 99, 235, 0.1) 0%,
          rgba(59, 130, 246, 0.05) 100%
        );
        color: var(--primary);
        border-color: rgba(37, 99, 235, 0.35);
      }
      .action-btn.btn-unban:hover {
        background: linear-gradient(
          135deg,
          rgba(37, 99, 235, 0.15) 0%,
          rgba(59, 130, 246, 0.1) 100%
        );
        border-color: var(--primary);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.18);
      }
      .action-btn.btn-remove {
        background: linear-gradient(
          135deg,
          rgba(239, 68, 68, 0.08) 0%,
          rgba(248, 113, 113, 0.04) 100%
        );
        color: var(--red-hover);
        border-color: rgba(239, 68, 68, 0.3);
      }
      .action-btn.btn-remove:hover {
        background: linear-gradient(
          135deg,
          rgba(239, 68, 68, 0.12) 0%,
          rgba(248, 113, 113, 0.08) 100%
        );
        border-color: var(--red);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
      }

      .card-busy {
        position: absolute;
        inset: 0;
        border-radius: 16px;
        z-index: 10;
        background: rgba(6, 6, 8, 0.65);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      ::-webkit-scrollbar {
        width: 3px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: var(--border);
        border-radius: 99px;
      }
    `,
  ],

  template: `
    <div
      class="w-full min-h-full"
      style="background:#ffffff;color:var(--text-900);font-family:'Plus Jakarta Sans',sans-serif"
    >
      <!-- ════  HEADER  ════ -->
      <div
        class="relative overflow-hidden border-b"
        style="border-color:var(--border)"
      >
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            class="absolute"
            style="width:70vw;height:70vw;top:-30%;left:-15%;background:radial-gradient(circle,rgba(37,99,235,.04) 0%,transparent 65%);filter:blur(80px);border-radius:50%"
          ></div>
          <div
            class="absolute"
            style="width:50vw;height:50vw;top:0;right:-10%;background:radial-gradient(circle,rgba(37,99,235,.02) 0%,transparent 65%);filter:blur(80px);border-radius:50%"
          ></div>
        </div>

        <div
          class="relative z-10 max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-10"
        >
          <div
            class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
          >
            <div>
              <div class="flex items-center gap-2 mb-3">
                <span
                  style="font-family:'DM Mono',monospace;font-size:.56rem;letter-spacing:.22em;text-transform:uppercase;color:var(--primary);font-weight:600;opacity:0.9"
                >
                  ◆ Organisation
                </span>
              </div>
              <!-- clamp keeps the title on two lines even at 320 px -->
              <h1
                style="font-family:'Bebas Neue',sans-serif;font-size:clamp(2.8rem,11vw,7rem);line-height:.88;letter-spacing:.03em;color:var(--text-900);margin:0"
              >
                YOUR<br />
                <span
                  style="color:transparent;-webkit-text-stroke:2px var(--primary)"
                  >MEMBERS</span
                >
              </h1>
              <p
                class="mt-2"
                style="font-size:.84rem;color:var(--text-500);font-weight:300;max-width:360px;line-height:1.7"
              >
                Manage membership requests, active members, and access control
                for your organisation.
              </p>
            </div>
            @if (!loading() && allMembers().length > 0) {
            <div
              style="font-family:'DM Mono',monospace;font-size:.58rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-400)"
            >
              {{ allMembers().length }} total
            </div>
            }
          </div>

          <!-- Stat cards: 2 cols mobile → 4 cols desktop -->
          @if (!loading() && allMembers().length > 0) {
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            @for (s of statsCards(); track s.label; let i = $index) {
            <div
              class="stat-card page-enter"
              [style.animation-delay]="i * 60 + 'ms'"
            >
              <div class="stat-num">{{ s.value }}</div>
              <div class="stat-label">{{ s.label }}</div>
              <div class="stat-icon" [style.background]="s.bgColor">
                <svg
                  class="w-4 h-4"
                  [style.color]="s.color"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    [attr.d]="s.path"
                  />
                </svg>
              </div>
            </div>
            }
          </div>
          }
        </div>
      </div>

      <!-- ════  STICKY TAB + SEARCH  ════ -->
      @if (!loading() && orgId()) {
      <div
        class="sticky top-0 z-30 border-b"
        style="background:rgba(255,255,255,.95);backdrop-filter:blur(20px);border-color:var(--border)"
      >
        <div class="max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-12">
          <!--
          Mobile  : tabs row on top, search input on second row (full width)
          sm+     : tabs + search side-by-side in one row
        -->
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <!-- Tabs (horizontally scrollable, no visible scrollbar) -->
            <div
              class="tab-bar border-b sm:border-b-0"
              style="border-color:rgba(242,238,230,.06)"
            >
              <button
                class="tab-btn"
                [class.active]="activeTab() === 'members'"
                (click)="setTab('members')"
              >
                Members
                <span class="tab-badge" [class.dim]="approvedCount() === 0">{{
                  approvedCount()
                }}</span>
              </button>
              <button
                class="tab-btn"
                [class.active]="activeTab() === 'pending'"
                (click)="setTab('pending')"
              >
                Pending @if (pendingCount() > 0) {
                <span class="tab-badge">{{ pendingCount() }}</span>
                } @else {
                <span class="tab-badge dim">0</span>
                }
              </button>
              <button
                class="tab-btn"
                [class.active]="activeTab() === 'banned'"
                (click)="setTab('banned')"
              >
                Banned
                <span class="tab-badge dim">{{ bannedCount() }}</span>
              </button>
            </div>

            <!-- Search: full-width on mobile, fixed 13 rem on sm+ -->
            <div class="search-wrap py-2 sm:w-52 sm:shrink-0">
              <input
                class="search-input"
                type="text"
                placeholder="Search name or email…"
                [value]="searchQuery()"
                (input)="onSearch($event)"
              />
              <svg
                class="absolute right-3.5 w-3.5 h-3.5 pointer-events-none"
                style="color:var(--text-300)"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      }

      <!-- ════  CONTENT  ════ -->
      <div class="max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
        <!-- Loading skeletons -->
        @if (loading()) {
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          @for (i of [1,2,3,4,5,6,7,8]; track i) {
          <div
            class="skeleton h-48"
            [style.animation-delay]="i * 40 + 'ms'"
          ></div>
          }
        </div>

        <!-- No org -->
        } @else if (!orgId()) {
        <div
          class="flex flex-col items-center justify-center py-24 text-center space-y-5"
        >
          <div
            class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center"
            style="background:rgba(239,68,68,.1);border:1.5px solid rgba(239,68,68,.2)"
          >
            <svg
              class="w-8 h-8 sm:w-9 sm:h-9"
              style="color:var(--red)"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <div>
            <p
              style="font-family:'Bebas Neue',sans-serif;font-size:1.4rem;letter-spacing:.06em;color:var(--text-900)"
            >
              No Organisation Found
            </p>
            <p class="mt-1" style="font-size:.82rem;color:var(--text-500)">
              Log in with an organisation account to manage members.
            </p>
          </div>
        </div>

        <!-- No members at all -->
        } @else if (allMembers().length === 0) {
        <div
          class="flex flex-col items-center justify-center py-24 text-center space-y-5"
        >
          <div
            class="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center"
            style="background:rgba(37,99,235,.08);border:1.5px solid rgba(37,99,235,.2)"
          >
            <svg
              class="w-9 h-9 sm:w-10 sm:h-10"
              style="color:var(--primary)"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
          </div>
          <div>
            <p
              style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;letter-spacing:.06em;color:var(--text-900)"
            >
              No Members Yet
            </p>
            <p
              class="mt-1"
              style="font-size:.84rem;color:var(--text-500);max-width:300px;margin-inline:auto;line-height:1.7"
            >
              Members will appear here once users join your organisation.
            </p>
          </div>
        </div>

        <!-- Empty state after pipe -->
        } @else if ((visibleMembers() | memberSearch:searchQuery()).length ===
        0) {
        <div
          class="flex flex-col items-center justify-center py-20 text-center space-y-4"
        >
          <svg
            class="w-9 h-9"
            style="color:var(--text-300)"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z"
            />
          </svg>
          <div>
            <p
              style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;letter-spacing:.06em;color:var(--text-900)"
            >
              {{ emptyLabel() }}
            </p>
            @if (searchQuery().trim()) {
            <p class="mt-1" style="font-size:.78rem;color:var(--text-400)">
              Try a different search term.
            </p>
            }
          </div>
        </div>

        <!-- Cards: 1 col mobile → 2 sm → 3 lg → 4 xl -->
        } @else {
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          @for (m of visibleMembers() | memberSearch:searchQuery(); track
          m.userId; let i = $index) {
          <div
            class="member-card page-enter"
            [class.pending-card]="m.status === MS.Pending"
            [class.banned-card]="m.status === MS.Banned"
            [class.approved-card]="m.status === MS.Approved"
            [style.animation-delay]="i * 45 + 'ms'"
          >
            @if (busyId() === m.userId) {
            <div class="card-busy">
              <div
                class="spin w-6 h-6 rounded-full"
                style="border:2px solid rgba(37,99,235,.15);border-top-color:var(--primary);border-right-color:#60a5fa"
              ></div>
            </div>
            }

            <!-- Avatar + name -->
            <div class="flex items-start gap-3">
              <div class="avatar" [style]="getAvatarStyle(m)">
                @if (m.user?.logoUrl) {
                <img
                  [src]="m.user!.logoUrl!"
                  [alt]="displayName(m)"
                  (error)="onAvatarErr($event)"
                />
                } @else {
                {{ initials(m) }}
                }
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 mb-0.5">
                  <span
                    class="status-dot"
                    [class.approved]="m.status === MS.Approved"
                    [class.pending]="m.status === MS.Pending"
                    [class.banned]="m.status === MS.Banned"
                  ></span>
                  <p
                    class="truncate"
                    style="font-family:'Bebas Neue',sans-serif;font-size:1rem;letter-spacing:.03em;color:var(--text-900);line-height:1.1"
                  >
                    {{ displayName(m) }}
                  </p>
                </div>
                @if (m.user?.email) {
                <p
                  class="truncate"
                  style="font-family:'DM Mono',monospace;font-size:.57rem;letter-spacing:.07em;color:var(--text-400)"
                >
                  {{ m.user!.email }}
                </p>
                }
              </div>
            </div>

            <!-- Info -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <span
                  class="status-pill"
                  [class.sp-approved]="m.status === MS.Approved"
                  [class.sp-pending]="m.status === MS.Pending"
                  [class.sp-banned]="m.status === MS.Banned"
                  [class.sp-rejected]="m.status === MS.Rejected"
                >
                  {{ statusLabel(m.status) }}
                </span>
                @if (m.user?.city) {
                <span
                  style="font-family:'DM Mono',monospace;font-size:.54rem;letter-spacing:.07em;color:var(--text-500)"
                >
                  {{ m.user!.city
                  }}{{ m.user?.region ? ', ' + m.user!.region : '' }}
                </span>
                }
              </div>
              @if (m.status === MS.Pending || m.status === MS.Rejected) {
              <p
                style="font-family:'DM Mono',monospace;font-size:.54rem;letter-spacing:.08em;color:var(--text-400);font-weight:500"
              >
                Requested {{ m.requestDate | date : 'MMM d, y' }}
              </p>
              } @else if (m.joinDate) {
              <p
                style="font-family:'DM Mono',monospace;font-size:.54rem;letter-spacing:.08em;color:var(--text-400);font-weight:500"
              >
                Joined {{ m.joinDate | date : 'MMM d, y' }}
              </p>
              }
            </div>

            <!-- Actions -->
            <div class="flex gap-2 mt-auto">
              @if (m.status === MS.Pending) {
              <button
                class="action-btn btn-approve"
                (click)="approveRequest(m)"
              >
                <svg
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
                Approve
              </button>
              <button class="action-btn btn-reject" (click)="rejectRequest(m)">
                <svg
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Reject
              </button>
              } @if (m.status === MS.Approved) {
              <button class="action-btn btn-ban" (click)="banMember(m)">
                <svg
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
                Ban
              </button>
              <button class="action-btn btn-remove" (click)="removeMember(m)">
                <svg
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                  />
                </svg>
                Remove
              </button>
              } @if (m.status === MS.Banned) {
              <button class="action-btn btn-unban" (click)="unbanMember(m)">
                <svg
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
                Unban
              </button>
              <button class="action-btn btn-remove" (click)="removeMember(m)">
                <svg
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                  />
                </svg>
                Remove
              </button>
              }
            </div>

            <div class="mc-glow"></div>
          </div>
          }
        </div>
        }
      </div>
    </div>
  `,
})
export class MembershipsPageComponent implements OnInit {
  private membershipService = inject(MembershipService);
  private authService = inject(AuthService);

  readonly MS = MembershipStatus;

  orgId = signal<number | null>(null);
  allMembers = signal<OrgMembership[]>([]);
  loading = signal(false);
  busyId = signal<number | null>(null);
  activeTab = signal<ActiveTab>('members');
  searchQuery = signal('');

  approvedCount = computed(
    () =>
      this.allMembers().filter((m) => m.status === MembershipStatus.Approved)
        .length
  );
  pendingCount = computed(
    () =>
      this.allMembers().filter((m) => m.status === MembershipStatus.Pending)
        .length
  );
  bannedCount = computed(
    () =>
      this.allMembers().filter((m) => m.status === MembershipStatus.Banned)
        .length
  );

  statsCards = computed(() => [
    {
      label: 'Total',
      value: this.allMembers().length,
      color: '#a5b4fc',
      bgColor: 'rgba(99,102,241,.1)',
      path: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
    },
    {
      label: 'Active',
      value: this.approvedCount(),
      color: '#10b981',
      bgColor: 'rgba(16,185,129,.1)',
      path: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Pending',
      value: this.pendingCount(),
      color: '#F0B429',
      bgColor: 'rgba(240,180,41,.1)',
      path: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Banned',
      value: this.bannedCount(),
      color: '#f87171',
      bgColor: 'rgba(248,113,113,.1)',
      path: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
    },
  ]);

  /**
   * Tab-only filter. Search filtering is handled by MemberSearchPipe in the template,
   * keeping the computed lean and avoiding double-filtering signals.
   */
  visibleMembers = computed<OrgMembership[]>(() => {
    const statusMap: Record<ActiveTab, MembershipStatus[]> = {
      members: [MembershipStatus.Approved],
      pending: [MembershipStatus.Pending],
      banned: [MembershipStatus.Banned],
    };
    return this.allMembers().filter((m) =>
      statusMap[this.activeTab()].includes(m.status)
    );
  });

  emptyLabel = computed<string>(() => {
    if (this.searchQuery().trim()) return 'No matches found';
    return {
      members: 'No Active Members',
      pending: 'No Pending Requests',
      banned: 'No Banned Members',
    }[this.activeTab()];
  });

  ngOnInit() {
    const org = this.authService.getOrganization();
    if (org) {
      this.orgId.set(org.id);
      this.loadMembers(org.id);
    }
  }

  @HostListener('document:click') onDocClick() {}

  private loadMembers(orgId: number) {
    this.loading.set(true);
    this.membershipService.getAllMembers(orgId).subscribe({
      next: (ms) => {
        this.allMembers.set(ms);
        this.loading.set(false);
      },
      error: () => {
        toast.error('Failed to load members');
        this.loading.set(false);
      },
    });
  }

  setTab(t: ActiveTab) {
    this.activeTab.set(t);
    this.searchQuery.set('');
  }
  onSearch(e: Event) {
    this.searchQuery.set((e.target as HTMLInputElement).value);
  }

  approveRequest(m: OrgMembership) {
    if (this.busyId() !== null) return;
    this.busyId.set(m.userId);
    this.membershipService
      .processRequest({
        userId: m.userId,
        organizationId: this.orgId()!,
        isApproved: true,
      })
      .subscribe({
        next: () => {
          this.allMembers.update((l) =>
            l.map((x) =>
              x.userId === m.userId
                ? {
                    ...x,
                    status: MembershipStatus.Approved,
                    joinDate: new Date().toISOString(),
                  }
                : x
            )
          );
          toast.success(this.displayName(m) + ' approved');
          this.busyId.set(null);
        },
        error: (err) => {
          toast.error(err.error?.message || 'Failed to approve');
          this.busyId.set(null);
        },
      });
  }

  rejectRequest(m: OrgMembership) {
    if (this.busyId() !== null) return;
    if (!confirm('Reject ' + this.displayName(m) + "'s request?")) return;
    this.busyId.set(m.userId);
    this.membershipService
      .processRequest({
        userId: m.userId,
        organizationId: this.orgId()!,
        isApproved: false,
      })
      .subscribe({
        next: () => {
          this.allMembers.update((l) =>
            l.map((x) =>
              x.userId === m.userId
                ? { ...x, status: MembershipStatus.Rejected }
                : x
            )
          );
          toast.success('Request rejected');
          this.busyId.set(null);
        },
        error: (err) => {
          toast.error(err.error?.message || 'Failed to reject');
          this.busyId.set(null);
        },
      });
  }

  banMember(m: OrgMembership) {
    if (this.busyId() !== null) return;
    if (
      !confirm(
        'Ban ' +
          this.displayName(m) +
          '? They will lose access to this organisation.'
      )
    )
      return;
    this.busyId.set(m.userId);
    this.membershipService.banUser(this.orgId()!, m.userId).subscribe({
      next: () => {
        this.allMembers.update((l) =>
          l.map((x) =>
            x.userId === m.userId
              ? { ...x, status: MembershipStatus.Banned }
              : x
          )
        );
        toast.success(this.displayName(m) + ' banned');
        this.busyId.set(null);
      },
      error: (err) => {
        toast.error(err.error?.message || 'Failed to ban');
        this.busyId.set(null);
      },
    });
  }

  unbanMember(m: OrgMembership) {
    if (this.busyId() !== null) return;
    this.busyId.set(m.userId);
    this.membershipService.unbanUser(this.orgId()!, m.userId).subscribe({
      next: () => {
        this.allMembers.update((l) =>
          l.map((x) =>
            x.userId === m.userId
              ? { ...x, status: MembershipStatus.Approved }
              : x
          )
        );
        toast.success(this.displayName(m) + ' unbanned');
        this.busyId.set(null);
      },
      error: (err) => {
        toast.error(err.error?.message || 'Failed to unban');
        this.busyId.set(null);
      },
    });
  }

  removeMember(m: OrgMembership) {
    if (this.busyId() !== null) return;
    if (
      !confirm(
        'Remove ' +
          this.displayName(m) +
          ' from your organisation? This cannot be undone.'
      )
    )
      return;
    this.busyId.set(m.userId);
    this.membershipService.removeMember(this.orgId()!, m.userId).subscribe({
      next: () => {
        this.allMembers.update((l) => l.filter((x) => x.userId !== m.userId));
        toast.success(this.displayName(m) + ' removed');
        this.busyId.set(null);
      },
      error: (err) => {
        toast.error(err.error?.message || 'Failed to remove');
        this.busyId.set(null);
      },
    });
  }

  displayName(m: OrgMembership): string {
    const u = m.user;
    if (!u) return 'User #' + m.userId;
    const full = [u.firstName, u.lastName].filter(Boolean).join(' ');
    return full || u.email || 'User #' + m.userId;
  }

  initials(m: OrgMembership): string {
    const u = m.user;
    if (!u) return '?';
    const f = u.firstName?.[0] ?? '';
    const l = u.lastName?.[0] ?? '';
    return (f + l).toUpperCase() || (u.email?.[0]?.toUpperCase() ?? '?');
  }

  statusLabel(s: MembershipStatus): string {
    const map: Record<number, string> = {
      [MembershipStatus.Approved]: 'Active',
      [MembershipStatus.Pending]: 'Pending',
      [MembershipStatus.Banned]: 'Banned',
      [MembershipStatus.Rejected]: 'Rejected',
    };
    return map[s] ?? 'Unknown';
  }

  private readonly _palettes = [
    'linear-gradient(135deg,#FF4433,#ff6b45)',
    'linear-gradient(135deg,#4f46e5,#7c3aed)',
    'linear-gradient(135deg,#0891b2,#0e7490)',
    'linear-gradient(135deg,#059669,#047857)',
    'linear-gradient(135deg,#d97706,#b45309)',
    'linear-gradient(135deg,#db2777,#9d174d)',
  ];

  getAvatarStyle(m: OrgMembership): string {
    return 'background:' + this._palettes[m.userId % this._palettes.length];
  }

  onAvatarErr(e: Event) {
    (e.target as HTMLImageElement).style.display = 'none';
  }
}
