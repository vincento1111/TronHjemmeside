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
  constructor(
    private userStatsService: UserStatsService,
    private adminPanelService: AdminPanelService,
    private profileService: ProfileService) { }

  ngOnInit(): void {
    this.userId = this.adminPanelService.userId
    this.getProfile(this.userId);
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