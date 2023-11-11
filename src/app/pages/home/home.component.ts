import {Component, OnInit} from '@angular/core';
import {HomeButton} from '../../../assets/chess-log.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  public buttons: HomeButton[];

  constructor() {
    this.defineButtons();
  }

  ngOnInit(): void {
  }

  private defineButtons(): void {
    this.buttons = [];
    this.buttons.push(this.getButtonModel('fa fa-solid fa-plus', 'New Game', '/new-game'));
    this.buttons.push(this.getButtonModel('fa fa-solid fa-trophy', 'Tournaments', '/tournaments'));
    this.buttons.push(this.getButtonModel('fa fa-solid fa-users', 'Community', '/community'));
    this.buttons.push(this.getButtonModel('fa fa-solid fa-hourglass-half', 'Game Clock', '/game-clock'));
    this.buttons.push(this.getButtonModel('fa fa-solid fa-backward', 'Previous Games', '/games'));
    this.buttons.push(this.getButtonModel('fa fa-solid fa-book', 'Rules', '/rules'));
  }

  private getButtonModel(iconClass: string, label: string, routerLink: string): HomeButton {
    return {
      iconClass,
      label,
      routerLink
    };
  }
}
