import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUserStats } from '../Interfaces/IUserStats';

@Injectable({
  providedIn: 'root'
})
export class UserStatsService {
  // WORKS FOR LOCAL!!!
  // private url = 'https://localhost:44344/api/UserStats/';

  // //WORKS FOR AZURE
  private url = 'https://tronapi.azurewebsites.net/api/UserStats/'


  constructor(private http: HttpClient) { }


  getUserStat(StatId: number): Observable<IUserStats>{
    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    console.warn("Http get request to:"+ this.url + StatId, httpOptions);
    return this.http.get<IUserStats>(this.url+ StatId, httpOptions);
  }
  

  // UserStatsService
  incrementStat(statId: number, statName: string): Observable<IUserStats> {
    console.warn(`${this.url}IncrementStat?statId=${statId}&statName=${statName}`);
    return this.http.put<IUserStats>(`${this.url}IncrementStat?statId=${statId}&statName=${statName}`, {});
  }

  
  
  

  // updateUserStat(user: IUserStats):Observable<IUserStats>{
  //   const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
  //   console.warn("this is my put request" + this.url , user, httpOptions)
  //   return this.http.put<IUserStats>(this.url, user, httpOptions);
  // }
  

}