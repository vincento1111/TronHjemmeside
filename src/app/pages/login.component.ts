import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '../core/session.service';
import { errorMessage } from '../core/api.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="login-layout">
      <section class="login-story">
        <a class="brand" href="/"><span class="brand-mark">T</span><span>TRON<span class="brand-city">CITY</span></span></a>
        <div class="login-story-content">
          <span class="eyebrow">A CITY WORTH COMING BACK TO</span>
          <h1>Your name.<br>Your <em>city.</em></h1>
          <p>Start small. Get stronger. Find your people.<br>Your next chapter in Tron City begins here.</p>
          <div class="login-features"><span>ϟ Train your character</span><span>◇ Build your arsenal</span><span>⌁ Meet the city</span></div>
        </div>
        <div class="city-skyline" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div class="login-story-footer"><span>TRON CITY / LOCAL EDITION</span><span>YOUR STORY STARTS HERE ↗</span></div>
      </section>
      <section class="login-form-side">
        <div class="login-form-wrap">
          <span class="eyebrow">{{ registering() ? 'A FRESH START' : 'GOOD TO SEE YOU' }}</span>
          <h2>{{ registering() ? 'Make a name for yourself.' : 'Welcome to the city.' }}</h2>
          <p class="muted">{{ registering() ? 'Create your character and take your first step.' : 'Sign in to pick up where you left off.' }}</p>
          <div class="segmented-control">
            <button [class.selected]="!registering()" (click)="setMode(false)" [disabled]="busy()">Sign in</button>
            <button [class.selected]="registering()" (click)="setMode(true)" [disabled]="busy()">Create account</button>
          </div>
          <form (ngSubmit)="submit()" #authForm="ngForm">
            @if (registering()) {
              <label for="display-name">Display name</label>
              <input id="display-name" name="displayName" [(ngModel)]="displayName" required minlength="2" maxlength="24" autocomplete="nickname" placeholder="What will the city call you?">
            }
            <label for="email">Email</label>
            <input id="email" name="email" type="email" [(ngModel)]="email" required email autocomplete="username" placeholder="you@example.com">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" [(ngModel)]="password" required [minlength]="registering() ? 10 : 1" maxlength="128" [autocomplete]="registering() ? 'new-password' : 'current-password'" placeholder="Enter your password">
            @if (registering()) { <small class="field-help">At least 10 characters. Display names use letters, numbers, spaces, - or _.</small> }
            @if (error() || session.connectionError()) { <p class="form-error" role="alert">{{ error() || session.connectionError() }}</p> }
            <button class="button button-primary login-submit" [disabled]="busy() || authForm.invalid">{{ busy() ? 'Opening the city…' : registering() ? 'Create my character' : 'Enter the city' }} <span>↗</span></button>
          </form>
          <div class="demo-box">
            <div><strong>Take a look around</strong><span class="pill">LOCAL DEMO</span></div>
            <p>Two ready-to-play characters. Fresh local data, with gear, money and 1,000 sodas each.</p>
            <div class="demo-buttons">
              <button class="button button-outline" [disabled]="busy()" (click)="demo('vince')">Play as Vince ↗</button>
              <button class="button button-outline" [disabled]="busy()" (click)="demo('nova')">Play as Nova ↗</button>
            </div>
            <small>Use separate browser profiles to try chatting between them.</small>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class LoginComponent {
  readonly session = inject(SessionService);
  private readonly router = inject(Router);
  readonly registering = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  email = ''; password = ''; displayName = '';
  setMode(register: boolean): void { this.registering.set(register); this.error.set(''); }
  async demo(player: 'vince' | 'nova'): Promise<void> {
    this.registering.set(false); this.email = player + '@tron.local'; this.password = 'TronLocal!2026';
    await this.submit();
  }
  async submit(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true); this.error.set('');
    try {
      if (this.registering()) await this.session.register(this.email.trim(), this.password, this.displayName.trim());
      else await this.session.signIn(this.email.trim(), this.password);
      this.password = '';
      await this.router.navigateByUrl('/');
    } catch (error) { this.error.set(errorMessage(error)); }
    finally { this.busy.set(false); }
  }
}
