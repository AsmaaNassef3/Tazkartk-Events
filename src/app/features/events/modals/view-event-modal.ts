// src/app/features/events/modals/view-event-modal.ts
// KEY FIX: EventLocationType.Online = 1 (backend). Template uses enum constants
// so it is automatically correct once event.model.ts is updated.
import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  Event as EventModel,
  EventLocationType,
  EventType,
} from '@core/models/event.model';

@Component({
  selector: 'app-view-event-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe],
  styles: [
    `
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
      :host {
        /* Light Mode Colors */
        --bg: #ffffff;
        --bg2: #f8faff;
        --primary: #2563eb;
        --primary-hover: #2159d4;
        --primary-active: #1e4fbc;
        --blue-dark: #1c4ab0;
        --orange: #f97316;
        --orange-dim: rgba(249, 115, 22, 0.1);
        --orange-brd: rgba(249, 115, 22, 0.25);
        --green: #10b981;
        --green-dim: rgba(16, 185, 129, 0.1);
        --green-brd: rgba(16, 185, 129, 0.25);
        --text-900: #0d2352;
        --text-700: #1e3a5f;
        --text-500: #475569;
        --text-400: #64748b;
        --text-300: #94a3b8;
        --border: #e2e8f0;
        --border-md: #cbd5e1;
        --shadow-sm: 0 1px 4px rgba(13, 35, 82, 0.06);
        --shadow-md: 0 4px 12px rgba(13, 35, 82, 0.08);
        --shadow-lg: 0 8px 28px rgba(13, 35, 82, 0.12);
      }
      @keyframes backdrop-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes modal-in {
        from {
          opacity: 0;
          transform: scale(0.96) translateY(20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      @keyframes fade-up {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes img-in {
        from {
          opacity: 0;
          transform: scale(1.05);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      .backdrop-in {
        animation: backdrop-in 0.25s ease both;
      }
      .modal-enter {
        animation: modal-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      .fade-up {
        animation: fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      .img-in {
        animation: img-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      .thin-scroll::-webkit-scrollbar {
        width: 4px;
      }
      .thin-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
      .thin-scroll::-webkit-scrollbar-thumb {
        background: var(--border-md);
        border-radius: 99px;
      }
      .tile {
        transition: all 0.18s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .tile:hover {
        transform: translateY(-2px);
        background: linear-gradient(
          135deg,
          var(--bg) 0%,
          rgba(37, 99, 235, 0.03) 100%
        ) !important;
        border-color: rgba(37, 99, 235, 0.2) !important;
      }
      .close-btn,
      .edit-btn {
        transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .edit-btn:hover {
        box-shadow: 0 8px 28px rgba(37, 99, 235, 0.35) !important;
        transform: translateY(-2px);
      }
      .join-link {
        transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .join-link:hover {
        opacity: 0.85;
        color: var(--primary-hover) !important;
      }
    `,
  ],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 backdrop-in"
      style="background:rgba(13,35,82,.12);backdrop-filter:blur(20px)"
      (click)="onClose()"
    >
      <div
        class="modal-enter relative w-full sm:max-w-[620px] max-h-[96dvh] sm:max-h-[90vh]
            flex flex-col overflow-hidden rounded-t-[28px] sm:rounded-[28px]"
        style="background:var(--bg);color:var(--text-700);border:1.5px solid var(--border);box-shadow:0 12px 40px rgba(13,35,82,.14)"
        (click)="$event.stopPropagation()"
      >
        <div
          class="relative shrink-0 overflow-hidden rounded-t-[28px]"
          style="height:240px"
        >
          @if (event().event_img_url) {
          <img
            [src]="event().event_img_url"
            [alt]="event().title"
            class="img-in absolute inset-0 w-full h-full object-cover"
            (error)="onImgErr($event)"
          />
          } @else {
          <div class="absolute inset-0" [style]="heroGradient()">
            <div
              class="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none"
            >
              <span
                style="font-family:Poppins,sans-serif;font-size:clamp(3rem,8vw,5rem);font-weight:800;letter-spacing:-.02em;color:transparent;-webkit-text-stroke:1px rgba(13,35,82,.08);white-space:nowrap;padding:0 2rem;line-height:1"
              >
                {{ event().title.toUpperCase() }}
              </span>
            </div>
          </div>
          }
          <div
            class="absolute inset-0 pointer-events-none"
            style="background:linear-gradient(to top,var(--bg) 0%,rgba(255,255,255,.7) 38%,transparent 72%)"
          ></div>
          <div
            class="absolute bottom-4 left-5 flex items-center gap-2 fade-up"
            style="animation-delay:.1s"
          >
            @if (isUpcoming()) {
            <span
              style="display:inline-flex;align-items:center;gap:6px;padding:6px 13px;border-radius:100px;font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;font-weight:700;background:var(--green-dim);color:var(--green);border:1.5px solid var(--green-brd)"
            >
              <span
                style="width:5px;height:5px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green);flex-shrink:0;display:inline-block"
              ></span
              >Upcoming
            </span>
            } @else {
            <span
              style="padding:6px 13px;border-radius:100px;font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;font-weight:700;background:rgba(100,116,139,.08);color:var(--text-400);border:1.5px solid rgba(100,116,139,.2)"
              >Ended</span
            >
            } @if (event().event_location_type === EventLocationType.Online) {
            <span
              style="padding:6px 13px;border-radius:100px;font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;font-weight:700;background:var(--orange-dim);color:var(--orange);border:1.5px solid var(--orange-brd)"
              >Online</span
            >
            } @else {
            <span
              style="padding:6px 13px;border-radius:100px;font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;font-weight:700;background:rgba(37,99,235,.08);color:var(--primary);border:1.5px solid rgba(37,99,235,.22)"
              >In-Person</span
            >
            }
          </div>
          <button
            class="close-btn absolute top-4 right-4 flex items-center justify-center"
            style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.9);backdrop-filter:blur(12px);border:1.5px solid var(--border);color:var(--text-500)"
            (click)="onClose()"
          >
            <svg
              style="width:15px;height:15px"
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

        <div class="flex-1 overflow-y-auto thin-scroll">
          <div
            style="padding:1.5rem;display:flex;flex-direction:column;gap:1.35rem"
          >
            <div
              class="fade-up"
              style="animation-delay:.05s;display:flex;flex-direction:column;gap:.4rem"
            >
              @if (event().category?.name) {
              <span
                style="font-family:var(--ff-mono);font-size:.62rem;letter-spacing:.16em;text-transform:uppercase;color:var(--primary);font-weight:700"
                >{{ event().category?.name }}</span
              >
              }
              <h2
                style="font-family:Poppins,sans-serif;font-size:clamp(2rem,6vw,2.8rem);font-weight:800;letter-spacing:-.02em;color:var(--text-900);margin:0;line-height:1.1"
              >
                {{ event().title }}
              </h2>
              @if (event().organization?.name) {
              <p
                style="font-size:.875rem;color:var(--text-400);display:flex;align-items:center;gap:5px;margin:0;font-weight:500"
              >
                <svg
                  style="width:12px;height:12px;flex-shrink:0"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                {{ event().organization?.name }}
              </p>
              }
            </div>

            @if (event().description) {
            <p
              class="fade-up"
              style="animation-delay:.08s;font-size:.9rem;color:var(--text-500);line-height:1.8;margin:0;font-weight:400"
            >
              {{ event().description }}
            </p>
            }
            <div style="height:1px;background:var(--border)"></div>

            <div
              class="fade-up"
              style="animation-delay:.12s;display:grid;grid-template-columns:1fr 1fr;gap:.7rem"
            >
              <div
                class="tile"
                style="grid-column:span 2;display:flex;align-items:flex-start;gap:.82rem;padding:1.1rem;border-radius:14px;background:linear-gradient(135deg,rgba(37,99,235,.04) 0%,rgba(37,99,235,.02) 100%);border:1.5px solid var(--border)"
              >
                <div
                  style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:linear-gradient(135deg,rgba(37,99,235,.12) 0%,rgba(37,99,235,.08) 100%);border:1.5px solid rgba(37,99,235,.22)"
                >
                  <svg
                    style="width:16px;height:16px;color:var(--primary)"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div style="min-width:0">
                  <p
                    style="font-family:var(--ff-mono);font-size:.59rem;letter-spacing:.16em;text-transform:uppercase;color:var(--text-400);margin:0 0 6px;font-weight:700"
                  >
                    Date &amp; Time
                  </p>
                  <p
                    style="font-size:.95rem;font-weight:700;color:var(--text-900);margin:0;font-family:Poppins,sans-serif"
                  >
                    {{ event().start_time | date : 'EEE, MMM d, y' }}
                  </p>
                  <p
                    style="font-size:.8rem;color:var(--text-400);margin:2px 0 0;font-weight:500"
                  >
                    {{ event().start_time | date : 'h:mm a' }}
                    @if (event().end_time) { &nbsp;–&nbsp;
                    {{ event().end_time | date : 'h:mm a' }} }
                  </p>
                </div>
              </div>

              <div
                class="tile"
                style="grid-column:span 2;display:flex;align-items:flex-start;gap:.82rem;padding:1.1rem;border-radius:14px;border:1.5px solid var(--border)"
                [style.background]="
                  event().event_location_type === EventLocationType.Online
                    ? 'linear-gradient(135deg,rgba(249,115,22,.04) 0%,rgba(249,115,22,.02) 100%)'
                    : 'linear-gradient(135deg,rgba(37,99,235,.04) 0%,rgba(37,99,235,.02) 100%)'
                "
                [style.borderColor]="
                  event().event_location_type === EventLocationType.Online
                    ? 'rgba(249,115,22,.22)'
                    : 'rgba(37,99,235,.22)'
                "
              >
                <div
                  style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1.5px solid"
                  [style.background]="
                    event().event_location_type === EventLocationType.Online
                      ? 'rgba(249,115,22,.12)'
                      : 'rgba(37,99,235,.12)'
                  "
                  [style.borderColor]="
                    event().event_location_type === EventLocationType.Online
                      ? 'rgba(249,115,22,.22)'
                      : 'rgba(37,99,235,.22)'
                  "
                >
                  @if (event().event_location_type === EventLocationType.Online)
                  {
                  <svg
                    style="width:16px;height:16px;color:var(--orange)"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  } @else {
                  <svg
                    style="width:16px;height:16px;color:var(--primary)"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    viewBox="0 0 24 24"
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
                  }
                </div>
                <div style="min-width:0;flex:1">
                  <p
                    style="font-family:var(--ff-mono);font-size:.59rem;letter-spacing:.16em;text-transform:uppercase;color:var(--text-400);margin:0 0 6px;font-weight:700"
                  >
                    {{
                      event().event_location_type === EventLocationType.Online
                        ? 'Meeting Link'
                        : 'Location'
                    }}
                  </p>
                  @if (event().event_location_type === EventLocationType.Online)
                  { @if (event().online_url) {
                  <a
                    [href]="event().online_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="join-link"
                    style="font-size:.9rem;font-weight:700;color:var(--orange);display:inline-flex;align-items:center;gap:6px;text-decoration:none"
                  >
                    Join Meeting
                    <svg
                      style="width:12px;height:12px"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                  } @else {
                  <p style="font-size:.87rem;color:var(--text-400);margin:0">
                    No link provided yet
                  </p>
                  } } @else {
                  <p
                    style="font-size:.95rem;font-weight:700;color:var(--text-900);margin:0;font-family:Poppins,sans-serif"
                  >
                    {{ event().city }}@if (event().region) {,
                    {{ event().region }}}
                  </p>
                  @if (event().nameOfPlace || event().street) {
                  <p
                    style="font-size:.8rem;color:var(--text-400);margin:2px 0 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500"
                  >
                    {{ event().nameOfPlace }}@if (event().street) {
                    &nbsp;·&nbsp; {{ event().street }}}
                  </p>
                  } }
                </div>
              </div>

              @if (event().event_type !== undefined) {
              <div
                class="tile"
                style="display:flex;align-items:center;gap:.7rem;padding:.95rem 1.1rem;border-radius:14px;background:linear-gradient(135deg,rgba(139,92,246,.04) 0%,rgba(139,92,246,.02) 100%);border:1.5px solid rgba(139,92,246,.2)"
              >
                <div
                  style="width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:rgba(139,92,246,.12);border:1.5px solid rgba(139,92,246,.22)"
                >
                  <svg
                    style="width:15px;height:15px;color:#8b5cf6"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </div>
                <div>
                  <p
                    style="font-family:var(--ff-mono);font-size:.57rem;letter-spacing:.14em;text-transform:uppercase;color:var(--text-400);margin:0 0 4px;font-weight:700"
                  >
                    Type
                  </p>
                  <p
                    style="font-size:.9rem;font-weight:700;color:var(--text-900);margin:0;font-family:Poppins,sans-serif"
                  >
                    {{
                      event().event_type === EventType.Public
                        ? 'Public'
                        : 'Private'
                    }}
                  </p>
                </div>
              </div>
              } @if (event().category?.name) {
              <div
                class="tile"
                style="display:flex;align-items:center;gap:.7rem;padding:.95rem 1.1rem;border-radius:14px;background:linear-gradient(135deg,rgba(249,115,22,.04) 0%,rgba(249,115,22,.02) 100%);border:1.5px solid rgba(249,115,22,.2)"
              >
                <div
                  style="width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:rgba(249,115,22,.12);border:1.5px solid rgba(249,115,22,.22)"
                >
                  <svg
                    style="width:15px;height:15px;color:var(--orange)"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                </div>
                <div>
                  <p
                    style="font-family:var(--ff-mono);font-size:.57rem;letter-spacing:.14em;text-transform:uppercase;color:var(--text-400);margin:0 0 4px;font-weight:700"
                  >
                    Category
                  </p>
                  <p
                    style="font-size:.9rem;font-weight:700;color:var(--orange);margin:0;font-family:Poppins,sans-serif"
                  >
                    {{ event().category?.name }}
                  </p>
                </div>
              </div>
              }
            </div>
          </div>
        </div>

        <div
          style="flex-shrink:0;padding:1.1rem 1.5rem;border-top:1.5px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:.75rem;background:linear-gradient(135deg,var(--bg) 0%,rgba(37,99,235,.02) 100%);backdrop-filter:blur(12px)"
        >
          <button
            (click)="onClose()"
            style="padding:.7rem 1.4rem;border-radius:10px;font-family:Poppins,sans-serif;font-size:.87rem;font-weight:600;color:var(--text-500);background:var(--bg);border:1.5px solid var(--border);cursor:pointer;transition:all .2s"
            onmouseenter="this.style.color=getComputedStyle(document.documentElement).getPropertyValue('--text-900').trim();this.style.background='linear-gradient(135deg,rgba(37,99,235,.04) 0%,rgba(37,99,235,.02) 100%)';this.style.borderColor='rgba(37,99,235,.2)'"
            onmouseleave="this.style.color='';this.style.background='';this.style.borderColor=''"
          >
            Close
          </button>
          <button
            class="edit-btn"
            (click)="onEdit()"
            style="display:inline-flex;align-items:center;gap:8px;padding:.75rem 1.6rem;border-radius:10px;font-family:Poppins,sans-serif;font-weight:700;font-size:.9rem;color:#fff;background:linear-gradient(135deg,var(--primary) 0%,var(--primary-hover) 100%);border:none;cursor:pointer;box-shadow:0 6px 20px rgba(37,99,235,.35);position:relative;overflow:hidden;letter-spacing:-.01em"
          >
            <span
              style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.16) 0%,transparent 55%);pointer-events:none"
            ></span>
            <svg
              style="width:14px;height:14px;position:relative;z-index:1"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span style="position:relative;z-index:1">Edit Event</span>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ViewEventModalComponent {
  event = input.required<EventModel>();
  edit = output<void>();
  close = output<void>();

  readonly EventLocationType = EventLocationType;
  readonly EventType = EventType;

  isUpcoming(): boolean {
    return new Date(this.event().start_time) > new Date();
  }

  heroGradient(): string {
    const g = [
      'background:linear-gradient(135deg,#eef2ff 0%,#dbeafe 100%)',
      'background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%)',
      'background:linear-gradient(135deg,#faf5ff 0%,#ede9fe 100%)',
      'background:linear-gradient(135deg,#fff7ed 0%,#ffedd5 100%)',
      'background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%)',
    ];
    return g[this.event().id % g.length];
  }

  onImgErr(e: Event): void {
    (e.target as HTMLImageElement).style.display = 'none';
  }
  onEdit(): void {
    this.edit.emit();
  }
  onClose(): void {
    this.close.emit();
  }
}
