import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import {Database, ref, get, set, remove, push, onValue} from '@angular/fire/database';
import { nanoid } from 'nanoid';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userId: string | null = null;
  userData: any = null;
  username: string = 'User';
  slideType: string | null = null;

  userProfile = { name: '', dob: '' };
  newEvent = { name: '' };
  events: any[] = [];
  joinCode: string = '';
  private selectedEvent: any;
  joinedEvent: any[]=[];
  allEvents: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private auth: Auth,
    private db: Database,
    private router: Router
  ) {}

  navigateToEvent(event: any) {
    // Navigate to the event page with owner ID and event ID
    this.router.navigate(['/dashboard', event.ownerId, event.id]);
  }
  openSlide(type: string) {
    this.slideType = type; // 'create' or 'join'
  }

  logout() {
    this.auth.signOut().then(() => {
      console.log('User logged out');
      this.router.navigate(['/']); // Redirect to the main page (app.component.ts)
    }).catch((error) => {
      console.error('Error logging out:', error);
    });
  }

  // Close the slide panel
  closeSlide() {
    this.slideType = null;
  }


  ngOnInit() {
    // Listen to the authentication state
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.userId = user.uid;
        console.log('User ID:', this.userId);

        // Fetch user data and events once authentication is confirmed
        this.fetchUserData(this.userId);
        this.fetchEvents();
        this.fetchJoinedEvents(); // Add this line
      } else {
        console.log('No user is signed in.');
        this.userId = null;
        this.events = []; // Clear events if no user is signed in
        this.joinedEvent = []; // Clear joined events
      }
    });
  }

  fetchUserData(uid: string) {
    const userRef = ref(this.db, `users/${uid}`);
    get(userRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          this.userData = snapshot.val();
          this.username = this.userData.username || 'User';
          console.log('User data:', this.userData);
        } else {
          console.log('No data available');
        }
      })
      .catch((error) => {
        console.error('Error fetching user data:', error);
      });
  }

  updateProfile() {
    const userId = this.auth.currentUser?.uid;
    const userRef = ref(this.db, `users/${userId}`);
    set(userRef, this.userProfile)
      .then(() => alert('Profile updated successfully!'))
      .catch(error => console.error('Error updating profile:', error));
  }

  fetchEvents() {

    if (!this.userId) {
      console.error('No user ID available');
      return;
    }

    const eventsRef = ref(this.db, `events/${this.userId}`);

    // Fetch events initially
    get(eventsRef)
      .then((snapshot) => {
        if (snapshot.exists() && snapshot.val()) {
          this.events = Object.entries(snapshot.val()).map(([id, data]: any) => ({
            id,
            ...data,
          }));
          console.log('Fetched events:', this.events);
        } else {
          this.events = [];
          console.log('No events found.');
        }
      })
      .catch((error) => {
        console.error('Error fetching events:', error);
        this.events = [];
      });

    // Real-time listener for updates
    onValue(
      eventsRef,
      (snapshot) => {
        if (snapshot.exists() && snapshot.val()) {
          this.events = Object.entries(snapshot.val()).map(([id, data]: any) => ({
            id,
            ...data,
          }));
          console.log('Real-time events updated:', this.events);
        } else {
          this.events = [];
          console.log('No events in real-time snapshot');
        }
      },
      (error) => {
        console.error('Error listening for real-time events:', error);
        this.events = [];
      }
    );
  }



  createEvent() {
    const userId = this.auth.currentUser?.uid;
    const userEmail = this.auth.currentUser?.email;
    const eventsRef = ref(this.db, `events/${this.userId}`);
    const newEventRef = push(eventsRef);
    const eventCode = nanoid(6);

    const eventData = {
      ...this.newEvent,
      code: eventCode,
      ownerId: userId
    };

    console.log('Creating event with data:', eventData);

    set(newEventRef, eventData)
      .then(() => {
        console.log('Event created successfully at path:', `events/${this.userId}/${newEventRef.key}`);

        // Add the creator as an attendee
        if (userId && userEmail) {
          const attendeesRef = ref(
            this.db,
            `events/${this.userId}/${newEventRef.key}/attendees/${userId}`
          );

          set(attendeesRef, {
            email: userEmail
          })
            .then(() => {
              console.log('Creator added as attendee');
            })
            .catch((error) => {
              console.error('Error adding creator as attendee:', error);
            });
        }

        alert(`Event created successfully! Share this code: ${eventCode}`);
        this.newEvent = { name: '' };
        this.closeSlide();
      })
      .catch((error) => {
        console.error('Error creating event:', error);
        alert('Failed to create event');
      });
  }

  deleteEvent(eventId: string) {
    const userId = this.auth.currentUser?.uid;
    const eventRef = ref(this.db, `events/${this.userId}/${eventId}`);
    remove(eventRef)
      .then(() => {
        this.events = this.events.filter(event => event.id !== eventId);
        console.log('Event removed from user view.');
      })
      .catch((error) => console.error('Error deleting event:', error));
  }

  viewEvent(event: any) {
    // Show event details in a user-friendly way
    console.log('Viewing event:', event);
    alert(`Event: ${event.name}\nDate: ${event.date}`);

    // Optionally, route the user to a new page or section in your app to display details
    // Example: Store event in a variable to show in the template
    this.selectedEvent = event; // Define selectedEvent in your component
  }

  joinEvent() {
    const eventsRef = ref(this.db, 'events');

    get(eventsRef)
      .then((snapshot) => {
        if (snapshot.exists() && snapshot.val()) {
          const allEvents = snapshot.val();

          // Search for the event with the provided code
          let foundEvent: any = null;
          Object.keys(allEvents).forEach((ownerId) => {
            const userEvents = allEvents[ownerId];
            Object.keys(userEvents).forEach((eventId) => {
              const event = userEvents[eventId];
              if (event.code === this.joinCode) {
                foundEvent = { id: eventId, ownerId, ...event };
              }
            });
          });

          if (foundEvent) {
            const currentUser = this.auth.currentUser;
            const currentUserId = currentUser?.uid;
            const currentUserEmail = currentUser?.email;

            // Check if the user is the owner of the event
            if (foundEvent.ownerId === currentUserId) {
              alert("You cannot join an event that you created.");
              return;
            }

            // Check if the user is already an attendee
            if (foundEvent.attendees && currentUserId && foundEvent.attendees[currentUserId]) {
              alert(`You have already joined the event: ${foundEvent.name}`);
            } else {
              // Add the user as an attendee
              if (currentUserId) {
                const attendeesRef = ref(
                  this.db,
                  `events/${foundEvent.ownerId}/${foundEvent.id}/attendees/${currentUserId}`
                );
                set(attendeesRef, {
                  email: currentUserEmail // Store the actual email for easier debugging/lookup
                })
                  .then(() => {
                    alert(`Successfully joined the event: ${foundEvent.name}`);
                    this.viewEvent(foundEvent);
                  })
                  .catch((error) => {
                    console.error('Error joining event:', error);
                    alert('Failed to join the event');
                  });
              } else {
                console.error('No user is currently signed in.');
                alert('You must be signed in to join an event.');
              }
            }
          } else {
            alert('Event not found!');
          }

          this.closeSlide();
        }
      })
      .catch((error) => {
        console.error('Error joining event:', error);
        alert('Failed to fetch events. Please try again.');
      });
  }

  copyToClipboard(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      alert('Event code copied to clipboard!');
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  }

  fetchJoinedEvents() {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      console.error('No user is currently signed in');
      this.joinedEvent = [];
      return;
    }

    const eventsRef = ref(this.db, 'events');

    get(eventsRef)
      .then((snapshot) => {
        if (snapshot.exists() && snapshot.val()) {
          const allEvents = snapshot.val();
          this.joinedEvent = []; // Reset joined events array

          // Iterate through all events across all users
          Object.keys(allEvents).forEach((ownerId) => {
            const userEvents = allEvents[ownerId];
            Object.keys(userEvents).forEach((eventId) => {
              const event = userEvents[eventId];

              // Check if the current user is an attendee AND NOT the owner
              if (event.attendees &&
                event.attendees[currentUser.uid] &&
                event.ownerId !== currentUser.uid) {
                this.joinedEvent.push({
                  id: eventId,
                  ownerId,
                  ...event
                });
              }
            });
          });

          console.log('Fetched joined events:', this.joinedEvent);
        } else {
          this.joinedEvent = [];
          console.log('No events found.');
        }
      })
      .catch((error) => {
        console.error('Error fetching joined events:', error);
        this.joinedEvent = [];
      });

    // Real-time listener for updates
    onValue(
      eventsRef,
      (snapshot) => {
        if (snapshot.exists() && snapshot.val()) {
          const allEvents = snapshot.val();
          this.joinedEvent = []; // Reset joined events array

          // Iterate through all events across all users
          Object.keys(allEvents).forEach((ownerId) => {
            const userEvents = allEvents[ownerId];
            Object.keys(userEvents).forEach((eventId) => {
              const event = userEvents[eventId];

              // Check if the current user is an attendee AND NOT the owner
              if (event.attendees &&
                event.attendees[currentUser.uid] &&
                event.ownerId !== currentUser.uid) {
                this.joinedEvent.push({
                  id: eventId,
                  ownerId,
                  ...event
                });
              }
            });
          });

          console.log('Real-time joined events updated:', this.joinedEvent);
        } else {
          this.joinedEvent = [];
          console.log('No events in real-time snapshot');
        }
      },
      (error) => {
        console.error('Error listening for real-time joined events:', error);
        this.joinedEvent = [];
      }
    );
  }



}
