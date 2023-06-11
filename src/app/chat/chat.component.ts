import { Component, OnInit } from '@angular/core';
import { ChatService } from '../Services/ChatService';
import { IUserChat } from '../Interfaces/IUserChat';
import { AdminPanelService } from '../Services/AdminPanel.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  currentUrl:string;
  email: string;
  userId:number;
  messages: IUserChat[];
  newMessage = '';
  private userChatTest: IUserChat = {
    
    'userId': this.adminPanelService.getUserId2(),
    'content': this.newMessage,
    'User':{
      'email': '',
      'password': ''
    }
  }

  
  constructor(
    private chatService: ChatService,
    private adminPanelService: AdminPanelService,
    private router: Router
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
      this.getMessages();
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
    this.userChatTest.userId = this.adminPanelService.getUserId2();
    this.userChatTest.content = this.newMessage;
    this.chatService.postMessage(this.userChatTest).subscribe(chat => {
      console.log("idk");
      this.messages.push(chat);
      // Refetch user and messages
      this.userId = this.adminPanelService.getUserId2();
      this.email = this.adminPanelService.getUserEmail();
      this.getMessages();
    });
    this.newMessage = '';
  }
  
  

  
  
}
