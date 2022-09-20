import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IProfile } from '../Interfaces/IProfile';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private url = 'https://localhost:44344/api/profile/';

  userMail: string;
  constructor(private http: HttpClient) { }

  getProfile(StatId: number): Observable<IProfile>{
    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    console.warn("Http get request to:"+ this.url + StatId, httpOptions);
    return this.http.get<IProfile>(this.url+ StatId, httpOptions);
  }
  updateProfile(user: IProfile):Observable<IProfile>{
    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    console.warn("this is my put request" + this.url , user, httpOptions)
    return this.http.put<IProfile>(this.url, user, httpOptions);
  }
  
}