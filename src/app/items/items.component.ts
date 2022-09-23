import { Component, OnInit } from '@angular/core';
import { Items } from '../Interfaces/Items';
import { AdminPanelService } from '../Services/AdminPanel.service';

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.css']
})
export class ItemsComponent implements OnInit {

  userId:any;
  test:any;
  items: Items[] = []

  constructor(private adminPanelService: AdminPanelService) { }
  

  ngOnInit(): void {
    //Her gør jeg userId i lig med userId i min servive metode.
    this.userId = this.adminPanelService.userId;
    this.getInventory();
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
