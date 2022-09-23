import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUser } from '../Interfaces/IUser';
import { Items } from '../Interfaces/Items';
import { Inventory } from '../Interfaces/Inventory';

@Injectable({
  providedIn: 'root'
})
export class AdminPanelService {
  //Her laver jeg nogen string til det urls i mit api jeg kalder mest, for at spare tid.
  private url = 'https://localhost:44344/api/users/';
  private ItemsUrl = 'https://localhost:44344/api/items/';
  private InventoryUrl = 'https://localhost:44344/api/Inventory/';
  userId: number;
  userMail: string;
  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<IUser[]> {
    return this.http.get<IUser[]>(this.url);
  }
  getAllItems(): Observable<Items[]> {
    return this.http.get<Items[]>(this.ItemsUrl);
  }
  
  //Metoden laver et api kald til min user kontroller som kaldes på "login" og retunere et json object som matcher email og password som bliver sendt.
  Login(email: string, password: string): Observable<IUser> {
    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    //Jeg sætter ofte beskeder i min consol for at se om jeg før de rigtige resultater.
    console.warn(this.url + "login?email=" + email + "&password=" + password );
    this.userMail = email;

    return this.http.get<IUser>(this.url + "login?email=" + email + "&password=" + password, httpOptions)
  }
  //her gemmer jeg Id i min service så jeg kan kalde på current users Id
  saveId(id: number){
    this.userId = id;
  }
  createUser(user: IUser): Observable<IUser> {
    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    console.warn(this.url, user);
    return this.http.post<IUser>(this.url, user, httpOptions);
  }
  //Her tager jeg et nyt object af user og erstatter den gamle user.
  updateUser(user: IUser): Observable<IUser> {
    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    console.warn("this is my update user ",this.url, user)
    return this.http.put<IUser>(this.url, user, httpOptions);
  }

  deleteUserById(userId: number): Observable<IUser> {
    console.log(this.url + userId);
    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    return this.http.delete<IUser>(this.url + userId, httpOptions);
  } 

  getUserId(email: string): Observable<IUser>{
    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    console.warn("Http get request to:"+ this.url + "id?email=" + email, httpOptions);
    return this.http.get<IUser>(this.url + "id?email=" + email, httpOptions);
  }

  createItem(item: Items): Observable<Items> {
    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    console.warn(this.ItemsUrl, item);
    return this.http.post<Items>(this.ItemsUrl, item, httpOptions);
  }
  getItem(itemId: number): Observable<Items>{
    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    return this.http.get<Items>(this.ItemsUrl + itemId)
  }

  buyItem(Inventory: Inventory): Observable<Inventory>{
    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    console.warn(this.InventoryUrl, Inventory);
    return this.http.post<Inventory>(this.InventoryUrl, Inventory, httpOptions);
  }

  //Her henter jeg alle inventories hvor UserId er lig med UserId (current user)
  getUserInventory(userId: number):Observable<Inventory>{
    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    console.warn(this.InventoryUrl + "UserInventory?id=" + userId);
    return this.http.get<Inventory>(this.InventoryUrl + "UserInventory?id=" + userId, httpOptions);

  }

}