import { Component, OnInit } from '@angular/core';
import { AdminPanelService } from '../Services/AdminPanel.service';
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
  email: string;
  Inventories: Inventory[];


  constructor(private adminPanelService: AdminPanelService) { }

  ngOnInit(): void {
    this.getItems();
    this.email = this.adminPanelService.userMail;
    this.getUserId();
  }
  getUserId() {
    this.adminPanelService.getUserId(this.email).subscribe(userId => {
      console.warn("my user id is", userId);
      this.userId = userId;
    });
  }
  getItems(): void{
    this.adminPanelService.getAllItems()
    .subscribe(items => this.items = items);
  }

  buyItem(ItemId: any){
    var Inventory = {
      userid:this.userId, itemId:ItemId
    }
    this.adminPanelService.buyItem(Inventory).subscribe(userId => {
      
    });
  }

}
