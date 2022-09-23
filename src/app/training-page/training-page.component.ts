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
    this.email = this.adminPanelService.userMail;
    this.userId = this.adminPanelService.userId;
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
  //done
  updateUserStats(stat) {
    this.userStatsService.getUserStat(this.userId).subscribe(user =>{
      if(stat == 1 ){
        user.strength++;
        this.strength++;
      }
      if(stat == 2){
        user.speed++;
        this.speed++;
      }
      if(stat == 3){
        user.defense++;
        this.defense++;
      }
      if(stat == 4){
        user.dexterity++;
        this.dexterity++;
      }
      
      console.warn(user);
      this.userStatsService.updateUserStat(user).subscribe(user =>{
       
      });

    });
  } 
}