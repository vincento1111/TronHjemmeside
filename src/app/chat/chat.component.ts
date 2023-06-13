import { Component, OnInit } from '@angular/core';
import { IUserChat } from '../Interfaces/IUserChat';
import { AdminPanelService } from '../Services/AdminPanel.service';
import { Router } from '@angular/router';
import { SignalRService } from '../Services/Signal-r.service'; 
import { ChatService } from '../Services/ChatService';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit 
{
  //empty
  currentUrl:string;
  email: string;
  userId:number;
  messages: IUserChat[] = [];
  newMessage = '';

  constructor(
    private chatService: ChatService,
    private adminPanelService: AdminPanelService,
    private router: Router,
    private signalRService: SignalRService, 
  ) {
    router.events.subscribe(() => {
      this.currentUrl = this.router.url;
    });
  }

  ngOnInit(): void {
    this.getMessages();
    
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

  getMessages(): void {
    this.chatService.getMessages().subscribe(
      messages => {
        console.log(messages);
        this.messages = messages;
      }
    );
  }
  
  sendMessage() {
    const chatData: IUserChat = {
      userId: this.userId, // From currently logged-in user
      User: {
        email: this.email, // From currently logged-in user
        password: '' // Usually, password should not be sent like this. Please adjust it based on your logic
      },
      content: this.newMessage,
    };
  
    this.signalRService.sendMessage(chatData).then(() => {
      this.newMessage = '';
    }).catch(err => console.error(err));
  }
}
