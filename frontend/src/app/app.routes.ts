import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { VerifyComponent } from './auth/verify/verify.component';
import { HomeComponent } from './home/home.component';
import { AdminComponent } from './admin/admin.component';
import { AuthService } from './services/auth.service';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'verify/:token', component: VerifyComponent },
    { path: 'home', component: HomeComponent, canActivate: [authGuard] },
    { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
    { path: 'owner-dashboard', loadComponent: () => import('./owner-dashboard/owner-dashboard.component').then(m => m.OwnerDashboardComponent), canActivate: [() => inject(AuthService).getUserRole() === 'owner'] },
    { path: 'business-queue', loadComponent: () => import('./business-queue/business-queue.component').then(m => m.BusinessQueueComponent), canActivate: [authGuard] },
    { path: 'queue-token/:id', loadComponent: () => import('./queue-token/queue-token.component').then(m => m.QueueTokenComponent) }, // Legacy load standalone component
    { path: 'queue-join/:id', loadComponent: () => import('./queue-token/queue-token.component').then(m => m.QueueTokenComponent) },
    { path: '', redirectTo: 'login', pathMatch: 'full' }
];
