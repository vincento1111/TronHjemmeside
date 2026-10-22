import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { SessionService } from './core/session.service';
import { LoginComponent } from './pages/login.component';
import { DashboardComponent } from './pages/dashboard.component';
import { TrainingComponent } from './pages/training.component';
import { ShopComponent } from './pages/shop.component';
import { InventoryComponent } from './pages/inventory.component';
import { PlayersComponent } from './pages/players.component';
import { ProfileComponent } from './pages/profile.component';

const signedIn: CanActivateFn = () => inject(SessionService).user() ? true : inject(Router).createUrlTree(['/login']);
const signedOut: CanActivateFn = () => inject(SessionService).user() ? inject(Router).createUrlTree(['/']) : true;

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [signedOut], title: 'Welcome · Tron City' },
  { path: '', component: DashboardComponent, canActivate: [signedIn], title: 'Your city · Tron City' },
  { path: 'training', component: TrainingComponent, canActivate: [signedIn], title: 'Training · Tron City' },
  { path: 'shop', component: ShopComponent, canActivate: [signedIn], title: 'Market · Tron City' },
  { path: 'inventory', component: InventoryComponent, canActivate: [signedIn], title: 'Inventory · Tron City' },
  { path: 'players', component: PlayersComponent, canActivate: [signedIn], title: 'People · Tron City' },
  { path: 'players/:id', component: ProfileComponent, canActivate: [signedIn], title: 'Player profile · Tron City' },
  { path: '**', redirectTo: '' },
];
