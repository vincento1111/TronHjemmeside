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
//der er lavet 3 forms på admin panel siden. en til at oprette kontoer, en anden til et update og en tredje til at oprette items.
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
    offensiveStat: new FormControl(),
    value: new FormControl()
  })

  constructor(private adminPanelService: AdminPanelService) { }

  ngOnInit(): void {
    this.getusers();
    this.getItems();
  }
  //har tager vi alle brugere og putter dem i en liste af brugere
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
  //der er en knap i html hvor vi bliver sendt til den her delete user metode med det ID der skal bruges til at slette en user.
  //vi tager så userId variblen og slette useren som har det ID
  deleteUser(userId: number) : void {
    this.adminPanelService.deleteUserById(userId).subscribe(users =>{
      this.getusers();
    });
  }

  createItem() {
    this.adminPanelService.createItem(this.itemForm.getRawValue()).subscribe({
    });
  }

  getItems(): void{
    this.adminPanelService.getAllItems()
    .subscribe(items => this.items = items);
  }
}