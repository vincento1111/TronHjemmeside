import { Component, OnInit } from '@angular/core';
import { Items } from '../Interfaces/Items';
import { AdminPanelService } from '../Services/AdminPanel.service';
import { UserStatsService } from '../Services/UserStats.service';

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.css']
})
export class ItemsComponent implements OnInit {

  userId:any;
  StatId:any;
  test:any;
  items: Items[] = []

  constructor(private adminPanelService: AdminPanelService,
    private userStatsService: UserStatsService) { }
  

  ngOnInit(): void {
    //Her gør jeg userId i lig med userId i min servive metode.
    //this.email = this.adminPanelService.getUserEmail();
    this.userId = this.adminPanelService.getUserId2();
    this.getUserStatId(this.userId);
    this.getInventory();
  }

  getUserStatId(userId){
    this.userStatsService.getStatsByUserId(userId).subscribe(user =>{
      console.warn("current user"+user);
      this.StatId= user.statId;
    });
  }

  //Her henter jeg alle inventories som har brugeres ID, og putter dem i en liste. 
  //derefter går jeg igennem hver object i listen og putter værdien af ItemId ind i min getItem metode
  //Derefter henter jeg den item som svarer til det ID jeg har hentet og putter det i min Items liste.
   getInventory(){
    this.adminPanelService.getUserInventory(this.userId).subscribe(  inventory =>{
      console.warn(inventory);
      let x = 0;
      for(let i in inventory){
        this.adminPanelService.getItem(inventory[x++].itemId).subscribe(item =>{
          this.items.push(item);
        })
      }
    });
  }

}
