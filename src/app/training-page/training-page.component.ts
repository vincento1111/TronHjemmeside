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

  energy:number;
  statId:number;
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
    this.userStatsService.getStatsByUserId(userId).subscribe(user =>{
      console.warn(user);
      this.strength = user.strength;
      this.speed = user.speed;
      this.defense = user.defense;
      this.dexterity = user.dexterity;
      this.statId = user.statId;
      this.energy = user.energy;
    });
  }

updateUserStats(statName: string) {
  this.userStatsService.incrementStat(this.statId, statName).subscribe(user => {
    this.strength = user.strength;
    this.speed = user.speed;
    this.defense = user.defense;
    this.dexterity = user.dexterity;
    this.energy = user.energy;
  });
}

  
}