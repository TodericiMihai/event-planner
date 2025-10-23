import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app-routing.module';
import { provideFirebaseApp } from '@angular/fire/app';
import { initializeApp } from 'firebase/app';
import { environment } from './environments/environment';
import { provideAuth, getAuth } from '@angular/fire/auth';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth())
  ]
}).catch(err => console.error(err));
