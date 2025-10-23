import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database'; // Import only the DB module
import { provideDatabase, getDatabase } from '@angular/fire/database';
import {FormsModule} from "@angular/forms";

@NgModule({
  declarations: [
    DashboardComponent
  ],
    imports: [
        CommonModule,
        DashboardRoutingModule,
        AngularFireDatabaseModule,
        FormsModule
    ],
  providers: [
    provideDatabase(() => getDatabase())
  ]
})
export class DashboardModule { }
