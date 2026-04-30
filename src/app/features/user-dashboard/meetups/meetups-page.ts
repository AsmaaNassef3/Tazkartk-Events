// src/app/features/user-dashboard/meetups/meetups-page.ts
import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of, forkJoin } from 'rxjs'; // ← added forkJoin
import { catchError, takeUntil } from 'rxjs/operators';
import { MeetupService } from '@core/services/meetup.service';
import { AuthService } from '@core/services/auth.service';
import { Meetup, MeetupLocationType } from '@core/models/meetup.model';

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-EG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
function fmtTime(iso?: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
function isUpcoming(iso?: string | null): boolean {
  return !!iso && new Date(iso) > new Date();
}

/** Returns the participant count, preferring the flat DTO field when present. */
function attendeeCount(m: Meetup): number {
  if (m.currentAttendees !== undefined) return m.currentAttendees;
  return (m.participants ?? []).length;
}

type TabFilter = 'all' | 'upcoming' | 'online' | 'offline';

interface CreateMeetupForm {
  title: string;
  description: string;
  start_Time: string;
  end_Time: string;
  meetup_location_type: MeetupLocationType;
  online_url: string;
  maxAttendees: string;
  meetup_img_url: string;
}

@Component({
  selector: 'app-meetups-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />

    <div
      class="min-h-screen bg-white text-[#0d2352] font-[Plus_Jakarta_Sans,sans-serif]"
    >
      <!-- ── HERO ── -->
      <header
        class="relative overflow-hidden px-4 pt-8 pb-6 sm:px-6 md:px-10 md:pt-12 md:pb-8"
      >
        <div
          class="pointer-events-none absolute -top-36 -right-20 w-80 h-80 md:w-96 md:h-96 rounded-full"
          style="background:radial-gradient(circle,rgba(37,99,235,.12) 0%,transparent 65%)"
        ></div>
        <div
          class="pointer-events-none absolute -bottom-20 -left-12 w-56 h-56 rounded-full"
          style="background:radial-gradient(circle,rgba(37,99,235,.08) 0%,transparent 65%)"
        ></div>

        <div class="relative z-10  mx-auto">
          <div class="flex items-center justify-between gap-4 mb-3">
            <div class="flex gap-2">
              <span
                class="inline-flex items-center px-3 py-0.5 rounded-full font-[DM_Mono,monospace]
                           text-[0.58rem] tracking-widest uppercase font-bold
                           bg-blue-500/12 border border-blue-400/45 text-blue-700"
                >Community</span
              >
              <span
                class="inline-flex items-center px-3 py-0.5 rounded-full font-[DM_Mono,monospace]
                           text-[0.58rem] tracking-widest uppercase font-bold
                           bg-slate-100 border border-[#CBD5E1] text-slate-600"
                >Meetups</span
              >
            </div>
           
          </div>
          <h1
            style="font-family:'Bebas Neue',sans-serif;font-size:clamp(2.8rem,11vw,7rem);line-height:.88;letter-spacing:.03em;color:var(--text-900);margin:0"
          >
            Discover<br />
            <span
              style="color:transparent;-webkit-text-stroke:2px var(--primary)"
              >Meetups</span
            >
          </h1>
          <p class="text-sm text-slate-500 font-light leading-relaxed max-w-md">
            Community-led gatherings — find one that fits and join in.
          </p>
        </div>
      </header>

      <!-- ── FILTER TABS ── -->
      <div
        class="mx-auto px-4 sm:px-6 md:px-10 pb-4
                  flex flex-wrap items-center justify-between gap-3"
      >
        <div class="flex flex-wrap gap-1.5" role="tablist">
          @for (tab of tabs; track tab.value) {
          <button
            class="px-3 py-1.5 rounded-full text-[0.78rem] font-bold border
                     transition-all duration-200 cursor-pointer"
            [class]="
              activeTab() === tab.value
                ? 'bg-blue-500/12 border-blue-400/45 text-blue-700 font-bold'
                : 'bg-slate-50 border-[#E2E8F0] text-slate-600 hover:border-blue-300 hover:text-blue-600'
            "
            role="tab"
            [attr.aria-selected]="activeTab() === tab.value"
            (click)="setTab(tab.value)"
          >
            {{ tab.label }}
          </button>
          }
        </div>
        <span
          class="font-[DM_Mono,monospace] text-[0.6rem] tracking-widest text-slate-500 font-bold
                     px-3 py-1 rounded-full bg-slate-50 border border-[#E2E8F0]"
        >
          {{ filtered().length }} meetup{{ filtered().length !== 1 ? 's' : '' }}
        </span>
      </div>

      <div class=" mx-auto px-4 sm:px-6 md:px-10 pb-16">
        <!-- ── LOADING ── -->
        @if (loading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (n of skeletons; track n) {
          <div
            class="h-72 rounded-2xl skeleton-shimmer"
            [style.animation-delay]="n * 60 + 'ms'"
          ></div>
          }
        </div>
        }

        <!-- ── ERROR ── -->
        @else if (error()) {
        <div class="flex flex-col items-center gap-3 py-24 text-center">
          <span class="text-4xl">⚠</span>
          <p class="font-[Bebas_Neue,sans-serif] text-2xl tracking-wide">
            Couldn't load meetups
          </p>
          <button
            class="mt-2 px-6 py-2.5 rounded-xl bg-green-400 text-[#052e12]
                           font-bold text-sm cursor-pointer"
            (click)="load()"
          >
            Retry
          </button>
        </div>
        }

        <!-- ── EMPTY ── -->
        @else if (filtered().length === 0) {
        <div class="flex flex-col items-center gap-4 py-24 text-center">
          <div
            class="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center"
          >
            <svg
              width="32"
              height="32"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              viewBox="0 0 24 24"
              class="text-blue-400"
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
              class="font-[Bebas_Neue,sans-serif] text-2xl tracking-wide text-slate-800 font-bold"
            >
              No meetups found
            </p>
            <p class="mt-2 text-sm text-slate-500 font-light">
              Try adjusting your filters or create your own meetup!
            </p>
          </div>
        </div>
        }

        <!-- ── GRID ── -->
        @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (m of filtered(); track m.id; let i = $index) {
          <article
            class="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden
                       transition-all duration-250 hover:border-blue-300 hover:shadow-md
                       hover:-translate-y-1 card-in"
            [style.animation-delay]="i * 45 + 'ms'"
          >
            <!-- Image -->
            <div class="relative aspect-video overflow-hidden bg-slate-100">
              @if (m.meetup_img_url) {
              <img
                [src]="m.meetup_img_url"
                [alt]="m.title ?? ''"
                loading="lazy"
                class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              } @else {
              <div class="w-full h-full flex items-center justify-center">
                <svg
                  width="40"
                  height="40"
                  fill="none"
                  stroke="currentColor"
                  stroke-width=".7"
                  viewBox="0 0 24 24"
                  class="opacity-20 text-[#0d2352]"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857
                                 M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857
                                 m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              }

              <!-- Location badge -->
              <span
                class="absolute top-3 left-3 px-3 py-1 rounded-lg
                               font-[DM_Mono,monospace] text-[0.58rem] tracking-widest uppercase font-bold
                               bg-white/85 backdrop-blur-sm border border-white/40"
                [class]="
                  m.meetup_location_type === 1
                    ? 'text-blue-700 bg-blue-50/90'
                    : 'text-slate-700 bg-slate-50/90'
                "
              >
                {{
                  m.meetup_location_type === 1 ? '🌐 Online' : '📍 In-Person'
                }}
              </span>

              <!-- Upcoming pulse dot -->
              @if (isUpcoming(m.start_Time)) {
              <span class="absolute top-3 right-3 flex h-2.5 w-2.5">
                <span
                  class="animate-ping absolute inline-flex h-full w-full
                                   rounded-full bg-blue-500 opacity-75"
                ></span>
                <span
                  class="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"
                ></span>
              </span>
              }
            </div>

            <!-- Body -->
            <div class="p-5 flex flex-col gap-3">
              @if (m.category?.name) {
              <div
                class="font-[DM_Mono,monospace] text-[0.58rem] tracking-widest
                                uppercase text-blue-600 font-bold"
              >
                {{ m.category!.name }}
              </div>
              }

              <h2
                class="font-[Bebas_Neue,sans-serif] text-lg leading-snug tracking-wide
                             text-[#0d2352] line-clamp-2 font-bold"
              >
                {{ m.title }}
              </h2>

              <div class="flex flex-col gap-2">
                @if (m.start_Time) {
                <div
                  class="flex items-center gap-2 text-[0.73rem] text-slate-700 font-medium"
                >
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                    viewBox="0 0 24 24"
                    class="shrink-0 text-blue-500"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {{ fmtDate(m.start_Time) }} · {{ fmtTime(m.start_Time) }}
                </div>
                } @if (m.nameOfPlace || m.city) {
                <div
                  class="flex items-center gap-2 text-[0.73rem] text-slate-700 font-medium"
                >
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                    viewBox="0 0 24 24"
                    class="shrink-0 text-green-500"
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
                  {{ m.nameOfPlace || m.city }}
                </div>
                } @if (m.manager?.firstName) {
                <div
                  class="flex items-center gap-2 text-[0.73rem] text-slate-600 font-medium"
                >
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                    viewBox="0 0 24 24"
                    class="shrink-0 text-slate-400"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span class="truncate"
                    >{{ m.manager!.firstName }}
                    {{
                      m.manager!.lastName ? ' ' + m.manager!.lastName : ''
                    }}</span
                  >
                </div>
                }
              </div>

              <!-- Footer: attendee count + join button -->
              <div
                class="flex items-center justify-between gap-3 mt-auto pt-3 border-t border-slate-100"
              >
                <span
                  class="font-[DM_Mono,monospace] text-[0.6rem] tracking-wide text-slate-600 font-medium"
                >
                  {{ attendeeCount(m) }}/{{ m.maxAttendees || '∞' }}
                </span>

                <!-- Join / Already Joined / Full -->
                @if (isJoined(m)) {
                <span
                  class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full
                                   text-[0.75rem] font-bold
                                   bg-emerald-50 border border-emerald-200 text-emerald-700"
                >
                  <svg
                    width="12"
                    height="12"
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
                  Joined
                </span>
                } @else if (m.isFull) {
                <span
                  class="px-3.5 py-1.5 rounded-full text-[0.75rem] font-bold
                                   border border-slate-300 text-slate-600 bg-slate-50"
                  >Full</span
                >
                } @else {
                <button
                  class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full
                               text-[0.75rem] font-bold
                               border border-blue-300 text-blue-700 bg-blue-50
                               hover:bg-blue-100 hover:border-blue-400 transition-colors duration-200
                               disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  [disabled]="joiningId() === m.id"
                  (click)="join(m)"
                >
                  @if (joiningId() === m.id) {
                  <span
                    class="w-3 h-3 rounded-full border-2 border-blue-300/40
                                       border-t-blue-600 animate-spin inline-block"
                  ></span>
                  } @else {
                  <svg
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Join }
                </button>
                }
              </div>
            </div>
          </article>
          }
        </div>
        }
      </div>

      <!-- ── TOAST ── -->
      @if (toast()) {
      <div
        class="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl
                    text-[0.82rem] font-semibold whitespace-nowrap z-50 toast-in"
        [class]="
          toast()!.type === 'error'
            ? 'bg-[#FF4433]/12 border border-[#FF4433]/30 text-[#FF4433]'
            : 'bg-blue-500/12 border border-blue-400/45 text-blue-700'
        "
        role="status"
        aria-live="polite"
      >
        {{ toast()!.msg }}
      </div>
      }

      <!-- ── CREATE MEETUP MODAL ── -->
      @if (showCreateModal()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-white/50 p-4 overflow-y-auto"
        (click)="closeCreateModal()"
      >
        <div
          class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 space-y-5 my-8"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between mb-6">
            <h2
              class="font-[Bebas_Neue,sans-serif] text-3xl text-[#0d2352] font-bold tracking-wide"
            >
              CREATE MEETUP
            </h2>
            <button
              (click)="closeCreateModal()"
              class="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg
                width="24"
                height="24"
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
            </button>
          </div>

          <div class="space-y-4">
            <!-- Title -->
            <div>
              <label
                class="block text-[0.75rem] font-bold text-[#0d2352] mb-2 tracking-wider"
              >
                Title <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                [(ngModel)]="createForm.title"
                placeholder="React Developers Meetup"
                class="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] text-[0.95rem]
                           focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20
                           bg-[#F8FAFF]"
              />
            </div>

            <!-- Description -->
            <div>
              <label
                class="block text-[0.75rem] font-bold text-[#0d2352] mb-2 tracking-wider"
              >
                Description
              </label>
              <textarea
                [(ngModel)]="createForm.description"
                placeholder="Monthly gathering for React developers in Cairo to share knowledge and network."
                class="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] text-[0.95rem] resize-none
                           focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20
                           bg-[#F8FAFF]"
                rows="3"
              ></textarea>
            </div>

            <!-- Start & End Times -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-[0.75rem] font-bold text-[#0d2352] mb-2 tracking-wider"
                >
                  Start <span class="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  [(ngModel)]="createForm.start_Time"
                  class="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] text-[0.95rem]
                             focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20
                             bg-[#F8FAFF]"
                />
              </div>
              <div>
                <label
                  class="block text-[0.75rem] font-bold text-[#0d2352] mb-2 tracking-wider"
                >
                  End <span class="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  [(ngModel)]="createForm.end_Time"
                  class="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] text-[0.95rem]
                             focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20
                             bg-[#F8FAFF]"
                />
              </div>
            </div>

            <!-- Location Type -->
            <div>
              <label
                class="block text-[0.75rem] font-bold text-[#0d2352] mb-2 tracking-wider"
              >
                Location type
              </label>
              <select
                [(ngModel)]="createForm.meetup_location_type"
                class="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] text-[0.95rem]
                           focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20
                           bg-[#F8FAFF]"
              >
                <option [value]="1">Online</option>
                <option [value]="0">In-Person</option>
              </select>
            </div>

            <!-- Online URL -->
            <div>
              <label
                class="block text-[0.75rem] font-bold text-[#0d2352] mb-2 tracking-wider"
              >
                Online URL
              </label>
              <input
                type="url"
                [(ngModel)]="createForm.online_url"
                placeholder="https://zoom.com"
                class="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] text-[0.95rem]
                           focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20
                           bg-[#F8FAFF]"
              />
            </div>

            <!-- Max Attendees & Image URL -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-[0.75rem] font-bold text-[#0d2352] mb-2 tracking-wider"
                >
                  Max attendees
                </label>
                <select
                  [(ngModel)]="createForm.maxAttendees"
                  class="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] text-[0.95rem]
                             focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20
                             bg-[#F8FAFF]"
                >
                  <option value="">Unlimited</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                </select>
              </div>
              <div>
                <label
                  class="block text-[0.75rem] font-bold text-[#0d2352] mb-2 tracking-wider"
                >
                  Image URL
                </label>
                <input
                  type="url"
                  [(ngModel)]="createForm.meetup_img_url"
                  placeholder="https://images.unsplash.com/photo-..."
                  class="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] text-[0.95rem]
                             focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20
                             bg-[#F8FAFF]"
                />
              </div>
            </div>

            <!-- Buttons -->
            <div class="flex gap-3 justify-end pt-4">
              <button
                class="px-6 py-2.5 rounded-lg text-[0.9rem] font-bold
                           border border-[#E2E8F0] text-slate-600
                           hover:bg-slate-50 transition-colors duration-200 cursor-pointer"
                (click)="closeCreateModal()"
              >
                Cancel
              </button>
              <button
                class="px-6 py-2.5 rounded-lg text-[0.9rem] font-bold
                           border border-blue-400/45 text-blue-700 bg-blue-500/12
                           hover:bg-blue-500/20 transition-all duration-200 cursor-pointer
                           disabled:opacity-50 disabled:cursor-not-allowed"
                [disabled]="!createForm.title || !createForm.start_Time"
                (click)="createMeetup()"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      @keyframes cardIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      @keyframes toastIn {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
      @keyframes shimmer {
        from {
          background-position: -600px 0;
        }
        to {
          background-position: 600px 0;
        }
      }
      .card-in {
        animation: cardIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      .toast-in {
        animation: toastIn 0.3s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .skeleton-shimmer {
        background: linear-gradient(
          90deg,
          #eef2ff 25%,
          #e8eeff 50%,
          #eef2ff 75%
        );
        background-size: 600px 100%;
        animation: shimmer 1.5s ease-in-out infinite;
      }
    `,
  ],
})
export class MeetupsPage implements OnInit, OnDestroy {
  private readonly svc = inject(MeetupService);
  private readonly auth = inject(AuthService);
  private readonly destroy$ = new Subject<void>();

  meetups = signal<Meetup[]>([]);
  loading = signal(true);
  error = signal(false);
  activeTab = signal<TabFilter>('all');
  joiningId = signal<number | null>(null);
  toast = signal<{ msg: string; type: 'success' | 'error' } | null>(null);
  showCreateModal = signal(false);

  /**
   * Seeded on load from getJoinedByUser() so "Already Joined" shows correctly
   * even on a fresh page visit. Optimistically extended after a successful join.
   */
  joinedIds = signal<Set<number>>(new Set());

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  createForm: CreateMeetupForm = {
    title: '',
    description: '',
    start_Time: '',
    end_Time: '',
    meetup_location_type: MeetupLocationType.Online,
    online_url: '',
    maxAttendees: '',
    meetup_img_url: '',
  };

  readonly skeletons = Array.from({ length: 6 }, (_, i) => i);
  readonly fmtDate = fmtDate;
  readonly fmtTime = fmtTime;
  readonly isUpcoming = isUpcoming;
  readonly attendeeCount = attendeeCount;

  readonly tabs: { label: string; value: TabFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Online', value: 'online' },
    { label: 'In-Person', value: 'offline' },
  ];

  filtered = computed(() => {
    const tab = this.activeTab();
    const list = this.meetups();
    switch (tab) {
      case 'upcoming':
        return list.filter((m) => isUpcoming(m.start_Time));
      case 'online':
        return list.filter(
          (m) => m.meetup_location_type === MeetupLocationType.Online
        );
      case 'offline':
        return list.filter(
          (m) => m.meetup_location_type === MeetupLocationType.Offline
        );
      default:
        return list;
    }
  });

  ngOnInit() {
    this.load();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  setTab(t: TabFilter) {
    this.activeTab.set(t);
  }

  load() {
    this.loading.set(true);
    this.error.set(false);

    const userId = this.auth.getUserProfile()?.id;

    // ── Fetch all meetups + the user's joined meetups in parallel ──────────
    // AllDetails never returns a participants array, so we can't derive
    // joined state from it. getJoinedByUser() gives us the ground truth.
    const joined$ = userId
      ? this.svc
          .getJoinedByUser(userId)
          .pipe(catchError(() => of([] as Meetup[])))
      : of([] as Meetup[]);

    forkJoin([
      this.svc
        .getAllMeetupsWithIds()
        .pipe(catchError(() => of([] as Meetup[]))),
      joined$,
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([allMeetups, joinedMeetups]) => {
          if (!allMeetups.length && !joinedMeetups.length) {
            // Treat a double-empty as a possible network error only if
            // getAllMeetupsWithIds failed (we can't tell here, so just show empty).
          }

          this.meetups.set(allMeetups);

          // Seed joinedIds from the dedicated joined-by-user endpoint
          const joinedSet = new Set<number>(joinedMeetups.map((m) => m.id));
          this.joinedIds.set(joinedSet);

          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  isJoined(m: Meetup): boolean {
    return this.joinedIds().has(m.id);
  }

  join(m: Meetup): void {
    if (!m.id || this.joiningId() !== null) return;

    this.joiningId.set(m.id);

    this.svc
      .joinMeetup(m.id)
      .pipe(
        catchError((err) => {
          this.showToast(
            err?.error?.message ?? 'Failed to join. Please try again.',
            'error'
          );
          this.joiningId.set(null);
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (!res) return; // null from catchError — already handled

        this.joiningId.set(null);

        // Optimistic: mark joined + increment currentAttendees
        this.joinedIds.update((s) => new Set([...s, m.id]));
        this.meetups.update((list) =>
          list.map((item) =>
            item.id === m.id
              ? { ...item, currentAttendees: (item.currentAttendees ?? 0) + 1 }
              : item
          )
        );
        this.showToast(`You joined "${m.title}"! 🎉`, 'success');
      });
  }

  private showToast(msg: string, type: 'success' | 'error') {
    this.toast.set({ msg, type });
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3200);
  }

  openCreateModal() {
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
    this.resetCreateForm();
  }

  resetCreateForm() {
    this.createForm = {
      title: '',
      description: '',
      start_Time: '',
      end_Time: '',
      meetup_location_type: MeetupLocationType.Online,
      online_url: '',
      maxAttendees: '',
      meetup_img_url: '',
    };
  }

  createMeetup() {
    if (!this.createForm.title || !this.createForm.start_Time) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }

    const userId = this.auth.getUserProfile()?.id;
    if (!userId) {
      this.showToast('You must be logged in to create a meetup', 'error');
      return;
    }

    // Build the create DTO
    const createDto = {
      title: this.createForm.title,
      description: this.createForm.description || null,
      start_Time: new Date(this.createForm.start_Time).toISOString(),
      end_Time: this.createForm.end_Time
        ? new Date(this.createForm.end_Time).toISOString()
        : new Date(this.createForm.start_Time).toISOString(),
      meetup_location_type: this.createForm.meetup_location_type,
      online_url: this.createForm.online_url || null,
      max_Participants: this.createForm.maxAttendees
        ? Number(this.createForm.maxAttendees)
        : null,
      meetup_img_url: this.createForm.meetup_img_url || null,
      managerId: userId,
      categoryId: 1, // Default category, can be enhanced later
    };

    // Call API to create meetup
    this.svc
      .createMeetup(createDto)
      .pipe(
        catchError((err) => {
          this.showToast(
            err?.error?.message ?? 'Failed to create meetup. Please try again.',
            'error'
          );
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (!res) return; // Error handled in catchError

        this.showToast(
          `Meetup "${this.createForm.title}" created successfully! 🎉`,
          'success'
        );
        this.closeCreateModal();

        // Reload meetups to show the new one
        this.load();
      });
  }
}
