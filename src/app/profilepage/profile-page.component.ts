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
  email: string;

  profileDes: string;
  constructor(
    private userStatsService: UserStatsService,
    private adminPanelService: AdminPanelService,
    private profileService: ProfileService) { }

  ngOnInit(): void {
    this.email = this.adminPanelService.userMail;
    this.getUserId();
  }
  getUserId() {
    this.adminPanelService.getUserId(this.email).subscribe(userId => {
      console.warn("my user id is", userId);
      this.userId = userId;
      this.getProfile(userId);
    });
  }

  getProfile(profileId){
    this.profileService.getProfile(profileId).subscribe(profile =>{
      this.profileDes = profile.profileDes;
    })
  }
  updateProfile(profileDes) {
    this.profileService.getProfile(this.userId).subscribe(profile =>{
      profile.profileDes = profileDes
      
      this.profileService.updateProfile(profile).subscribe(user =>{
       
      });
    })
  }


}