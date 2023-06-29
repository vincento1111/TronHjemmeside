import { Component, OnInit } from '@angular/core';
import { IUserChat } from '../Interfaces/IUserChat';
import { AdminPanelService } from '../Services/AdminPanel.service';
import { Router } from '@angular/router';
import { SignalRService } from '../Services/Signalr.service';
import { ChatService } from '../Services/ChatService';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit 
{
  showChatContent = true;
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
    
    this.userId = this.adminPanelService.getUserId2();

  
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
      content: this.newMessage,
    };
  
    this.signalRService.sendMessage(chatData).then(() => {
      this.newMessage = '';
    }).catch(err => console.error(err));
  }
}
