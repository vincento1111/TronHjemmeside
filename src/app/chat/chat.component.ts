import { Component, OnInit } from '@angular/core';
import { IUserChat } from '../Interfaces/IUserChat';
import { AdminPanelService } from '../Services/AdminPanel.service';
import { Router } from '@angular/router';
import { SignalRService } from '../Services/Signal-r.service'; 

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  currentUrl:string;
  email: string;
  userId:number;
  messages: IUserChat[] = [];
  newMessage = '';

  constructor(
    private adminPanelService: AdminPanelService,
    private router: Router,
    private signalRService: SignalRService, 
  ) {
    router.events.subscribe(() => {
      this.currentUrl = this.router.url;
    });
  }

  ngOnInit(): void {
    this.adminPanelService.currentUser.subscribe(user => {
      if (user) {
        this.userId = user.userId;
        this.email = user.email;
      }
    });
  
    this.signalRService.startConnection(); // Start SignalR connection
    this.signalRService.addMessageDataListener(); // Add event handler for receiving messages
  
    // Subscribe to messages
    this.signalRService.messageReceived.subscribe((message: IUserChat) => {
      this.messages.push(message);
    });
  }
  
  
  sendMessage(): void {
    this.signalRService.sendMessage(this.userId, this.newMessage).then(() => {
      this.newMessage = '';
    });
  }
}
