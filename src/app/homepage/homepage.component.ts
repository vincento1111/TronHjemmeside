import { Component, OnInit } from '@angular/core';
import { UserStatsService } from '../Services/UserStats.service';
import { IUser } from '../Interfaces/IUser';
import { FormBuilder,FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { IUserStats } from '../Interfaces/IUserStats';
import { ReactiveFormsModule } from '@angular/forms';
import { AdminPanelService } from '../Services/AdminPanel.service';
@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {
  
  //usersStats: IUserStats[];
  
  userId:any;
  email: string;

  statId: number;
  strength:number;
  defense:number;
  speed:number;
  dexterity:number;
  level:number;
  experience:number;
  life:number;
  money:number;

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
      console.warn(user);
      this.strength = user.strength;
      this.speed = user.speed;
      this.defense = user.defense;
      this.dexterity = user.dexterity;
      this.money = user.money;
      this.level = user.level;
      this.life = user.life;
    });
  }

}
