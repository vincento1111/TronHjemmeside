import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUserChat } from '../Interfaces/IUserChat';
import { AdminPanelService } from './AdminPanel.service';
import { catchError, tap, } from 'rxjs/operators';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private url = 'https://tronapi.azurewebsites.net/api/Chat'; // Update with your API URL

  // private url = 'https://localhost:44344/api/Chat';


  adminPanelService: AdminPanelService;
  constructor(private http: HttpClient, adminPanelService: AdminPanelService) {
    this.adminPanelService = adminPanelService;
  }
  getMessages(): Observable<IUserChat[]> {
    return this.http.get<IUserChat[]>(this.url).pipe(
      map((messages: IUserChat[]) => 
        messages.sort((a, b) => a.messageId - b.messageId)
      )
    );
  }

  // postMessage(chat: IUserChat): Observable<IUserChat>{
  //   const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
  //   console.warn("Chat.service "+this.url, chat, httpOptions);
  //   return this.http.post<IUserChat>(this.url, chat, httpOptions);
  // }

}

