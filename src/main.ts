import { bootstrapApplication } from '@angular/platform-browser';
import { provideAppInitializer, inject, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { SessionService } from './app/core/session.service';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideAppInitializer(() => inject(SessionService).initialize()),
  ],
}).catch(error => console.error('Tron City could not start.', error));
