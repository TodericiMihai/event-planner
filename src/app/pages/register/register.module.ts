import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule   } from '@angular/router';
import { RegisterRoutingModule } from './register-routing.module';
import { RegisterComponent } from './register.component';
import {FormsModule ,ReactiveFormsModule} from "@angular/forms";
import {getDatabase, provideDatabase} from '@angular/fire/database';


@NgModule({
  declarations: [
    RegisterComponent
  ],
    imports: [
        CommonModule,
        RouterModule,
        RegisterRoutingModule,
        FormsModule,
        ReactiveFormsModule,
    ],
  exports: [RegisterComponent],
  providers: [
    provideDatabase(() => getDatabase())
  ]
})
export class RegisterModule { }
