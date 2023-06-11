import { Injectable } from '@angular/core';
import * as signalR from "@microsoft/signalr";  

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection;

  public startConnection() : Promise<void> {
    this.hubConnection = new signalR.HubConnectionBuilder()
                            .withUrl('https://tronapi.azurewebsites.net/chathub')
                            .build();

    return this.hubConnection
      .start()
      .then(() => console.log('Connection started'))
      .catch(err => console.log('Error while starting connection: ' + err))
  }

  public addTransferChatDataListener(callback) {
    this.hubConnection.on('ReceiveMessage', callback);
  }

  public async sendMessage(user: string, message: string) {
    return this.hubConnection.send('SendMessage', user, message);
  }
}
