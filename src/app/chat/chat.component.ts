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
    
    this.email = this.adminPanelService.getUserEmail();
    this.userId = this.adminPanelService.getUserId2();
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
    this.userChatTest.userId = this.userId;
    this.userChatTest.User.email = this.email;
    this.userChatTest.content = this.newMessage;
    this.chatService.postMessage(this.userChatTest).subscribe(chat => {
      console.log("idk")
      this.messages.push(chat);
    });
    this.newMessage = '';
  }
  

  
  
}
