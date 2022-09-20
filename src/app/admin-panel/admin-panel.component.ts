import { Component, OnInit } from '@angular/core';
import { IUser } from '../Interfaces/IUser';
import { Items } from '../Interfaces/Items';
import { FormGroup, FormControl } from '@angular/forms';
import { AdminPanelService } from '../Services/AdminPanel.service'
import { ReactiveFormsModule } from '@angular/forms';


@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit {


  users: IUser[];

  items: Items[];

  userForm1 = new FormGroup({
    email: new FormControl(''),
    password: new FormControl(''),
  });

  updateForm = new FormGroup({
    userId: new FormControl(),
    email: new FormControl(''),
    password: new FormControl(''),
  })

  itemForm = new FormGroup({
    itemName: new FormControl(''),
    itemDescription: new FormControl(''),
    offensiveStat: new FormControl()
  })

  constructor(private adminPanelService: AdminPanelService) { }

  ngOnInit(): void {
    this.getusers();
  }

  getusers(): void{
    this.adminPanelService.getAllUsers()
    .subscribe(users => this.users = users);
  }

  createUser() {
    this.adminPanelService.createUser(this.userForm1.getRawValue()).subscribe(user =>{
      return this.users.push(user);
    })
  }
  updateUser() {
    this.adminPanelService.updateUser(this.updateForm.getRawValue()).subscribe(user =>{
      return this.users.push(user);
    })
  }

  deleteUser(userId: number) : void {
    this.adminPanelService.deleteUserById(userId).subscribe(users =>{
      this.getusers();
    });
  }

  createItem() {
    this.adminPanelService.createItem(this.itemForm.getRawValue()).subscribe({
    });
  }


}