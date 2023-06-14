import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUser } from '../Interfaces/IUser';
import { Items } from '../Interfaces/Items';
import { Inventory } from '../Interfaces/Inventory';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class AdminPanelService {
  //Her laver jeg nogen string til det urls i mit api jeg kalder mest, for at spare tid.

  // WORKS FOR LOCAL!!!!
  // private url = 'https://localhost:44344/api/users/';
  // private ItemsUrl = 'https://localhost:44344/api/items/';
  // private InventoryUrl = 'https://localhost:44344/api/Inventory/';

  //WORKS FOR AZURE!!!
  private url = 'https://tronapi.azurewebsites.net/api/users/';
  private ItemsUrl = 'https://tronapi.azurewebsites.net/api/items/';
  private InventoryUrl = 'https://tronapi.azurewebsites.net/api/Inventory/';

  private currentUserSubject = new BehaviorSubject<IUser>(null);

  userId: number;
  userMail: string;
  userPassword:string;
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
    console.warn(this.url + "login?email=" + email + "&password=" + password );
    this.userMail = email;

    // After getting the user data, next it into currentUserSubject
    return this.http.get<IUser>(this.url + "login?email=" + email + "&password=" + password, httpOptions)
      .pipe(
        tap(user => this.currentUserSubject.next(user))
      );
  }
  logout(): void {
    // Clear user data from local storage
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPassword');
    // Reset currentUserSubject
    this.currentUserSubject.next(null);
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

  saveUserEmail(email: string): void {
    localStorage.setItem('userEmail', email);
  }
  
  getUserId2(): number | null {
    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId) : null;
  }


  // Save user's ID in localStorage
  saveUserId(userId: number): void {
    localStorage.setItem('userId', userId.toString());
  }
  getUserEmail(): string | null {
    return localStorage.getItem('userEmail');
  }
  saveUserPassword(password: string): void{
    localStorage.setItem('userPassword', password);
  }

  getUserPassword(): string | null {
    return localStorage.getItem('userPassword');
  }
  //getter for the whole user as an object
  get currentUser(): Observable<IUser> {
    return this.currentUserSubject.asObservable();
  }
  
  


}