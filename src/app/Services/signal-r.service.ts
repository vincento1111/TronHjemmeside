import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { IUserChat } from '../Interfaces/IUserChat';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection;
  private localS = "https://localhost:44344/chathub"
  private azureS = "https://tronapi.azurewebsites.net/chathub"
  messageReceived = new Subject<IUserChat>();

  public startConnection = () => {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.azureS)
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('Connection started'))
      .catch(err => console.log('Error while starting connection: ' + err));
  }

  public addMessageDataListener = () => {
    this.hubConnection.on('ReceiveMessage', (data: IUserChat) => {
      this.messageReceived.next(data);
    });
  }

  public sendMessage = async (chatData: IUserChat) => {
    try {
      await this.hubConnection.invoke('SendMessage', chatData);
    } catch (err) {
      console.error(err);
    }
  }
  

  
  

  
}
