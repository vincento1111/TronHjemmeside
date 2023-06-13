import { Component, OnInit } from '@angular/core';
import { UserStatsService } from '../Services/UserStats.service';
import { AdminPanelService } from '../Services/AdminPanel.service';
import { ProfileService } from '../Services/ProfileService';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.css']
})
export class ProfilePageComponent implements OnInit {

  userId: any;

  profileDes: string;
  profileId: any;
  constructor(
    private userStatsService: UserStatsService,
    private adminPanelService: AdminPanelService,
    private profileService: ProfileService) { }

  ngOnInit(): void {
    //this.email = this.adminPanelService.getUserEmail();
    this.userId = this.adminPanelService.getUserId2();
    this.getProfile(this.userId);
  }

  getProfile(userId){
    this.profileService.getProfile(userId).subscribe(user =>{
      console.warn(user);
      this.profileDes = user.profileDes;
      this.profileId =user.profileId;
    })
  }
  updateProfile(profileDes) {
    this.profileService.getProfile(this.profileId).subscribe(profile =>{
      profile.profileDes = profileDes
      this.profileService.updateProfile(profile).subscribe(user =>{
      });
    })
  }


}