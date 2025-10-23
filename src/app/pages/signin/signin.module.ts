import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SigninRoutingModule } from './signin-routing.module';
import { SigninComponent } from './signin.component';
import {RouterModule,Routes} from '@angular/router';
import {FormsModule} from '@angular/forms';


@NgModule({
  declarations: [
    SigninComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    SigninRoutingModule,
    FormsModule,

  ],
  exports:[RouterModule]
})
export class SigninModule { }
