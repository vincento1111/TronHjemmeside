import { Component, OnInit } from '@angular/core';
import { IUserChat } from '../Interfaces/IUserChat';
import { AdminPanelService } from '../Services/AdminPanel.service';
import { Router } from '@angular/router';
import { Signalrservice } from '../Services/Signal-r.service';
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
    private signalrservice: Signalrservice, 
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
  
    this.signalrservice.startConnection(); // Start SignalR connection
    this.signalrservice.addMessageDataListener(); // Add event handler for receiving messages
  
    // Subscribe to messages
    this.signalrservice.messageReceived.subscribe((message: IUserChat) => {
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
  
    this.signalrservice.sendMessage(chatData).then(() => {
      this.newMessage = '';
    }).catch(err => console.error(err));
  }
}
