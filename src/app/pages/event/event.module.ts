import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EventRoutingModule } from './event-routing.module';
import { EventComponent } from './event.component';
import { provideDatabase, getDatabase } from '@angular/fire/database';

@NgModule({
  declarations: [
    EventComponent,
  ],
  imports: [
    CommonModule,
    EventRoutingModule,
    FormsModule,
  ],
  providers: [
    // If you're using provideDatabase
    provideDatabase(() => getDatabase())
  ]
})
export class EventModule { }
