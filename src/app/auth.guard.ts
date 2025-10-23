import { inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { Router, UrlTree } from '@angular/router';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export const authGuard = (): Observable<boolean | UrlTree> => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    map(user => {
      if (user) {
        // Redirect logged-in user to dashboard
        return router.parseUrl('/dashboard:uid');
      }
      // Allow navigation for unauthenticated users
      return true;
    })
  );
};
