import { Component} from '@angular/core';
import {Router} from '@angular/router';
import { Auth, signInWithEmailAndPassword,GoogleAuthProvider,signInWithPopup } from '@angular/fire/auth';

@Component({
  selector: 'app-signin',
  standalone: false,
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.css',
})


export class SigninComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private auth: Auth, private router: Router) {}

  onLogin() {
    signInWithEmailAndPassword(this.auth, this.email, this.password)
      .then((userCredential) => {
        this.router.navigate([`/dashboard/${userCredential.user.uid}`]); // Redirect on successful login
      })
      .catch((error) => {
        console.error('Login error:', error.message);
        this.errorMessage = error.message; // Display error message
      });
  }
  // Google login method
  loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    
    signInWithPopup(this.auth, provider)
      .then((result) => {
        // The signed-in user info
        const user = result.user;
        this.router.navigate([`/dashboard/${user.uid}`]); // Redirect to dashboard
      })
      .catch((error) => {
        console.error('Google Login Error:', error.message);
        this.errorMessage = error.message; // Display error message if login fails
      });
  }
}
