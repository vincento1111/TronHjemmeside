import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IProfile } from '../Interfaces/IProfile';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  //WORKS LOCAL!!!
  // private url = 'https://localhost:44344/api/profile/';
  
  // //WORKS FOR AZURE!!!
  private url = 'https://tronapi.azurewebsites.net/api/profile/';
  private profileUrl = 'https://tronapi.azurewebsites.net/api/profile/';

  userMail: string;
  constructor(private http: HttpClient) { }

  getProfile(StatId: number): Observable<IProfile>{
    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    console.warn("Http get request to:"+ this.url + StatId, httpOptions);
    return this.http.get<IProfile>(this.url+ StatId, httpOptions);
  }
  updateProfile(profile: IProfile): Observable<IProfile> {
    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    console.warn("this is my put request" + this.url , profile, httpOptions);
    return this.http.put<IProfile>(this.url, profile, httpOptions);
  }
  
  getProfileByUserId(userId: number){
    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    return this.http.get<IProfile>(this.profileUrl + userId + "/userProfile", httpOptions);
  }
  
}