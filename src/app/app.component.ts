import { Component } from '@angular/core';
import { FrontpageComponent } from './frontpage/frontpage.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'TronHjemmeside'
  isFrontPage: boolean = false;

  onActivate(componentRef: any) {
    this.isFrontPage = componentRef instanceof FrontpageComponent;
  }
}
