import {Component, OnDestroy, OnInit} from '@angular/core';
import * as uuid from 'uuid';
import {AngularFirestore} from '@angular/fire/firestore';
import {BasicUserModel, ChessGame, ChessTournament, GameResult} from '../../../assets/chess-log.model';
import {AngularFireAuth} from '@angular/fire/auth';
import {UsersService} from '../../services/users.service';
import {GamesService} from '../../services/games.service';
import {Subscription} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TournamentsService} from '../../services/tournaments.service';

@Component({
  selector: 'app-new-game',
  templateUrl: './new-game.component.html',
  styleUrls: ['./new-game.component.scss']
})
export class NewGameComponent implements OnInit, OnDestroy {

  public allUsers: BasicUserModel[];
  public availableUsers: BasicUserModel[];
  public userSlot1: BasicUserModel;
  public userSlot2: BasicUserModel;
  public myUser: BasicUserModel;
  public currentGame: ChessGame;
  public submitting: boolean;
  public dateTimePlayed: Date;
  public tournaments: ChessTournament[];
  private subs: Subscription[];

  constructor(private fireStore: AngularFirestore,
              private snackBar: MatSnackBar,
              private usersService: UsersService,
              private gamesService: GamesService,
              private auth: AngularFireAuth,
              private tournamentsService: TournamentsService) {
    this.availableUsers = [];
    this.allUsers = [];
    this.tournaments = [];
    this.subs = [];
    this.clearGame();
    this.dateTimePlayed = new Date();
  }

  ngOnInit(): void {
    let s = this.usersService.allUsers.subscribe(
      users => {
        this.availableUsers = users;
        this.allUsers = users;
        this.auth.currentUser.then(
          (user) => {
            this.myUser = this.allUsers.filter(u => u.userId === user.uid)[0];
          }
        );
      });
    this.subs.push(s);

    s = this.tournamentsService.allTournaments.subscribe((tournaments) => {
      this.tournaments = tournaments;
    });
    this.subs.push(s);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  public selectTournaments(ids: string[]): void {
    this.currentGame.tournamentIds = ids;
  }

  public submitGame(): void {
    this.submitting = true;
    this.currentGame.dateTimeCreated = new Date().getTime().toString();
    this.currentGame.dateTimePlayed = new Date(this.dateTimePlayed).getTime().toString();

    const gameId = uuid.v4();

    this.currentGame.gameId = gameId;
    this.currentGame.authorId = this.myUser.userId;
    this.currentGame.authorName = this.myUser.displayName;
    this.fireStore.collection('games').doc(gameId).set(this.currentGame).then(
      () => {
        let userId = '';
        userId = this.myUser.userId;

        if (this.userSlot1.userId === userId) {
          this.gamesService.refreshMyGames(userId);
        }

        if ([this.userSlot1.userId, this.userSlot2.userId].indexOf(userId) > -1) {
          this.gamesService.refreshMyGames(userId);
        }
        this.clearGame();
        this.gamesService.refreshAllGames();
        this.submitting = false;

        this.snackBar.open('Game submitted', '', {
          duration: 1500,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snack-success']
        });
      });
  }

  public isTournamentDisabled(startDate: string): boolean {
    return new Date().getTime() < new Date(+startDate).getTime();
  }

  public isSubmitDisabled(): boolean {
    return (!this.currentGame?.result && this.currentGame.result !== 0) ||
      !this.currentGame.participant1?.userId ||
      !this.currentGame.participant2?.userId ||
      !this.currentGame.dateTimePlayed ||
      !this.currentGame.tournamentIds.length ||
      this.submitting;
  }

  public isResult(r: number): boolean {
    return this.currentGame.result === r;
  }

  public resultChanged(result: GameResult): void {
    this.currentGame.result = result;
  }

  public selectUser(slot: number, selectedUser: BasicUserModel): void {
    switch (slot) {
      case 1: {
        this.userSlot1 = selectedUser;
        this.currentGame.participant1 = selectedUser;
        break;
      }
      case 2: {
        this.userSlot2 = selectedUser;
        this.currentGame.participant2 = selectedUser;
      }
    }

    this.availableUsers = this.allUsers.filter((user) => {
      return [this.userSlot1?.userId, this.userSlot2?.userId].indexOf(user?.userId) === -1;
    });
  }

  private clearGame(): void {
    this.currentGame = {
      gameId: null,
      participant1: null,
      participant2: null,
      dateTimeCreated: null,
      dateTimePlayed: new Date().getTime().toString(),
      comments: [],
      result: undefined,
      authorId: null,
      authorName: null,
      note: '',
      tournamentIds: []
    };

    this.userSlot1 = undefined;
    this.userSlot2 = undefined;

    this.availableUsers = this.allUsers;
  }

}
