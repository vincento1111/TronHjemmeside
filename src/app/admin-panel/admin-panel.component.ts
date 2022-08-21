import { Component, OnInit } from '@angular/core';
import { IUser } from '../Interfaces/IUser';
import { FormGroup, FormControl } from '@angular/forms';
import { AdminPanelService } from '../Services/AdminPanel.service'
import { ReactiveFormsModule } from '@angular/forms';


@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit {


  users: IUser[] = [];

  userForm1 = new FormGroup({
    email: new FormControl(''),
    password: new FormControl(''),
  });

  constructor(private adminPanelService: AdminPanelService) { }

  ngOnInit(): void {
    this.getusers();

  }

  getusers(): void{
    this.adminPanelService.getAllUsers()
    .subscribe(users => this.users = users);
  }

  onSubmit() {

    
    this.adminPanelService.createUser(this.userForm1.getRawValue()).subscribe(user =>{
      return this.users.push(user);
    })

  }

  deleteUser(userId: number) : void {
    this.adminPanelService.deleteUserById(userId).subscribe(users =>{
      this.getusers();

    });
  }

}


