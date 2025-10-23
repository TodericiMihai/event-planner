import { Routes } from '@angular/router';
import {SigninComponent} from './pages/signin/signin.component';
import {RegisterComponent} from './pages/register/register.component';
import {DashboardComponent} from './pages/dashboard/dashboard.component';
import {EventComponent} from './pages/event/event.component';

export const routes: Routes = [
  {path: '', redirectTo: '/signin', pathMatch: 'full' },
  {path: 'signin', component: SigninComponent},
  {path: 'register', component: RegisterComponent},
  {path: 'dashboard/:uid', component: DashboardComponent},
  {path: 'dashboard/:uid/:eid', component: EventComponent},];
