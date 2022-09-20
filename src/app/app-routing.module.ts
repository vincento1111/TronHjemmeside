import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminPanelComponent } from './admin-panel/admin-panel.component';


import { FrontpageComponent } from './frontpage/frontpage.component';
import { HomepageComponent } from './homepage/homepage.component';
import { ProfilePageComponent } from './profilepage/profile-page.component';
import { TrainingPageComponent } from './training-page/training-page.component';

const routes: Routes = [
  {
    path:'',
    component: FrontpageComponent
  },
  {
    path: 'Homepage',
    component: HomepageComponent
  },
  {
    path: 'Profilepage',
    component: ProfilePageComponent
  },
  {
    path: 'AdminPanel',
    component: AdminPanelComponent
  },
  {
    path: 'TrainingPage',
    component: TrainingPageComponent
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
