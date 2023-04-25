import { Component, OnInit } from '@angular/core';
import { UserStatsService } from '../Services/UserStats.service';
import { IUser } from '../Interfaces/IUser';
import { FormBuilder,FormGroup, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Router } from '@angular/router';
import { IUserStats } from '../Interfaces/IUserStats';
import { ReactiveFormsModule } from '@angular/forms';
import { AdminPanelService } from '../Services/AdminPanel.service';
import { __values } from 'tslib';

@Component({
  selector: 'app-training-page',
  templateUrl: './training-page.component.html',
  styleUrls: ['./training-page.component.css']
})
export class TrainingPageComponent implements OnInit {
  
  userStats: IUserStats[];

  strength:number;
  defense:number;
  speed:number;
  dexterity:number;

  userId:any;
  email: string;

  constructor(
    private userStatsService: UserStatsService,
    private adminPanelService: AdminPanelService) { }

  ngOnInit(): void {
    this.email = this.adminPanelService.getUserEmail();
    this.userId = this.adminPanelService.getUserId2();
    this.getUserStats(this.userId);
  }

  getUserStats(userId){
    this.userStatsService.getUserStat(userId).subscribe(user =>{
      console.warn("my user is",user);
      this.strength = user.strength;
      this.speed = user.speed;
      this.defense = user.defense;
      this.dexterity = user.dexterity;
    });
  }

updateUserStats(statType: number) {
  this.userStatsService.updateUserStat(this.userId, statType).subscribe(user => {
    // Update the local stats
    if (statType === 1) {
      this.strength++;
    } else if (statType === 2) {
      this.speed++;
    } else if (statType === 3) {
      this.defense++;
    } else if (statType === 4) {
      this.dexterity++;
    }
  });
}
  
}