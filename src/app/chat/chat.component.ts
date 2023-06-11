import { Component, OnInit } from '@angular/core';
import { ChatService } from '../Services/ChatService';
import { IUserChat } from '../Interfaces/IUserChat';
import { AdminPanelService } from '../Services/AdminPanel.service';
import { Router } from '@angular/router';
import { SignalRService } from '../Services/signal-r.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  currentUrl: string;
  email: string;
  userId: number;
  messages: IUserChat[] = [];
  newMessage = '';

  constructor(
    private chatService: ChatService,
    private adminPanelService: AdminPanelService,
    private router: Router,
    private signalRService: SignalRService, // Inject the SignalRService
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

    // Start the SignalR connection and subscribe to incoming messages
    this.signalRService.startConnection().then(() => {
      this.signalRService.addTransferChatDataListener((user, message) => {
        this.messages.push({
          'userId': user,
          'content': message,
          'User': {
            'email': user,
            'password': ''
          }
        });
      });
    });

    // Get the initial set of messages
    this.getMessages();
  }

  getMessages(): void {
    this.chatService.getMessages().subscribe(
      messages => {
        console.log(messages);
        this.messages = messages;
      }
    );
  }

  sendMessage() {
    if (this.newMessage.trim() !== '') {
      // Send the message via SignalR and clear the input
      this.signalRService.sendMessage(this.userId.toString(), this.newMessage);
      this.newMessage = '';
    }
  }
}
