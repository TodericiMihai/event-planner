import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';  // Assuming it's in dashboard folder
import { EventComponent } from './pages/event/event.component'; // Path to your Event component


export const routes: Routes = [
  { path: 'signin', loadChildren: () => import('./pages/signin/signin.module').then(m => m.SigninModule) },
  { path: 'register', loadChildren: () => import('./pages/register/register.module').then(m => m.RegisterModule) },
  { path: 'dashboard/:uid', loadChildren: () => import('./pages/dashboard/dashboard.module').then(m => m.DashboardModule) },
  { path: 'dashboard/:uid/all-events', loadChildren: () => import('./pages/event/event.module').then(m => m.EventModule) },
  { path: 'dashboard/:uid/:eid', loadChildren: () => import('./pages/event/event.module').then(m => m.EventModule) },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
