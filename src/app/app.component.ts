import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/auth';
import firebase from 'firebase';
import User = firebase.User;
import {GamesService} from './services/games.service';
import {UsersService} from './services/users.service';
import {TournamentsService} from './services/tournaments.service';
import {LocationsService} from './services/locations.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public lastUrl: string;
  public user: User;
  public loadingUserState: boolean;

  constructor(private router: Router,
              private auth: AngularFireAuth,
              private usersService: UsersService,
              private gamesService: GamesService,
              private tournamentsService: TournamentsService,
              private locationsService: LocationsService) {
  }

  public ngOnInit(): void {
    this.router.events.subscribe(
      (routerEvent: any) => {
        if (routerEvent.routerEvent?.url) {
          this.lastUrl = routerEvent.routerEvent.url;
        }
      });

    this.initUserState();
  }

  public logOut(): void {
    this.auth.signOut().then(
      (response) => {
        this.router.navigate(['login']);
      }
    );
  }

  private initUserState(): void {
    this.loadingUserState = true;
    this.auth.authState.subscribe((authState) => {
      if (!authState) {
        this.gamesService.clearFavoriteIDs();
      }
      this.loadingUserState = false;
      this.user = authState;

      this.gamesService.refreshMyGames(this.user.uid);
      this.gamesService.refreshFavoriteIDs();
      this.gamesService.refreshAllGames();
      this.usersService.refreshAllUsers();
      this.tournamentsService.refreshAllTournaments();
      this.locationsService.refreshAllLocations();
    }, () => {
      this.loadingUserState = false;
      this.gamesService.clearFavoriteIDs();
    });
  }
}
