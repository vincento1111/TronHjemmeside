import { Component, OnInit } from '@angular/core';
import { AdminPanelService } from '../Services/AdminPanel.service';
import { UserStatsService } from '../Services/UserStats.service';
import { Items } from '../Interfaces/Items';
import { Inventory } from '../Interfaces/Inventory';
@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.css']
})
export class ShopComponent implements OnInit {

  items: Items[];
  userId: any;
  Inventories: Inventory[];
  money:number;
  

  constructor(
    private adminPanelService: AdminPanelService,
    private userStatsService: UserStatsService) { }

  ngOnInit(): void {
    this.getItems();
    
    //this.email = this.adminPanelService.getUserEmail();
    this.userId = this.adminPanelService.getUserId2();
    this.getUserStats(this.userId);
  }

  
  getItems(): void{
    this.adminPanelService.getAllItems()
    .subscribe(items => this.items = items);
  }
  //Her opretter jeg en inventory/item og tilknytter den til brugeren som er logged på.
  buyItem(ItemId: any){
    const Inventory: Inventory = {
      userId: this.userId,
      itemId: ItemId,
    };
    console.log(Inventory)
    this.adminPanelService.buyItem(Inventory).subscribe(userId => {
      this.getUserStats(this.userId);
    });
}



  getUserStats(userId){
    this.userStatsService.getStatsByUserId(userId).subscribe(user =>{
      console.warn("my user is",user.money);
      this.money = user.money;
    });
  }

}
