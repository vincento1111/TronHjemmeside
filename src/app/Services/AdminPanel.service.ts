import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUser } from '../Interfaces/IUser';

@Injectable({
  providedIn: 'root'
})
export class AdminPanelService {
  private url = 'https://localhost:44344/api/users/';

  userMail: string;
  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<IUser[]> {
    return this.http.get<IUser[]>(this.url);
  }
  
  //GET
  Login(email: string, password: string): Observable<IUser> {
    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    //console.warn("METODEN BLEV KALDT!");
    //console.warn(this.url + "user?email=" + email + "&password=" + password );
    this.userMail = email;
    return this.http.get<IUser>(this.url + "login?email=" + email + "&password=" + password, httpOptions)
  }
  createUser(user: IUser): Observable<IUser> {
    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    return this.http.post<IUser>(this.url,
      user, httpOptions);
  }

  deleteUserById(userId: number): Observable<IUser> {
    console.log(this.url + userId);
    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    return this.http.delete<IUser>(this.url + userId, httpOptions);
  } 

}