import { Component, OnInit } from '@angular/core';
import { ChatService } from '../Services/ChatService';
import { IUserChat } from '../Interfaces/IUserChat';
import { AdminPanelService } from '../Services/AdminPanel.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  
  messages: IUserChat[] = [];
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
  ) {}

  ngOnInit(): void {
    this.getMessages();
    
  }

  getMessages(): void {
    this.chatService.getMessages().subscribe(
      messages => this.messages = messages
    );
  }

  sendMessage() {

    this.userChatTest.content = this.newMessage;
    this.chatService.postMessage(this.userChatTest).subscribe(chat => {
      console.log("idk")
      this.messages.push(chat);
    });
    this.newMessage = '';
  }
  

  
  
}
