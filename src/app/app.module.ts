import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { RouterModule } from '@angular/router';
import { SigninModule } from './pages/signin/signin.module';
import { AngularFireModule } from '@angular/fire/compat';
import {environment} from '../environments/environment';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import {RegisterModule} from './pages/register/register.module';
import {DashboardModule} from './pages/dashboard/dashboard.module';
import { provideDatabase, getDatabase } from '@angular/fire/database';

@NgModule({
  declarations: [
    // Declare AppComponent here
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SigninModule,
    RegisterModule,
    RouterModule,
    DashboardModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    FormsModule,
    // Import FormsModule
  ],
  providers: [
    provideAuth(() => getAuth()),
    provideDatabase(() => getDatabase())// Register global services if needed
  ],
   // Bootstrap the root component
})
export class AppModule {}
