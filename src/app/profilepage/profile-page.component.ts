import { Component, OnInit } from '@angular/core';
import { UserStatsService } from '../Services/UserStats.service';
import { AdminPanelService } from '../Services/AdminPanel.service';
import { ProfileService } from '../Services/ProfileService';
import { IProfile } from '../Interfaces/IProfile';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.css']
})
export class ProfilePageComponent implements OnInit {

  userId: any;
  email: any;
  profileDes: string;
  profileId: any;
  constructor(
    private adminPanelService: AdminPanelService,
    private profileService: ProfileService) { }

  ngOnInit(): void {
    this.adminPanelService.currentUser.subscribe(user => {
      if (user) {
        this.userId = user.userId;
        this.email = user.email;
      }
    });
    //this.email = this.adminPanelService.getUserEmail();
    this.userId = this.adminPanelService.getUserId2();
    this.profileId = this.profileService.getProfileByUserId(this.userId);
    this.getProfile(this.userId);
  }

  

  getProfile(userId){
    this.profileService.getProfileByUserId(userId).subscribe(user =>{
      console.warn(user);
      this.profileDes = user.profileDes;
      this.profileId =user.profileId;
      
      
    })
  }
  updateProfile(profileDes) {
    const profile: IProfile = {
      profileId: this.profileId,
      userId: this.userId , // From currently logged-in user
      User: {
        email: this.email, // From currently logged-in user
        password: '' // Usually, password should not be sent like this. Please adjust it based on your logic
      },
      profileDes: profileDes,
    };
      this.profileService.updateProfile(profile).subscribe(user =>{


    })
  }


}