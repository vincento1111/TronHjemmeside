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

  userForm1 = new FormGroup({
    email: new FormControl(''),
    password: new FormControl(''),
  });
  
  velkommen: string = "test123";
  email: string;
  userId: number;

  testString: string = "virker det? ja";
  //navigere til user homepage hvis login metoden returnere de ønskede resultat.
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
    private router: Router) { }

  Login() { //sender en get request til min api om en user med userName x og pW y findes i databasen
    //console.warn(this.loginForm.value)
    this.adminPanelService.Login(this.loginForm.value.email,
      this.loginForm.value.password).subscribe(user => {
        console.warn(user);
        this.email = user.email;
        this.userId = user.userId;
        this.ifLogin();

        this.adminPanelService.saveId(user.userId)
      });
  }
//går i gang på sidens opstart.
  ngOnInit(): void {
    this.getusers();

  }
  //Her tilføjer jeg en bruger med værdierne som ligger i userform.
  createUser() {
    this.adminPanelService.createUser(this.userForm1.getRawValue()).subscribe(user =>{
      return this.users.push(user);
    })
  }
  
  getusers(){
    this.adminPanelService.getAllUsers()
    .subscribe(users => this.users = users);
    
  }
}
