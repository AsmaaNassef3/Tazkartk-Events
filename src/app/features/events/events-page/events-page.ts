import {
  Component,
  computed,
  HostListener,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';

import { EventLocationType, EventType } from '@core/models/event.model';
import { CommonModule, DatePipe } from '@angular/common';
import { EventService } from '@core/services/event.service';
import { AuthService } from '@core/services/auth.service';
import { Event as EventModel } from '@core/models/event.model';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { type ZardIcon } from '@shared/components/icon/icons';
import { toast } from 'ngx-sonner';

import { CreateEventModalComponent } from '../modals/create-event-modal';
import { EditEventModalComponent } from '../modals/edit-event-modal';
import { ViewEventModalComponent } from '../modals/view-event-modal';
import {
  FilterEventsPipe,
  EventFilters,
  DEFAULT_FILTERS,
  EventLocationFilter,
  EventStatusFilter,
  EventVisibilityFilter,
} from '../pipes/filter-events.pipe';

interface Category {
  id: number;
  name: string;
}

@Component({
  selector: 'app-events-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    ZardIconComponent,
    CreateEventModalComponent,
    EditEventModalComponent,
    ViewEventModalComponent,
    FilterEventsPipe,
  ],

  styles: [
    `
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

      /* ══════════════════════════════════════════
         DESIGN TOKENS — Light Mode
      ══════════════════════════════════════════ */
      :host {
        /* Blues — from the color palette screenshot */
        --blue-lightest: #eef2ff; /* page bg tint */
        --blue-light-act: #bbcff9; /* Light :active  #bbcff9 */
        --blue-normal: #2563eb; /* Normal         #2563eb */
        --blue-hover: #2159d4; /* Normal :hover  #2159d4 */
        --blue-active: #1e4fbc; /* Normal :active #1e4fbc */
        --blue-dark: #1c4ab0; /* Dark           #1c4ab0 */
        --blue-dark-hov: #163b8d; /* Dark :hover    #163b8d */
        --blue-dark-act: #112d6a; /* Dark :active   #112d6a */
        --blue-darker: #0d2352; /* Darker         #0d2352 */

        /* Semantic */
        --primary: var(--blue-normal);
        --primary-hover: var(--blue-hover);
        --primary-dark: var(--blue-dark);
        --primary-dim: rgba(37, 99, 235, 0.08);
        --primary-dim-md: rgba(37, 99, 235, 0.14);

        /* Orange — keep exactly as-is */
        --orange: #f97316;
        --orange-dim: rgba(249, 115, 22, 0.1);

        /* Success / green */
        --green: #10b981;
        --green-dim: rgba(16, 185, 129, 0.1);

        /* Purple */
        --purple: #8b5cf6;
        --purple-dim: rgba(139, 92, 246, 0.1);

        /* Neutrals */
        --text-900: #0d2352; /* headings — darkest blue */
        --text-700: #1e3a5f;
        --text-500: #475569; /* body text */
        --text-400: #64748b; /* muted */
        --text-300: #94a3b8; /* placeholder */
        --border: #e2e8f0;
        --border-md: #cbd5e1;
        --bg: #ffffff;
        --bg-2: #f8faff;
        --bg-3: #eef2ff;

        /* Typography */
        --ff-head: 'Poppins', sans-serif;
        --ff-body: 'Poppins', sans-serif;
        --ff-mono: 'DM Mono', monospace;

        display: block;
        background: var(--bg-2);
      }

      /* ══════════════════════════════════════════
         KEYFRAMES
      ══════════════════════════════════════════ */
      @keyframes fade-up {
        from {
          opacity: 0;
          transform: translateY(14px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
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
      @keyframes pulse-dot {
        0%,
        100% {
          box-shadow: 0 0 5px currentColor;
          transform: scale(0.9);
        }
        50% {
          box-shadow: 0 0 12px currentColor;
          transform: scale(1.1);
        }
      }
      @keyframes slide-in {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .page-enter {
        animation: fade-up 0.38s cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      /* ══════════════════════════════════════════
         SKELETON
      ══════════════════════════════════════════ */
      .skeleton {
        background: linear-gradient(
          90deg,
          rgba(37, 99, 235, 0.05) 25%,
          rgba(37, 99, 235, 0.12) 50%,
          rgba(37, 99, 235, 0.05) 75%
        );
        background-size: 1600px 100%;
        animation: shimmer 1.6s ease-in-out infinite;
      }
      .skeleton-card {
        aspect-ratio: 3/4;
        border-radius: 16px;
        border: 1.5px solid var(--border);
        background: var(--bg);
      }

      /* ══════════════════════════════════════════
         STAT CARDS
      ══════════════════════════════════════════ */
      .stat-card {
        position: relative;
        overflow: hidden;
        border-radius: 16px;
        border: 1.5px solid var(--border);
        background: linear-gradient(135deg, var(--bg) 0%, var(--bg-3) 100%);
        padding: 1.5rem 1.5rem 1.25rem;
        cursor: default;
        transition: all 0.28s cubic-bezier(0.22, 1, 0.36, 1);
        box-shadow: 0 2px 6px rgba(13, 35, 82, 0.08),
          0 8px 20px rgba(13, 35, 82, 0.05);
      }
      .stat-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 28px rgba(37, 99, 235, 0.15),
          0 2px 8px rgba(13, 35, 82, 0.08);
        border-color: rgba(37, 99, 235, 0.3);
        background: linear-gradient(
          135deg,
          var(--bg) 0%,
          rgba(37, 99, 235, 0.04) 100%
        );
      }
      .stat-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--primary), transparent);
        opacity: 0;
        transition: opacity 0.28s;
      }
      .stat-card:hover::before {
        opacity: 1;
      }

      .stat-num {
        font-family: var(--ff-head);
        font-size: 2rem;
        font-weight: 700;
        line-height: 1;
        color: var(--text-900);
        letter-spacing: -0.01em;
      }
      .stat-label {
        font-family: var(--ff-mono);
        font-size: 0.6rem;
        font-weight: 500;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--text-400);
        margin-top: 0.4rem;
      }
      .stat-icon {
        position: absolute;
        right: 1.1rem;
        top: 50%;
        transform: translateY(-50%);
        width: 42px;
        height: 42px;
        border-radius: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* ══════════════════════════════════════════
         EVENT CARD
      ══════════════════════════════════════════ */
      .event-card {
        position: relative;
        border-radius: 16px;
        overflow: hidden;
        border: 1.5px solid var(--border);
        aspect-ratio: 3/4;
        cursor: pointer;
        background: var(--bg);
        transition: all 0.28s cubic-bezier(0.22, 1, 0.36, 1);
        box-shadow: 0 2px 8px rgba(13, 35, 82, 0.06),
          0 8px 20px rgba(13, 35, 82, 0.04);
      }
      .event-card:hover {
        border-color: rgba(37, 99, 235, 0.3);
        transform: translateY(-6px);
        box-shadow: 0 8px 24px rgba(37, 99, 235, 0.12),
          0 2px 8px rgba(13, 35, 82, 0.08);
      }

      /* Image */
      .ec-img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 15px;
        transition: transform 0.48s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }
      .event-card:hover .ec-img {
        transform: scale(1.04);
      }

      /* Fallback */
      .ec-fallback {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .ec-fallback-pattern {
        position: absolute;
        inset: 0;
        opacity: 0.06;
        background: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(37, 99, 235, 0.15) 10px,
          rgba(37, 99, 235, 0.15) 20px
        );
      }

      /* Overlay gradient — light mode: bottom white fade ONLY - subtle */
      .ec-overlay {
        position: absolute;
        inset: 0;
        padding: 0.85rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background: linear-gradient(
          to top,
          rgba(255, 255, 255, 0.94) 0%,
          rgba(255, 255, 255, 0.75) 18%,
          rgba(255, 255, 255, 0.25) 32%,
          transparent 50%
        );
      }

      /* ── Tags ── */
      .ec-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 5px 12px;
        border-radius: 100px;
        font-family: var(--ff-mono);
        font-size: 0.65rem;
        font-weight: 800;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        line-height: 1;
        border: 1.4px solid;
        white-space: nowrap;
        transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        backdrop-filter: blur(3px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
      .ec-tag .dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: currentColor;
        animation: pulse-dot 2.2s infinite;
        flex-shrink: 0;
      }
      .ec-tag--upcoming {
        background: linear-gradient(
          135deg,
          rgba(249, 115, 22, 0.2) 0%,
          rgba(251, 191, 36, 0.12) 100%
        );
        border-color: rgba(249, 115, 22, 0.55);
        color: #9a3412;
        font-weight: 800;
      }
      .ec-tag--past {
        background: linear-gradient(
          135deg,
          rgba(100, 116, 139, 0.18) 0%,
          rgba(100, 116, 139, 0.1) 100%
        );
        border-color: rgba(100, 116, 139, 0.48);
        color: #334155;
        font-weight: 800;
      }
      .ec-tag--online {
        background: linear-gradient(
          135deg,
          rgba(245, 158, 11, 0.22) 0%,
          rgba(251, 191, 36, 0.14) 100%
        );
        border-color: rgba(245, 158, 11, 0.55);
        color: #78350f;
        font-weight: 800;
      }
      .ec-tag--inperson {
        background: linear-gradient(
          135deg,
          rgba(37, 99, 235, 0.18) 0%,
          rgba(59, 130, 246, 0.1) 100%
        );
        border-color: rgba(37, 99, 235, 0.52);
        color: #1e3a8a;
        font-weight: 800;
      }
      .ec-tag--public {
        background: linear-gradient(
          135deg,
          rgba(16, 185, 129, 0.18) 0%,
          rgba(5, 150, 105, 0.1) 100%
        );
        border-color: rgba(16, 185, 129, 0.5);
        color: #065f46;
        font-weight: 800;
      }
      .ec-tag--private {
        background: linear-gradient(
          135deg,
          rgba(139, 92, 246, 0.18) 0%,
          rgba(109, 40, 217, 0.1) 100%
        );
        border-color: rgba(139, 92, 246, 0.5);
        color: #4c1d95;
        font-weight: 800;
      }
      .ec-tag--cat {
        background: linear-gradient(
          135deg,
          rgba(37, 99, 235, 0.15) 0%,
          rgba(59, 130, 246, 0.08) 100%
        );
        border-color: rgba(37, 99, 235, 0.45);
        color: #1e40af;
        font-weight: 800;
      }

      /* ── Card bottom ── */
      .ec-date {
        font-family: var(--ff-mono);
        font-size: 0.62rem;
        font-weight: 700;
        letter-spacing: 0.16em;
        color: var(--primary);
        text-transform: uppercase;
        margin-bottom: 0.35rem;
      }
      .ec-title {
        font-family: var(--ff-head);
        font-size: clamp(1rem, 2.4vw, 1.25rem);
        font-weight: 700;
        line-height: 1.15;
        color: var(--text-900);
        margin: 0 0 0.55rem;
        letter-spacing: -0.01em;
      }
      .ec-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 5px;
        flex-wrap: wrap;
      }
      .ec-loc {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.68rem;
        color: var(--text-400);
        font-family: var(--ff-body);
        font-weight: 500;
      }
      .ec-cta {
        font-family: var(--ff-mono);
        font-size: 0.62rem;
        font-weight: 700;
        color: var(--primary);
        padding: 5px 12px;
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.7) 0%,
          rgba(255, 255, 255, 0.55) 100%
        );
        backdrop-filter: blur(4px);
        border: 1.2px solid rgba(37, 99, 235, 0.25);
        border-radius: 8px;
        white-space: nowrap;
        transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        letter-spacing: 0.05em;
        cursor: pointer;
      }
      .event-card:hover .ec-cta {
        background: linear-gradient(
          135deg,
          var(--bg-3) 0%,
          rgba(37, 99, 235, 0.12) 100%
        );
        border-color: rgba(37, 99, 235, 0.4);
        color: var(--blue-dark);
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
      }

      /* bottom glow line */
      .ec-glow {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, var(--primary), transparent);
        opacity: 0;
        transition: opacity 0.28s;
      }
      .event-card:hover .ec-glow {
        opacity: 1;
      }

      /* ══════════════════════════════════════════
         3-DOT MENU
      ══════════════════════════════════════════ */
      .dots-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2.5px;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(4px);
        border: 1px solid var(--border);
        transition: all 0.2s;
        flex-shrink: 0;
      }
      .dots-btn:hover {
        background: var(--primary-dim);
        border-color: rgba(37, 99, 235, 0.28);
      }
      .dots-btn .d {
        display: block;
        width: 3px;
        height: 3px;
        border-radius: 99px;
        background: var(--text-500);
      }

      .ctx-menu {
        position: absolute;
        right: 0;
        top: calc(100% + 6px);
        z-index: 60;
        min-width: 162px;
        padding: 6px;
        border-radius: 12px;
        background: #fff;
        border: 1.5px solid var(--border);
        box-shadow: 0 10px 32px rgba(13, 35, 82, 0.14),
          0 4px 12px rgba(13, 35, 82, 0.08);
        animation: slide-in 0.18s cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      .ctx-item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 9px 13px;
        border-radius: 8px;
        border: none;
        background: transparent;
        color: var(--text-500);
        font-family: var(--ff-body);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        text-align: left;
        transition: all 0.15s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .ctx-item:hover {
        background: linear-gradient(
          135deg,
          var(--primary-dim) 0%,
          rgba(37, 99, 235, 0.06) 100%
        );
        color: var(--primary);
      }
      .ctx-item.danger:hover {
        background: linear-gradient(
          135deg,
          rgba(239, 68, 68, 0.1) 0%,
          rgba(239, 68, 68, 0.05) 100%
        );
        color: #dc2626;
      }
      .ctx-sep {
        height: 1px;
        margin: 4px 0;
        background: var(--border);
      }

      /* ══════════════════════════════════════════
         FILTER RAIL
      ══════════════════════════════════════════ */
      .fp-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border-radius: 10px;
        font-family: var(--ff-mono);
        font-size: 0.62rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        cursor: pointer;
        white-space: nowrap;
        user-select: none;
        transition: all 0.18s cubic-bezier(0.22, 1, 0.36, 1);
        border: 1.5px solid var(--border);
        background: var(--bg);
        color: var(--text-500);
      }
      .fp-btn:hover {
        border-color: rgba(37, 99, 235, 0.28);
        color: var(--primary);
        background: linear-gradient(
          135deg,
          var(--bg-3) 0%,
          rgba(37, 99, 235, 0.05) 100%
        );
      }
      .fp-btn.active {
        border-color: rgba(37, 99, 235, 0.4);
        background: linear-gradient(
          135deg,
          var(--bg-3) 0%,
          rgba(37, 99, 235, 0.06) 100%
        );
        color: var(--blue-dark);
        font-weight: 700;
      }
      .fp-btn.open {
        border-color: var(--primary);
        background: linear-gradient(
          135deg,
          var(--bg-3) 0%,
          rgba(37, 99, 235, 0.08) 100%
        );
        color: var(--primary);
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
      }
      .fp-chevron {
        width: 11px;
        height: 11px;
        opacity: 0.45;
        flex-shrink: 0;
        transition: transform 0.2s;
      }
      .fp-btn.open .fp-chevron {
        transform: rotate(180deg);
        opacity: 0.7;
      }

      .fp-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        z-index: 100;
        min-width: 175px;
        padding: 6px;
        border-radius: 12px;
        background: #fff;
        border: 1.5px solid var(--border);
        box-shadow: 0 10px 32px rgba(13, 35, 82, 0.14),
          0 4px 12px rgba(13, 35, 82, 0.08);
        animation: slide-in 0.18s cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      .fp-option {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 9px 13px;
        border-radius: 8px;
        border: none;
        background: transparent;
        color: var(--text-500);
        font-family: var(--ff-body);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        text-align: left;
        transition: all 0.15s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .fp-option:hover {
        background: linear-gradient(
          135deg,
          var(--primary-dim) 0%,
          rgba(37, 99, 235, 0.06) 100%
        );
        color: var(--primary);
      }
      .fp-option.sel {
        background: var(--primary-dim);
        color: var(--blue-dark);
        font-weight: 700;
      }
      .fp-check {
        width: 12px;
        height: 12px;
        margin-left: auto;
        flex-shrink: 0;
        color: var(--primary);
      }
      .fp-sep {
        height: 1px;
        margin: 4px 2px;
        background: var(--border);
      }

      /* Date pills */
      .fp-date-pill {
        position: relative;
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 8px 14px;
        border-radius: 10px;
        overflow: hidden;
        border: 1.5px solid var(--border);
        background: var(--bg);
        color: var(--text-400);
        font-family: var(--ff-mono);
        font-size: 0.62rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        cursor: pointer;
        white-space: nowrap;
        user-select: none;
        transition: all 0.18s cubic-bezier(0.22, 1, 0.36, 1);
        font-weight: 700;
      }
      .fp-date-pill:hover {
        border-color: rgba(37, 99, 235, 0.28);
        color: var(--primary);
        background: linear-gradient(
          135deg,
          var(--bg-3) 0%,
          rgba(37, 99, 235, 0.05) 100%
        );
      }
      .fp-date-pill.active {
        border-color: rgba(249, 115, 22, 0.4);
        background: linear-gradient(
          135deg,
          rgba(249, 115, 22, 0.08) 0%,
          rgba(249, 115, 22, 0.04) 100%
        );
        color: #c2410c;
        font-weight: 700;
      }
      .fp-date-pill input[type='date'] {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
        border: none;
        background: none;
        -webkit-appearance: none;
      }

      /* Search */
      .search-wrap {
        position: relative;
        display: flex;
        align-items: center;
      }
      .search-icon {
        position: absolute;
        left: 14px;
        color: var(--text-300);
        pointer-events: none;
        width: 14px;
        height: 14px;
        flex-shrink: 0;
      }
      .search-input {
        width: 100%;
        padding: 10px 14px 10px 40px;
        background: var(--bg) !important;
        border: 1.5px solid var(--border) !important;
        border-radius: 10px;
        outline: none !important;
        font-family: var(--ff-body);
        font-size: 13px;
        font-weight: 500;
        color: var(--text-700) !important;
        transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .search-input::placeholder {
        color: var(--text-300) !important;
      }
      .search-input:hover {
        border-color: rgba(37, 99, 235, 0.2) !important;
        background: var(--bg-3) !important;
      }
      .search-input:focus {
        border-color: rgba(37, 99, 235, 0.5) !important;
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1) !important;
        background: var(--bg) !important;
      }

      /* ══════════════════════════════════════════
         HEADER STRIP
      ══════════════════════════════════════════ */
      .page-header {
        background: linear-gradient(135deg, var(--bg) 0%, var(--bg-3) 100%);
        border-bottom: 1.5px solid var(--border);
        box-shadow: 0 4px 16px rgba(13, 35, 82, 0.05);
      }
      .page-title {
        font-family: var(--ff-head);
        font-size: clamp(2rem, 5vw, 2.75rem);
        font-weight: 800;
        color: var(--text-900);
        line-height: 1.1;
        letter-spacing: -0.02em;
        margin: 0;
      }
      .page-sub {
        font-size: 0.9rem;
        color: var(--text-400);
        font-weight: 400;
        margin-top: 0.4rem;
        line-height: 1.7;
      }
      .badge-label {
        font-family: var(--ff-mono);
        font-size: 0.6rem;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--primary);
        background: linear-gradient(
          135deg,
          var(--bg-3) 0%,
          rgba(37, 99, 235, 0.08) 100%
        );
        border: 1.5px solid rgba(37, 99, 235, 0.25);
        border-radius: 100px;
        padding: 4px 12px;
        font-weight: 700;
      }

      /* CTA button */
      .btn-primary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        padding: 11px 22px;
        border-radius: 10px;
        background: linear-gradient(
          135deg,
          var(--primary) 0%,
          var(--blue-hover) 100%
        );
        color: #fff;
        font-family: var(--ff-head);
        font-size: 0.9rem;
        font-weight: 700;
        letter-spacing: -0.01em;
        border: none;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.32);
        white-space: nowrap;
      }
      .btn-primary:hover {
        background: linear-gradient(
          135deg,
          var(--blue-hover) 0%,
          var(--blue-active) 100%
        );
        box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4);
        transform: translateY(-2px);
      }
      .btn-primary:active {
        background: linear-gradient(
          135deg,
          var(--blue-active) 0%,
          var(--blue-dark) 100%
        );
        transform: translateY(0);
      }

      /* Filter sticky bar */
      .filter-bar {
        position: sticky;
        top: 0;
        z-index: 30;
        background: rgba(255, 255, 255, 0.94);
        backdrop-filter: blur(20px);
        border-bottom: 1px solid var(--border);
        box-shadow: 0 2px 8px rgba(13, 35, 82, 0.04);
      }

      /* Empty states */
      .empty-icon-wrap {
        width: 80px;
        height: 80px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(13, 35, 82, 0.06);
      }

      /* Scrollbar */
      ::-webkit-scrollbar {
        width: 4px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: var(--border-md);
        border-radius: 99px;
      }
    `,
  ],

  template: `
    <div
      class="w-full min-h-full"
      style="background:var(--bg-2);color:var(--text-700);font-family:'Poppins',sans-serif"
    >
      <!-- ══════════════════════════════════════════
           PAGE HEADER
      ══════════════════════════════════════════ -->
      <div class="page-header">
        <div class="max-w-screen-xl mx-auto px-5 sm:px-8 lg:px-12 py-8">
          <div
            class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"
          >
            <!-- Left -->
            <div>
              <div class="mb-3">
                <span class="badge-label">◆ Event Management</span>
              </div>       <h1
                style="font-family:'Bebas Neue',sans-serif;font-size:clamp(2.8rem,11vw,7rem);line-height:.88;letter-spacing:.03em;color:var(--text-900);margin:0"
              >
                YOUR<br />
                <span
                  style="color:transparent;-webkit-text-stroke:2px var(--primary)"
                  >EVENTS</span
                >
              </h1>
             
              <p class="page-sub">
                Manage, publish, and track all your organisation's events from
                one place.
              </p>
            </div>

            <!-- Right -->
            <div class="flex flex-col sm:flex-row sm:items-center gap-3">
              @if (!loading() && events().length > 0) {
              <span
                style="font-family:var(--ff-mono);font-size:.62rem;letter-spacing:.12em;
                             text-transform:uppercase;color:var(--text-300)"
              >
                {{ events().length }} total
              </span>
              }
              <button
                class="btn-primary w-full sm:w-auto justify-center"
                (click)="openCreateModal()"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Event
              </button>
            </div>
          </div>

          <!-- Stat row -->
          @if (!loading() && events().length > 0) {
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            @for (s of statsCards(); track s.label; let i = $index) {
            <div class="stat-card" [style.animation-delay]="i * 55 + 'ms'">
              <div class="stat-num">{{ s.value }}</div>
              <div class="stat-label">{{ s.label }}</div>
              <div class="stat-icon" [style.background]="s.bgColor">
                <svg
                  class="w-5 h-5"
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

      <!-- ══════════════════════════════════════════
           FILTER RAIL
      ══════════════════════════════════════════ -->
      @if (!loading() && events().length > 0) {
      <div class="filter-bar" (click)="$event.stopPropagation()">
        <div class="max-w-screen-xl mx-auto px-5 sm:px-8 lg:px-12 py-3">
          <div class="flex flex-wrap items-center gap-2">
            <!-- Search -->
            <div
              class="search-wrap w-full md:flex-1 md:min-w-[200px] md:max-w-xs"
            >
              <svg
                class="search-icon"
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
              <input
                class="search-input"
                type="text"
                placeholder="Search events…"
                [value]="filters().search"
                (input)="setSearch($event)"
              />
            </div>

            <!-- From date -->
            <div
              class="fp-date-pill"
              [class.active]="!!dateFrom()"
              (click)="openNativeDatePicker(fromInput)"
            >
              <svg
                class="w-3 h-3 shrink-0"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>{{
                dateFrom() ? formatDateLabel(dateFrom()!) : 'From'
              }}</span>
              <input
                #fromInput
                type="date"
                [value]="dateFrom() ?? ''"
                (change)="onDateFromChange($event)"
              />
            </div>

            <!-- To date -->
            <div
              class="fp-date-pill"
              [class.active]="!!dateTo()"
              (click)="openNativeDatePicker(toInput)"
            >
              <svg
                class="w-3 h-3 shrink-0"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>{{ dateTo() ? formatDateLabel(dateTo()!) : 'Until' }}</span>
              <input
                #toInput
                type="date"
                [value]="dateTo() ?? ''"
                [min]="dateFrom() ?? ''"
                (change)="onDateToChange($event)"
              />
            </div>

            <!-- Status -->
            <div class="relative">
              <button
                class="fp-btn"
                [class.active]="filters().status !== 'all'"
                [class.open]="openFilterId() === 'status'"
                (click)="toggleFilter('status')"
              >
                {{ statusLabel() }}
                <svg
                  class="fp-chevron"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              @if (openFilterId() === 'status') {
              <div class="fp-dropdown">
                @for (opt of statusOptions; track opt.value) {
                <button
                  class="fp-option"
                  [class.sel]="filters().status === opt.value"
                  (click)="setStatus(opt.value); closeFilter()"
                >
                  {{ opt.label }}
                  @if (filters().status === opt.value) {
                  <svg
                    class="fp-check"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  }
                </button>
                }
              </div>
              }
            </div>

            <!-- Format -->
            <div class="relative">
              <button
                class="fp-btn"
                [class.active]="filters().eventType !== 'all'"
                [class.open]="openFilterId() === 'type'"
                (click)="toggleFilter('type')"
              >
                {{ typeLabel() }}
                <svg
                  class="fp-chevron"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              @if (openFilterId() === 'type') {
              <div class="fp-dropdown">
                @for (opt of typeOptions; track opt.value) {
                <button
                  class="fp-option"
                  [class.sel]="filters().eventType === opt.value"
                  (click)="setEventType(opt.value); closeFilter()"
                >
                  {{ opt.label }}
                  @if (filters().eventType === opt.value) {
                  <svg
                    class="fp-check"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  }
                </button>
                }
              </div>
              }
            </div>

            <!-- Visibility -->
            <div class="relative">
              <button
                class="fp-btn"
                [class.active]="filters().visibility !== 'all'"
                [class.open]="openFilterId() === 'visibility'"
                (click)="toggleFilter('visibility')"
              >
                {{ visibilityLabel() }}
                <svg
                  class="fp-chevron"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              @if (openFilterId() === 'visibility') {
              <div class="fp-dropdown">
                @for (opt of visibilityOptions; track opt.value) {
                <button
                  class="fp-option"
                  [class.sel]="filters().visibility === opt.value"
                  (click)="setVisibility(opt.value); closeFilter()"
                >
                  {{ opt.label }}
                  @if (filters().visibility === opt.value) {
                  <svg
                    class="fp-check"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  }
                </button>
                }
              </div>
              }
            </div>

            <!-- Category -->
            @if (availableCategories().length > 0) {
            <div class="relative">
              <button
                class="fp-btn"
                [class.active]="filters().categoryId !== null"
                [class.open]="openFilterId() === 'category'"
                (click)="toggleFilter('category')"
              >
                {{ categoryLabel() }}
                <svg
                  class="fp-chevron"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              @if (openFilterId() === 'category') {
              <div class="fp-dropdown">
                <button
                  class="fp-option"
                  [class.sel]="filters().categoryId === null"
                  (click)="setCategory(''); closeFilter()"
                >
                  All Categories @if (filters().categoryId === null) {
                  <svg
                    class="fp-check"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  }
                </button>
                <div class="fp-sep"></div>
                @for (cat of availableCategories(); track cat.id) {
                <button
                  class="fp-option"
                  [class.sel]="filters().categoryId === cat.id"
                  (click)="setCategory(cat.id.toString()); closeFilter()"
                >
                  {{ cat.name }}
                  @if (filters().categoryId === cat.id) {
                  <svg
                    class="fp-check"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  }
                </button>
                }
              </div>
              }
            </div>
            }

            <!-- Clear -->
            @if (hasActiveFilters()) {
            <button
              (click)="clearFilters()"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
              style="font-family:var(--ff-mono);font-size:.6rem;letter-spacing:.08em;
                         text-transform:uppercase;color:var(--text-400);
                         border:1.5px solid var(--border);background:var(--bg)"
            >
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
              Clear
            </button>
            } @if (hasActiveFilters()) {
            <span
              style="font-family:var(--ff-mono);font-size:.58rem;letter-spacing:.1em;
                             text-transform:uppercase;color:var(--text-300);margin-left:auto"
            >
              {{ filteredEvents().length }} / {{ events().length }}
            </span>
            }
          </div>
        </div>
      </div>
      }

      <!-- ══════════════════════════════════════════
           MAIN CONTENT
      ══════════════════════════════════════════ -->
      <div class="max-w-screen-xl mx-auto px-5 sm:px-8 lg:px-12 py-7">
        <!-- LOADING -->
        @if (loading()) {
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
        >
          @for (i of [1,2,3,4,5,6,7,8,9,10]; track i) {
          <div
            class="skeleton skeleton-card"
            [style.animation-delay]="i * 45 + 'ms'"
          ></div>
          }
        </div>

        <!-- NO ORG -->
        } @else if (!orgId()) {
        <div
          class="flex flex-col items-center justify-center py-28 text-center gap-5"
        >
          <div
            class="empty-icon-wrap"
            style="background:rgba(249,115,22,.07);border:1.5px solid rgba(249,115,22,.2)"
          >
            <svg
              class="w-8 h-8"
              style="color:#f97316"
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
              style="font-family:var(--ff-head);font-size:1.25rem;font-weight:700;color:var(--text-900)"
            >
              No Organisation Found
            </p>
            <p class="mt-1" style="font-size:.875rem;color:var(--text-400)">
              Please log in with an organisation account to manage events.
            </p>
          </div>
        </div>

        <!-- EMPTY — no events -->
        } @else if (events().length === 0) {
        <div
          class="flex flex-col items-center justify-center py-28 text-center gap-6"
        >
          <div
            class="empty-icon-wrap"
            style="background:rgba(37,99,235,.06);border:1.5px solid rgba(37,99,235,.15)"
          >
            <svg
              class="w-9 h-9"
              style="color:rgba(37,99,235,.45)"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
          </div>
          <div>
            <p
              style="font-family:var(--ff-head);font-size:1.5rem;font-weight:700;color:var(--text-900)"
            >
              No Events Yet
            </p>
            <p
              class="mt-1"
              style="font-size:.875rem;color:var(--text-400);max-width:300px;
                                     margin-inline:auto;line-height:1.7"
            >
              Create your first event to start selling tickets and engaging your
              audience.
            </p>
          </div>
          <button class="btn-primary" (click)="openCreateModal()">
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create First Event
          </button>
        </div>

        <!-- EMPTY — filtered -->
        } @else if (filteredEvents().length === 0) {
        <div
          class="flex flex-col items-center justify-center py-24 text-center gap-5"
        >
          <div
            class="empty-icon-wrap"
            style="background:var(--bg-3);border:1.5px solid var(--border)"
          >
            <svg
              class="w-7 h-7"
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
          </div>
          <div>
            <p
              style="font-family:var(--ff-head);font-size:1.15rem;font-weight:700;color:var(--text-900)"
            >
              No Matches
            </p>
            <p class="mt-1" style="font-size:.82rem;color:var(--text-400)">
              Try adjusting your filters.
            </p>
          </div>
          <button
            (click)="clearFilters()"
            class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style="font-family:var(--ff-mono);letter-spacing:.08em;text-transform:uppercase;
                     color:var(--primary);border:1.5px solid rgba(37,99,235,.25);
                     background:var(--bg-3)"
          >
            Clear Filters
          </button>
        </div>

        <!-- ── CARD GRID ── -->
        } @else {
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
        >
          @for (event of filteredEvents(); track event.id; let i = $index) {

          <div
            class="event-card page-enter"
            [style.animation-delay]="i * 40 + 'ms'"
            (click)="openViewModal(event)"
          >
            <!-- Image -->
            @if (event.event_img_url) {
            <img
              [src]="event.event_img_url"
              [alt]="event.title"
              class="ec-img"
              (error)="onImgErr($event)"
            />
            } @else {
            <div class="ec-fallback" [style]="getGradient(event)">
              <div class="ec-fallback-pattern"></div>
              <svg
                class="w-10 h-10 relative z-10"
                style="color:rgba(37,99,235,.18)"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
            </div>
            }

            <!-- Overlay -->
            <div class="ec-overlay">
              <!-- Top row: status tags + 3-dot -->
              <div class="flex items-start justify-between gap-1.5">
                <div class="flex flex-col gap-1">
                  @if (isUpcoming(event)) {
                  <span class="ec-tag ec-tag--upcoming"
                    ><span class="dot"></span>Live</span
                  >
                  } @else {
                  <span class="ec-tag ec-tag--past">Ended</span>
                  } @if (event.event_location_type === EventLocationType.Online)
                  {
                  <span class="ec-tag ec-tag--online">Online</span>
                  } @else {
                  <span class="ec-tag ec-tag--inperson">In-Person</span>
                  }
                </div>

                <!-- 3-dot menu -->
                <div class="relative" (click)="$event.stopPropagation()">
                  <button class="dots-btn" (click)="toggleMenu(event.id)">
                    <span class="d"></span><span class="d"></span
                    ><span class="d"></span>
                  </button>
                  @if (openMenuId() === event.id) {
                  <div class="ctx-menu">
                    <button
                      class="ctx-item"
                      (click)="openViewModal(event); closeMenu()"
                    >
                      <svg
                        class="w-3.5 h-3.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      View Details
                    </button>
                    <button class="ctx-item" (click)="openEditModal(event)">
                      <svg
                        class="w-3.5 h-3.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit Event
                    </button>
                    <div class="ctx-sep"></div>
                    <button
                      class="ctx-item danger"
                      (click)="deleteEvent(event)"
                    >
                      <svg
                        class="w-3.5 h-3.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </button>
                  </div>
                  }
                </div>
              </div>

              <!-- Bottom: pills + date + title + meta -->
              <div>
                <div class="flex flex-wrap gap-1 mb-2">
                  @if (event.event_type === EventType.Public) {
                  <span class="ec-tag ec-tag--public">Public</span>
                  } @else {
                  <span class="ec-tag ec-tag--private">Private</span>
                  } @if (event.category?.name) {
                  <span class="ec-tag ec-tag--cat">{{
                    event.category?.name
                  }}</span>
                  }
                </div>

                <p class="ec-date">
                  {{ event.start_time | date : 'EEE · MMM d, y' | uppercase }}
                </p>

                <h3 class="ec-title">{{ event.title }}</h3>

                <div class="ec-meta">
                  <span class="ec-loc">
                    <svg
                      width="10"
                      height="10"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                      style="flex-shrink:0"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {{
                      event.event_location_type === EventLocationType.Online
                        ? 'Online'
                        : event.city || 'TBD'
                    }}
                  </span>
                  <span class="ec-cta">View →</span>
                </div>
              </div>
            </div>

            <div class="ec-glow"></div>
          </div>

          }
        </div>
        }
      </div>
    </div>

    <!-- ── Modals ── -->
    @if (showCreateModal()) {
    <app-create-event-modal
      (created)="onEventCreated()"
      (close)="showCreateModal.set(false)"
    />
    } @if (showEditModal() && selectedEvent()) {
    <app-edit-event-modal
      [event]="selectedEvent()!"
      (updated)="onEventUpdated($event)"
      (close)="showEditModal.set(false)"
    />
    } @if (showViewModal() && selectedEvent()) {
    <app-view-event-modal
      [event]="selectedEvent()!"
      (edit)="switchToEdit()"
      (close)="showViewModal.set(false)"
    />
    }
  `,
})
export class EventsPageComponent implements OnInit {
  private eventService = inject(EventService);
  private authService = inject(AuthService);
  private filterPipe = new FilterEventsPipe();

  readonly EventLocationType = EventLocationType;
  readonly EventType = EventType;

  events = signal<EventModel[]>([]);
  loading = signal(false);
  orgId = signal<number | null>(null);
  filters = signal<EventFilters>({ ...DEFAULT_FILTERS });
  dateFrom = signal<string | null>(null);
  dateTo = signal<string | null>(null);
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showViewModal = signal(false);
  selectedEvent = signal<EventModel | null>(null);
  openMenuId = signal<number | null>(null);
  openFilterId = signal<string | null>(null);

  readonly statusOptions: { value: EventStatusFilter; label: string }[] = [
    { value: 'all', label: 'All Status' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' },
  ];
  readonly typeOptions: { value: EventLocationFilter; label: string }[] = [
    { value: 'all', label: 'All Formats' },
    { value: 'online', label: 'Online' },
    { value: 'inperson', label: 'In-Person' },
  ];
  readonly visibilityOptions: {
    value: EventVisibilityFilter;
    label: string;
  }[] = [
    { value: 'all', label: 'All Events' },
    { value: 'public', label: 'Public' },
    { value: 'private', label: 'Private' },
  ];

  filteredEvents = computed(() => {
    const f: EventFilters = {
      ...this.filters(),
      dateFrom: this.dateFrom()
        ? new Date(this.dateFrom()! + 'T00:00:00')
        : null,
      dateTo: this.dateTo() ? new Date(this.dateTo()! + 'T23:59:59') : null,
    };
    return this.filterPipe.transform(this.events(), f);
  });

  statsCards = computed(() => {
    const now = new Date();
    const all = this.events();
    const up = all.filter((e) => new Date(e.start_time) > now).length;
    const pub = all.filter((e) => e.event_type === 0).length;
    const priv = all.filter((e) => e.event_type === 1).length;
    return [
      {
        label: 'Total',
        value: all.length,
        color: '#2563eb',
        bgColor: 'rgba(37,99,235,.1)',
        path: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      },
      {
        label: 'Upcoming',
        value: up,
        color: '#f97316',
        bgColor: 'rgba(249,115,22,.1)',
        path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        label: 'Public',
        value: pub,
        color: '#10b981',
        bgColor: 'rgba(16,185,129,.1)',
        path: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
      },
      {
        label: 'Private',
        value: priv,
        color: '#8b5cf6',
        bgColor: 'rgba(139,92,246,.1)',
        path: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
      },
    ];
  });

  statusLabel = computed(
    () =>
      this.statusOptions.find((o) => o.value === this.filters().status)
        ?.label ?? 'Status'
  );
  typeLabel = computed(
    () =>
      this.typeOptions.find((o) => o.value === this.filters().eventType)
        ?.label ?? 'Format'
  );
  visibilityLabel = computed(
    () =>
      this.visibilityOptions.find((o) => o.value === this.filters().visibility)
        ?.label ?? 'Visibility'
  );
  categoryLabel = computed(() => {
    const id = this.filters().categoryId;
    return id === null
      ? 'Category'
      : this.availableCategories().find((c) => c.id === id)?.name ?? 'Category';
  });
  availableCategories = computed<Category[]>(() => {
    const seen = new Map<number, string>();
    for (const e of this.events()) {
      if (e.categoryId && e.category?.name && !seen.has(e.categoryId))
        seen.set(e.categoryId, e.category.name);
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  });
  hasActiveFilters = computed(() => {
    const f = this.filters();
    return (
      f.search.trim() !== '' ||
      f.eventType !== 'all' ||
      f.visibility !== 'all' ||
      f.status !== 'all' ||
      f.categoryId !== null ||
      !!this.dateFrom() ||
      !!this.dateTo()
    );
  });

  ngOnInit() {
    const org = this.authService.getOrganization();
    if (org) {
      this.orgId.set(org.id);
      this.loadEvents(org.id);
    }
  }

  @HostListener('document:click')
  onDocumentClick() {
    if (this.openMenuId() !== null) this.openMenuId.set(null);
    if (this.openFilterId() !== null) this.openFilterId.set(null);
  }

  toggleFilter(id: string) {
    this.openFilterId.set(this.openFilterId() === id ? null : id);
  }
  closeFilter() {
    this.openFilterId.set(null);
  }
  closeMenu() {
    this.openMenuId.set(null);
  }

  setSearch(e: Event) {
    this.filters.update((f) => ({
      ...f,
      search: (e.target as HTMLInputElement).value,
    }));
  }
  setEventType(t: EventLocationFilter) {
    this.filters.update((f) => ({ ...f, eventType: t }));
  }
  setStatus(s: EventStatusFilter) {
    this.filters.update((f) => ({ ...f, status: s }));
  }
  setVisibility(v: EventVisibilityFilter) {
    this.filters.update((f) => ({ ...f, visibility: v }));
  }
  setCategory(v: string) {
    this.filters.update((f) => ({ ...f, categoryId: v ? Number(v) : null }));
  }
  onDateFromChange(e: Event) {
    this.dateFrom.set((e.target as HTMLInputElement).value || null);
  }
  onDateToChange(e: Event) {
    this.dateTo.set((e.target as HTMLInputElement).value || null);
  }
  clearFilters() {
    this.filters.set({ ...DEFAULT_FILTERS });
    this.dateFrom.set(null);
    this.dateTo.set(null);
  }
  formatDateLabel(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
  openNativeDatePicker(input: HTMLInputElement | null) {
    if (!input) return;
    const a = input as any;
    typeof a.showPicker === 'function'
      ? a.showPicker()
      : (input.focus(), input.click());
  }

  private loadEvents(orgId: number) {
    this.loading.set(true);
    this.eventService.getEventsByOrganization(orgId).subscribe({
      next: (d) => {
        this.events.set(d);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreateModal() {
    this.showCreateModal.set(true);
  }
  openViewModal(e: EventModel) {
    this.openMenuId.set(null);
    this.selectedEvent.set(e);
    this.showViewModal.set(true);
  }
  openEditModal(e: EventModel) {
    this.openMenuId.set(null);
    this.selectedEvent.set(e);
    this.showViewModal.set(false);
    this.showEditModal.set(true);
  }
  switchToEdit() {
    this.showViewModal.set(false);
    this.showEditModal.set(true);
  }
  onEventCreated() {
    this.showCreateModal.set(false);
    this.loadEvents(this.orgId()!);
  }
  onEventUpdated(u: EventModel) {
    this.showEditModal.set(false);
    this.events.update((l) => l.map((e) => (e.id === u.id ? u : e)));
    this.selectedEvent.set(u);
  }
  deleteEvent(event: EventModel) {
    this.openMenuId.set(null);
    if (!confirm(`Delete "${event.title}"?\n\nThis cannot be undone.`)) return;
    this.eventService.deleteEvent(event.id).subscribe({
      next: () => {
        this.events.update((l) => l.filter((e) => e.id !== event.id));
        toast.success('Event deleted');
      },
      error: () => toast.error('Failed to delete event'),
    });
  }

  toggleMenu(id: number) {
    this.openMenuId.set(this.openMenuId() === id ? null : id);
  }
  isUpcoming(e: EventModel) {
    return new Date(e.start_time) > new Date();
  }
  onImgErr(e: Event) {
    (e.target as HTMLImageElement).style.display = 'none';
  }
  getGradient(e: EventModel): string {
    const g = [
      'background:linear-gradient(160deg,#eef2ff 0%,#dbeafe 100%)',
      'background:linear-gradient(160deg,#f0fdf4 0%,#dcfce7 100%)',
      'background:linear-gradient(160deg,#faf5ff 0%,#ede9fe 100%)',
      'background:linear-gradient(160deg,#fff7ed 0%,#ffedd5 100%)',
      'background:linear-gradient(160deg,#f0f9ff 0%,#e0f2fe 100%)',
    ];
    return g[e.id % g.length];
  }
}
