import { Injectable, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUserStats } from '../Interfaces/IUserStats';

@Injectable({
  providedIn: 'root'
})
export class UserStatsService {
  
  private url = 'https://localhost:44344/api/UserStats/';


  constructor(private http: HttpClient) { }


  getUserStat(StatId: number): Observable<IUserStats>{
    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    console.warn("Http get request to:"+ this.url + StatId, httpOptions);
    return this.http.get<IUserStats>(this.url+ StatId, httpOptions);
  }
  updateUserStat(user: IUserStats):Observable<IUserStats>{
    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    console.warn("this is my put request" + this.url , user, httpOptions)
    return this.http.put<IUserStats>(this.url, user, httpOptions);
  }
  

}