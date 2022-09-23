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
  Inventories: Inventory[];


  constructor(private adminPanelService: AdminPanelService) { }

  ngOnInit(): void {
    this.getItems();
    this.userId = this.adminPanelService.userId;
  }

  
  getItems(): void{
    this.adminPanelService.getAllItems()
    .subscribe(items => this.items = items);
  }
  //Her opretter jeg en inventory/item og tilknytter den til brugeren som er logged på.
  buyItem(ItemId: any){
    var Inventory = { userid:this.userId, itemId:ItemId }
    this.adminPanelService.buyItem(Inventory).subscribe(userId => {

    });
  }

}
