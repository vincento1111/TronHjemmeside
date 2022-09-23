import { Component, OnInit } from '@angular/core';
import { AdminPanelService } from '../Services/AdminPanel.service';

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.css']
})
export class ItemsComponent implements OnInit {

  constructor(private adminPanelService: AdminPanelService) { }
  userId:any;

  ngOnInit(): void {
    this.userId = this.adminPanelService.userId;
    this.getInventory();
  }


  getInventory(){

    this.adminPanelService.getUserInventory(this.userId).subscribe( userId =>{
      

    });
  }

}
