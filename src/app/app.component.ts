import { Component } from '@angular/core';
import {NavigationEnd, Router, RouterLink, RouterOutlet} from '@angular/router';
import {NgIf} from '@angular/common';
import {filter} from 'rxjs';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgIf, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  isNavigatedAway: boolean = false;
  constructor(private router: Router) {   this.router.events.pipe(
    filter(event => event instanceof NavigationEnd)
  ).subscribe((event) => {
    console.log('Navigation Event:', event);
  });} // Inject the Router service

  ngOnInit() {
    // Listen for navigation events and update the isNavigatedAway flag
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)  // Listen for when navigation ends
    ).subscribe((event: NavigationEnd) => {
      // Check if the route is the main page (adjust as needed)
      if (event.url === '/') {
        this.isNavigatedAway = false;  // Show the welcome page on main page
      } else {
        this.isNavigatedAway = true;   // Hide the welcome page when navigating away
      }
    });
  }
}
