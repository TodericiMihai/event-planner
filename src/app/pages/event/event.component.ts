import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Database, ref, get, set, push, remove, update } from '@angular/fire/database';
import { FormsModule } from '@angular/forms';

interface CalendarEvent {
  id?: string;
  name: string;
  startDate: string;
  endDate: string;
  details: string;
  photo?: string;
  startTime?: string;
  ownerId: string;
  attendees?: { [email: string]: AttendeeData };
  events?: { [key: string]: any };
  reviews?: {
    [key: string]: {
      userEmail: string;
      comment: string;
      rating: number;
      timestamp: string;
      photo?: string;
    };
  };
}

interface AttendeeData {
  status: 'attending' | 'not attending' | 'not sure';
}

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  standalone: false,
  styleUrls: ['./event.component.css'],
})
export class EventComponent implements OnInit {
  eventId: string | null = null;
  ownerId: string | null = null;
  eventData: CalendarEvent | null = null;
  currentUserId: string | null = null;
  isOwner: boolean = false;
  addedEvents: CalendarEvent[] = [];
  showAddedEvents: boolean = false;
  editableEvent: CalendarEvent = {
    name: '',
    startDate: '',
    endDate: '',
    details: '',
    photo: '',
    ownerId: '',
  };
  newReview: { comment: string; rating: number; photo?:string } = { comment: '', rating: 0 };
  addingReviewForEventId: string | null = null;
  isEditEventModalOpen: boolean = false;
  currentMonth: Date = new Date();
  daysInMonth: any[] = [];
  isEventDeleted: boolean = false;
  eventDeleteMessage: string = '';
  selectedEvent: CalendarEvent | null = null;
  isAddEventModalOpen: boolean = false;
  newEvent: CalendarEvent = {
    name: '',
    startDate: '',
    endDate: '',
    details: '',
    photo: '',
    ownerId: '',
  };
  isParticipantsSidebarOpen: boolean = false;
  mainEventAttendees: { uid: string, email: string }[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: Auth,
    private db: Database
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.ownerId = params['uid'];
      this.eventId = params['eid'];

      const currentUser = this.auth.currentUser;
      this.currentUserId = currentUser ? currentUser.uid : null;

      this.generateCalendar();
      this.fetchEventDetails();
      this.fetchMainEventAttendees();
    });
  }

  goBack() {
    if (this.ownerId) {
      this.router.navigate(['/dashboard', this.ownerId]);
    }
  }

  generateCalendar() {
    const firstDay = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth(),
      1
    );
    const lastDay = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1,
      0
    );

    this.daysInMonth = [];
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), i);
      this.daysInMonth.push({
        date,
        events: this.getEventsForDay(date),
      });
    }
  }

  fetchEventDetails() {
    if (!this.ownerId || !this.eventId) {
      console.error('Missing owner or event ID');
      return;
    }

    const eventRef = ref(this.db, `events/${this.ownerId}/${this.eventId}`);

    get(eventRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          this.eventData = snapshot.val() as CalendarEvent;
          this.isOwner = this.currentUserId === this.eventData.ownerId;
          this.generateCalendar();
        } else {
          console.log('Event not found');
        }
      })
      .catch((error) => {
        console.error('Error fetching event details:', error);
      });
  }

  changeMonth(direction: 'next' | 'prev') {
    const newMonth = new Date(this.currentMonth);
    newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1));
    this.currentMonth = newMonth;
    this.generateCalendar();
  }

  openAddEventModal() {
    this.isAddEventModalOpen = true;
  }

  closeAddEventModal() {
    this.isAddEventModalOpen = false;
    this.newEvent = {
      name: '',
      startDate: '',
      endDate: '',
      details: '',
      photo: '',
      ownerId: this.currentUserId || '',
    };
  }

  async addEvent() {
    if (!this.isOwner) {
      alert('Only the owner can add events.');
      return;
    }

    if (!this.currentUserId) {
      alert('You must be logged in to add an event.');
      return;
    }

    const eventPath = `events/${this.ownerId}/${this.eventId}/events`;
    const eventsRef = ref(this.db, eventPath);
    const newEventRef = push(eventsRef);
    const newEventId = newEventRef.key;

    this.newEvent.ownerId = this.currentUserId;

    try {
      await set(newEventRef, this.newEvent);

      if (this.eventData?.attendees) {
        const attendeesPath = `events/${this.ownerId}/${this.eventId}/events/${newEventId}/attendees`;
        const attendeesRef = ref(this.db, attendeesPath);

        const attendeesData: { [key: string]: { email: string } } = {};

        for (const uid of Object.keys(this.eventData.attendees)) {
          const attendeeRef = ref(this.db, `events/${this.ownerId}/${this.eventId}/attendees/${uid}`);
          const attendeeSnapshot = await get(attendeeRef);

          if (attendeeSnapshot.exists()) {
            const attendeeData = attendeeSnapshot.val();
            const email = attendeeData.email;
            if (email) {
              const sanitizedEmail = email.replace(/\./g, ',');
              attendeesData[sanitizedEmail] = {
                email: email
              };
            }
          }
        }

        await set(attendeesRef, attendeesData);
      }

      alert('Event added successfully');
      this.closeAddEventModal();
      this.fetchEventDetails();
    } catch (error) {
      console.error('Error adding event:', error);
      alert('Failed to add event.');
    }
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.newEvent.photo = reader.result as string;
        console.log('Photo selected:', this.newEvent.photo);
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
      };

      reader.readAsDataURL(file);
    } else {
      alert('No file selected');
    }
  }

  getEventsForDay(date: Date): string[] {
    if (!this.eventData || !this.eventData.events) {
      return [];
    }

    const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    return Object.keys(this.eventData.events).filter((key) => {
      const event = this.eventData!.events![key];

      if (event && event.startDate && event.endDate) {
        const eventStartDate = new Date(event.startDate);
        const eventEndDate = new Date(event.endDate);

        const normalizedStartDate = new Date(eventStartDate.getFullYear(), eventStartDate.getMonth(), eventStartDate.getDate());
        const normalizedEndDate = new Date(eventEndDate.getFullYear(), eventEndDate.getMonth(), eventEndDate.getDate());

        return currentDate >= normalizedStartDate && currentDate <= normalizedEndDate;
      }

      return false;
    });
  }

  viewAddedEvents() {
    this.fetchAddedEvents();
    this.showAddedEvents = true;
  }

  async fetchAddedEvents() {
    if (!this.ownerId || !this.eventId) {
      console.error('Missing owner or event ID');
      return;
    }

    const eventsRef = ref(this.db, `events/${this.ownerId}/${this.eventId}/events`);

    try {
      const snapshot = await get(eventsRef);
      if (snapshot.exists()) {
        const eventsData = snapshot.val();
        this.addedEvents = await Promise.all(
          Object.keys(eventsData).map(async (key) => {
            const event = { id: key, ...eventsData[key] };

            const attendeesRef = ref(this.db, `events/${this.ownerId}/${this.eventId}/events/${key}/attendees`);

            const attendeesSnapshot = await get(attendeesRef);

            if (attendeesSnapshot.exists()) {
              event.attendees = attendeesSnapshot.val();
            }

            return event;
          })
        );
      } else {
        this.addedEvents = [];
        console.log('No events found');
      }
    } catch (error) {
      console.error('Error fetching added events:', error);
    }
  }

  editEvent(event: CalendarEvent) {
    this.editableEvent = { ...event };
    this.isEditEventModalOpen = true;
  }

  closeEditEventModal() {
    this.isEditEventModalOpen = false;
    this.editableEvent = {
      name: '',
      startDate: '',
      endDate: '',
      details: '',
      photo: '',
      ownerId: this.currentUserId || '',
    };
  }

  updateEvent() {
    if (!this.isOwner) {
      alert('Only the owner can edit events.');
      return;
    }

    const eventRef = ref(
      this.db,
      `events/${this.ownerId}/${this.eventId}/events/${this.editableEvent.id}`
    );

    set(eventRef, this.editableEvent)
      .then(() => {
        alert('Event updated successfully.');
        this.closeEditEventModal();
        this.fetchAddedEvents();
        this.fetchEventDetails();
      })
      .catch((error) => {
        console.error('Error updating event:', error);
        alert('Failed to update event.');
      });
  }

  deleteEvent(eventId: string | undefined) {
    if (!this.ownerId || typeof this.ownerId !== 'string') {
      console.error('Owner ID is missing or invalid.');
      return;
    }

    if (!eventId || typeof eventId !== 'string') {
      console.error('Event ID is missing or invalid.');
      return;
    }

    const eventPath = `events/${this.ownerId}/${this.eventId}/events/${eventId}`;
    const eventRef = ref(this.db, eventPath);

    this.isEventDeleted = true;
    this.eventDeleteMessage = 'Event has been successfully deleted!';

    remove(eventRef)
      .then(() => {
        console.log(`Event with ID ${eventId} deleted successfully`);
        this.addedEvents = this.addedEvents.filter(event => event.id !== eventId);
        this.daysInMonth.forEach(day => {
          day.events = day.events.filter((event: { id: string; }) => event.id !== eventId);
        });
        this.generateCalendar();

        setTimeout(() => {
          this.isEventDeleted = false;
          this.eventDeleteMessage = '';
        }, 2000);
      })
      .catch((error) => {
        console.error('Error deleting event:', error);
        this.isEventDeleted = false;
        this.eventDeleteMessage = 'Error deleting event.';
      });
  }

  onEditPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (this.editableEvent) {
          this.editableEvent.photo = reader.result as string;
          console.log('Photo updated:', this.editableEvent.photo);
        }
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
      };

      reader.readAsDataURL(file);
    } else {
      alert('No file selected');
    }
  }

  async updateAttendance(event: CalendarEvent, email: string, status: 'attending' | 'not attending' | 'not sure') {
    if (!this.ownerId || !this.eventId || !event.id) {
      console.error('Missing required information for updating attendance');
      return;
    }

    const sanitizedEmail = email.replace(/\./g, ',');

    const attendeePath = `events/${this.ownerId}/${this.eventId}/events/${event.id}/attendees/${sanitizedEmail}`;
    const attendeeRef = ref(this.db, attendeePath);

    try {
      await set(attendeeRef, {
        status: status
      });

      console.log(`Attendance status updated to: ${status} for ${email}`);
      this.fetchAddedEvents();
    } catch (error) {
      console.error('Error updating attendance status:', error);
    }
  }

  getCurrentUserStatus(event: CalendarEvent): 'attending' | 'not attending' | 'not sure' | '' {
    const currentUserEmail = this.auth.currentUser?.email;
    if (!currentUserEmail || !event.attendees) {
      return '';
    }

    const sanitizedEmail = currentUserEmail.replace(/\./g, ',');
    return event.attendees[sanitizedEmail]?.status || '';
  }

  async updateMyAttendance(event: CalendarEvent, status: 'attending' | 'not attending' | 'not sure') {
    const currentUserEmail = this.auth.currentUser?.email;
    if (!currentUserEmail) {
      console.error('No user email available');
      return;
    }

    const currentStatus = this.getCurrentUserStatus(event);
    const newStatus = currentStatus === status ? 'not sure' : status;

    await this.updateAttendance(event, currentUserEmail, newStatus);
  }

  getAttendeesArray(event: CalendarEvent): { email: string, status: string }[] {
    if (!event.attendees) {
      return [];
    }

    return Object.keys(event.attendees).map(sanitizedEmail => ({
      email: sanitizedEmail.replace(/,/g, '.'),
      status: event.attendees![sanitizedEmail].status
    }));
  }

  toggleParticipantsSidebar() {
    this.isParticipantsSidebarOpen = !this.isParticipantsSidebarOpen;
  }

  async fetchMainEventAttendees() {
    if (!this.ownerId || !this.eventId) {
      console.error('Missing owner or event ID');
      return;
    }

    const attendeesRef = ref(this.db, `events/${this.ownerId}/${this.eventId}/attendees`);

    try {
      const snapshot = await get(attendeesRef);
      if (snapshot.exists()) {
        const attendeesData = snapshot.val();
        this.mainEventAttendees = Object.keys(attendeesData).map(uid => ({
          uid: uid,
          email: attendeesData[uid].email || 'No email'
        }));
      } else {
        this.mainEventAttendees = [];
      }
    } catch (error) {
      console.error('Error fetching main event attendees:', error);
    }
  }

  async deleteParticipant(uid: string, email: string) {
    if (!this.isOwner) {
      alert('Only the owner can delete participants.');
      return;
    }

    if(uid == this.ownerId){
      alert('Can not delete the owner');
      return;
    }

    if (!confirm(`Are you sure you want to remove ${email} from this event?`)) {
      return;
    }

    if (!this.ownerId || !this.eventId) {
      console.error('Missing owner or event ID');
      return;
    }

    try {
      const attendeeRef = ref(this.db, `events/${this.ownerId}/${this.eventId}/attendees/${uid}`);
      await remove(attendeeRef);

      const eventsRef = ref(this.db, `events/${this.ownerId}/${this.eventId}/events`);
      const eventsSnapshot = await get(eventsRef);

      if (eventsSnapshot.exists()) {
        const eventsData = eventsSnapshot.val();
        const sanitizedEmail = email.replace(/\./g, ',');

        for (const eventKey of Object.keys(eventsData)) {
          const subEventAttendeeRef = ref(
            this.db,
            `events/${this.ownerId}/${this.eventId}/events/${eventKey}/attendees/${sanitizedEmail}`
          );
          await remove(subEventAttendeeRef);
        }
      }

      alert(`${email} has been removed from the event.`);
      this.fetchMainEventAttendees();
      this.fetchAddedEvents();
    } catch (error) {
      console.error('Error deleting participant:', error);
      alert('Failed to delete participant.');
    }
  }

  async promoteToOwner(uid: string, email: string) {
    if (!this.isOwner) {
      alert('Only the owner can promote participants.');
      return;
    }

    if (uid === this.ownerId) {
      alert('This user is already the owner.');
      return;
    }

    if (!confirm(`Are you sure you want to promote ${email} to owner? You will lose ownership of this event.`)) {
      return;
    }

    if (!this.ownerId || !this.eventId) {
      console.error('Missing owner or event ID');
      return;
    }

    try {
      // Step 1: Read the entire event data from current owner's path
      const currentEventRef = ref(this.db, `events/${this.ownerId}/${this.eventId}`);
      const eventSnapshot = await get(currentEventRef);

      if (!eventSnapshot.exists()) {
        alert('Event data not found.');
        return;
      }

      const eventData = eventSnapshot.val();

      // Step 2: Update the ownerId in the main event data
      eventData.ownerId = uid;

      // Step 3: Update ownerId in all sub-events if they exist
      if (eventData.events) {
        Object.keys(eventData.events).forEach(eventKey => {
          if (eventData.events[eventKey].ownerId === this.ownerId) {
            eventData.events[eventKey].ownerId = uid;
          }
        });
      }

      // Step 4: Write the event data to the new owner's path
      const newEventRef = ref(this.db, `events/${uid}/${this.eventId}`);
      await set(newEventRef, eventData);

      // Step 5: Delete the event from the old owner's path
      await remove(currentEventRef);

      // Step 6: Update local state
      this.ownerId = uid;
      this.isOwner = false;

      alert(`${email} has been promoted to owner. The event has been transferred.`);

      // Redirect to the updated event path
      this.router.navigate(['/event', uid, this.eventId]);

    } catch (error) {
      console.error('Error promoting participant to owner:', error);
      alert('Failed to promote participant. Please try again.');
    }
  }

  async addReview(eventId: string | undefined) {
    if (!this.auth.currentUser?.email) {
      alert('You must be logged in to add a review.');
      return;
    }

    if (!this.newReview.comment.trim() || this.newReview.rating <= 0) {
      alert('Please add a comment and rating before submitting.');
      return;
    }

    const email = this.auth.currentUser.email;
    const sanitizedEmail = email.replace(/\./g, ',');

    const reviewRef = push(
      ref(this.db, `events/${this.ownerId}/${this.eventId}/events/${eventId}/reviews`)
    );

    const reviewData = {
      userEmail: email,
      comment: this.newReview.comment,
      rating: this.newReview.rating,
      timestamp: new Date().toISOString(),
      photo: this.newReview.photo || ''
    };

    try {
      await set(reviewRef, reviewData);
      alert('Review added successfully!');
      this.newReview = { comment: '', rating: 0 };
      this.addingReviewForEventId = null;
      this.fetchAddedEvents(); // refresh event data
    } catch (error) {
      console.error('Error adding review:', error);
      alert('Failed to add review.');
    }
  }

  onReviewPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.newReview.photo = reader.result as string;
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
      };

      reader.readAsDataURL(file);
    } else {
      alert('No file selected');
    }
  }

  reviewSortOption: 'dateDesc' | 'dateAsc' | 'alpha' = 'dateDesc';

  sortReviews(event: any) {
    this.reviewSortOption = event.target.value;
  }

  getSortedReviews(reviews: { [key: string]: any }) {
    const reviewArray = Object.entries(reviews).map(([key, value]) => ({ id: key, ...value }));

    switch (this.reviewSortOption) {
      case 'dateAsc':
        return reviewArray.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      case 'alpha':
        return reviewArray.sort((a, b) => a.userEmail.localeCompare(b.userEmail));
      default: // dateDesc
        return reviewArray.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  }

}

