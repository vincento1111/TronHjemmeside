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
  email: string;

  ngOnInit(): void {
    
    this.email = this.adminPanelService.userMail;
    this.getUserId();
  }
  getUserId() {
    this.adminPanelService.getUserId(this.email).subscribe(userId => {
      console.warn("my user id is", userId);
      this.userId = userId;
    });
  }

  getInventory(){
    
  }

}
