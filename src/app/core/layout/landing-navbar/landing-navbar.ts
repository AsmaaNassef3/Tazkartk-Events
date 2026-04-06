// src/app/core/layout/landing-navbar/landing-navbar.ts
import { Component, inject, HostListener, signal } from '@angular/core';
import { ZardDialogService } from '@shared/components/dialog/dialog.service';
import { AuthDialog } from '@features/auth/auth-dialog/auth-dialog';

@Component({
  selector: 'app-landing-navbar',
  standalone: true,
  imports: [],
  template: `
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />

    <nav class="es-nav" [class.es-nav--scrolled]="scrolled()">
      <div class="es-nav__inner max-w-screen-xl mx-auto px-5 sm:px-8 lg:px-12">
        <!-- Logo with Image -->
        <a href="/" class="es-nav__logo">
          <img
            src="/images/Screenshot 2026-04-03 at 9.36.04 PM.png"
            alt="Tazkartk Logo"
            class="es-nav__logo-img "
          />
          <span class="es-nav__logo-text">Tazkartk</span>
        </a>

        <!-- Right Side -->
        <div class="es-nav__right">
          <button class="es-nav__cta" (click)="openGetStartedDialog()">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  `,
  styles: [
    `
      :host {
        --coral: #ff4433;
        --primary: #1c4ab0;
        --text: #0f172a;
        --muted: #64748b;
        --bg: #ffffff;
        --border: #e2e8f0;
        --fd: 'Poppins', sans-serif;
        display: block;
      }

      .es-nav {
        width: 100%;
        padding: 1rem 0;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid transparent;
        transition: all 0.3s ease;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 50;
      }

      .es-nav--scrolled {
        border-bottom-color: var(--border);
        box-shadow: 0 2px 8px rgba(28, 74, 176, 0.1);
        padding: 0.75rem 0;
      }

      .es-nav__inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .es-nav__logo {
        display: flex;
        align-items: center;
        gap: 12px;
        text-decoration: none;
        transition: opacity 0.2s ease;
      }

      .es-nav__logo:hover {
        opacity: 0.85;
      }

      .es-nav__logo-img {
        width: 40px;
        height: 35px;   
        object-fit: contain;
        flex-shrink: 0;
      }

      .es-nav__logo-text {
        font-family: var(--fd);
        font-weight: 800;
        font-size: 1.35rem;
        color: var(--text);
        letter-spacing: -0.02em;
        line-height: 1;
      }

      .es-nav__right {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .es-nav__cta {
        font-family: var(--fd);
        font-size: 0.9rem;
        font-weight: 600;
        color: #fff;
        background: var(--primary);
        border: none;
        cursor: pointer;
        padding: 0.65rem 1.5rem;
        border-radius: 999px;
        transition: background 0.2s ease, box-shadow 0.2s ease,
          transform 0.15s ease;
        box-shadow: 0 4px 16px rgba(28, 74, 176, 0.3);
      }

      .es-nav__cta:hover {
        background: #0f2d5f;
        box-shadow: 0 6px 24px rgba(28, 74, 176, 0.4);
        transform: translateY(-2px);
      }

      .es-nav__cta:active {
        transform: translateY(-1px);
      }

      @media (max-width: 768px) {
        .es-nav__logo-text {
          font-size: 1.15rem;
        }

        .es-nav__cta {
          padding: 0.6rem 1.2rem;
          font-size: 0.85rem;
        }
      }
    `,
  ],
})
export class LandingNavbar {
  private readonly dialogService = inject(ZardDialogService);
  scrolled = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 20);
  }

  openGetStartedDialog(): void {
    this.dialogService.create({
      zContent: AuthDialog,
      zWidth: '425px',
    });
  }
}
