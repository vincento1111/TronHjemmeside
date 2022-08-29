import { Component, OnInit } from '@angular/core';
import { AdminPanelService } from '../Services/AdminPanel.service';
import { IUser } from '../Interfaces/IUser';
import { FormBuilder,FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-frontpage',
  templateUrl: './frontpage.component.html',
  styleUrls: ['./frontpage.component.css']
})
export class FrontpageComponent implements OnInit {

  users: IUser[];
  loginForm = new FormGroup({
    email: new FormControl(''),
    password: new FormControl(''),
  });

  velkommen: string;
  email: string;
  userId: number;

  ifLogin(){
    if (this.email != null){
      this.router.navigate(['/Homepage']);
      this.velkommen = "Welcome! "
    }
    else{
      this.velkommen = "Account not found"
    }
  }

  constructor(
    private adminPanelService : AdminPanelService,
    private formBuilder: FormBuilder,
    private router: Router) { }

  Login() { //sender en get request til min api om en user med userName x og pW y findes i databasen
    //console.warn(this.loginForm.value)
    this.adminPanelService.Login(this.loginForm.value.email,
      this.loginForm.value.password).subscribe(user => {
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
      email: [''],
      password: ['']
      });
  }

  getusers(){
    this.adminPanelService.getAllUsers()
    .subscribe(users => this.users = users);
    
  }


}
