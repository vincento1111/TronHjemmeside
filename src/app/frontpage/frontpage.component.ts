import { Component, OnInit } from '@angular/core';
import { AdminPanelService } from '../Services/AdminPanel.service';
import { IUser } from '../Interfaces/IUser';
import { FormBuilder,FormGroup, FormControl } from '@angular/forms';


@Component({
  selector: 'app-frontpage',
  templateUrl: './frontpage.component.html',
  styleUrls: ['./frontpage.component.css']
})
export class FrontpageComponent implements OnInit {

  users: IUser[];
  loginForm = new FormGroup({
    Email: new FormControl(''),
    Password: new FormControl(''),
  });

  velkommen: string;
  email: string;
  userId: number;

  ifLogin(){
    if (this.email != null){
      this.velkommen = "Welcome! "
    }
    else{
      this.velkommen = "Account not found"
    }
  }

  constructor(
    private adminPanelService : AdminPanelService,
    private formBuilder: FormBuilder) { }

  Login() { //sender en get request til min api om en user med userName x og pW y findes i databasen
    //console.warn(this.loginForm.value)
    this.adminPanelService.Login(this.loginForm.value.Password,
      this.loginForm.value.Email).subscribe(user => {
        console.warn(user);
        this.email = user.email;
        this.userId = user.userId;
        this.ifLogin();
        return this.users.push(user) //subscribe er vigtig
      });
  }

  ngOnInit(): void {
    this.getusers();
    this.loginForm = this.formBuilder.group({
      userName: [''],
      pW: ['']
      });
  }

  getusers(){
    this.getAllUsers()
    .subscribe(users => this.users = users);
    
  }


}
