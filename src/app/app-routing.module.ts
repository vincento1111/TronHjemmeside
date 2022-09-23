import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminPanelComponent } from './admin-panel/admin-panel.component';


import { FrontpageComponent } from './frontpage/frontpage.component';
import { HomepageComponent } from './homepage/homepage.component';
import { ProfilePageComponent } from './profilepage/profile-page.component';
import { TrainingPageComponent } from './training-page/training-page.component';
import { ItemsComponent } from './items/items.component';
import { ShopComponent } from './shop/shop.component';

const routes: Routes = [
  //Her laver jeg paths til alle min sider
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
  },
  {
    path: 'Shop',
    component: ShopComponent
  },
  {
    path: 'Items',
    component: ItemsComponent
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
