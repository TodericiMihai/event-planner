import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Database, ref, set } from '@angular/fire/database';
import { createUserWithEmailAndPassword,GoogleAuthProvider,signInWithPopup } from 'firebase/auth';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  email: string = '';
  password: string = '';
  name: string = '';
  confirmPassword: string = '';

  constructor(
    private router: Router,
    private auth: Auth,
    private db: Database
  ) {}

  onRegister() {
    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    createUserWithEmailAndPassword(this.auth, this.email, this.password)
      .then((userCredential) => {
        const user = userCredential.user;

        // Store user data in Realtime Database
        return set(ref(this.db, 'users/' + user.uid), {
          username: this.name,
          email: this.email,
          createdAt: new Date().toISOString(),
        }).then(() => {
          console.log('User registered successfully and data stored');
          this.router.navigate(['/signin']);
        });
      })
      .catch((error) => {
        console.error('Registration error:', error.message);
        alert(error.message);
      });
  }
  googleLogin() {
    const provider = new GoogleAuthProvider();

    signInWithPopup(this.auth, provider)
      .then((result) => {
        const user = result.user;

        // Store user data in Realtime Database
        return set(ref(this.db, 'users/' + user.uid), {
          username: user.displayName,
          email: user.email,
          createdAt: new Date().toISOString(),
        }).then(() => {
          console.log('Google user logged in and data stored');
          this.router.navigate(['/dashboard']);  // Redirect to dashboard after login
        });
      })
      .catch((error) => {
        console.error('Google login error:', error.message);
        alert(error.message);
      });
  }
  passwordsMatch() {
    return this.password === this.confirmPassword;
  }

}
