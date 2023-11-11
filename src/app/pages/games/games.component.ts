import {Component, OnDestroy, OnInit} from '@angular/core';
import {GamesService} from '../../services/games.service';
import {BasicUserModel, ChessGame, ChessTournament, ExpandedUserModel} from '../../../assets/chess-log.model';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {combineLatest, Subscription, timer} from 'rxjs';
import {AngularFireAuth} from '@angular/fire/auth';
import firebase from 'firebase';
import User = firebase.User;
import {MatSnackBar} from '@angular/material/snack-bar';
import {UsersService} from '../../services/users.service';
import {TournamentsService} from '../../services/tournaments.service';

@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.scss']
})
export class GamesComponent implements OnInit, OnDestroy {

  public allGames: ChessGame[];
  public filteredGames: ChessGame[];

  public allUsers: BasicUserModel[];
  public availableUsers: BasicUserModel[];
  public userSlot1: ExpandedUserModel;
  public userSlot2: ExpandedUserModel;
  public allTournaments: ChessTournament[];
  public selectedTournament: ChessTournament;

  public selectedGame: ChessGame;
  public user: User;
  public deletingGame: boolean;
  public displayH2HDetails: boolean;
  public activeFilter: string;
  public secBeforeDeletion: number;

  private favoriteIds: string[];
  private subs: Subscription[];
  private paramsSub: Subscription;
  private deletionTimer: Subscription;

  constructor(private gamesService: GamesService,
              private activatedRoute: ActivatedRoute,
              private auth: AngularFireAuth,
              private router: Router,
              private usersService: UsersService,
              private snackBar: MatSnackBar,
              private tournamentsService: TournamentsService) {
    this.availableUsers = [];
    this.allUsers = [];
    this.subs = [];
    this.giveUpDeletion();
  }

  ngOnInit(): void {
    this.allGames = [];

    const s1 = this.usersService.allUsers;
    const s2 = this.auth.user;
    const s3 = this.tournamentsService.allTournaments;

    const subRequests = [s1, s2, s3];

    const forkJoinSub = combineLatest(subRequests).subscribe((responses) => {


      const users: any = responses[0];
      const user: any = responses[1];
      const tournaments: any = responses[2];

      this.allTournaments = tournaments.filter(t => !this.isTournamentDisabled(t.startDateTime));

      this.user = user;
      this.allUsers = users;
      this.availableUsers = users;

      const gameSub = this.gamesService.allGames.subscribe((games) => {
        if (!games?.length) {
          return;
        }

        this.allGames = games;
        this.allGames.forEach((g) => {
          g.tournaments = this.tournamentsService.getTournamentsByIDs(g.tournamentIds);
        });

        this.filteredGames = JSON.parse(JSON.stringify(this.allGames));
        setTimeout(() => {
          this.handleQueryParams();
        });
      });
      this.subs.push(gameSub);

      this.favoriteIds = [];
      const favSub = this.gamesService.favoriteIDs.subscribe((ids) => {
        this.favoriteIds = ids;
        if (!ids.length) {
          return;
        }

        if (this.activeFilter === 'favorites') {
          this.filterFavorites();
        }

      });
      this.subs.push(favSub);

    }, (error) => {
      console.log(error);
    });
    this.subs.push(forkJoinSub);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.paramsSub.unsubscribe();
    this.giveUpDeletion();
  }

  public selectUser(slot: number, selectedUser: BasicUserModel): void {
    this.filteredGames = [];
    this.displayH2HDetails = false;

    switch (slot) {
      case 1: {
        if (!selectedUser) {
          this.userSlot1 = null;
          this.filterAvailableUsers();
          return;
        }

        this.userSlot1 = {
          user: selectedUser,
          details: this.gamesService.countResultsForUser(selectedUser.userId)
        };
        break;
      }
      case 2: {
        if (!selectedUser) {
          this.userSlot2 = null;
          this.filterAvailableUsers();
          return;
        }
        this.userSlot2 = {
          user: selectedUser,
          details: this.gamesService.countResultsForUser(selectedUser.userId)
        };
      }
    }

    this.filterAvailableUsers();
  }

  public filterGamesByTournament(tournamentId: string): void {
    this.selectedTournament = null;

    if (!tournamentId) {
      this.filteredGames = this.allGames;
      this.filterH2HGames(this.userSlot1?.user?.userId, this.userSlot2?.user?.userId);
      return;
    }

    this.selectedTournament = this.allTournaments.filter(t => t.id === tournamentId)[0];

    this.filteredGames = this.filteredGames.filter((game) => {
      return game.tournamentIds.indexOf(tournamentId) > -1;
    });

    if (this.isFilterActive('h2h')) {
      this.filterH2HGames(this.userSlot1?.user?.userId, this.userSlot2?.user?.userId);
    }
  }

  public giveUpDeletion(): void {
    this.deletingGame = false;
    this.secBeforeDeletion = 3;
    if (this.deletionTimer) {
      this.deletionTimer.unsubscribe();
      this.deletionTimer = null;
    }
  }

  public initiateGameDeletion(): void {
    if (this.deletionTimer) {
      this.giveUpDeletion();
      return;
    }
    this.deletingGame = true;
    this.deletionTimer = timer(1000, 1000).subscribe(() => {
      this.secBeforeDeletion--;

      if (this.secBeforeDeletion <= 0) {
        this.deleteGame();
      }
    });
  }

  public isGameFavorite(gameId: string): boolean {
    return this.favoriteIds.indexOf(gameId) > -1;
  }

  public closeGamePreview(): void {
    this.selectedGame = null;
    this.selectFilter('all');
  }

  public viewDetails(game: ChessGame): void {
    this.selectedGame = game;
    this.activeFilter = 'game';
    this.router.navigate(['/games'], {
      queryParams: {
        gameId: game.gameId,
        activeFilter: 'game'
      }
    });
  }

  public selectFilter(filter: string, params?: Params): void {
    this.userSlot1 = null;
    this.userSlot2 = null;
    this.availableUsers = this.allUsers;
    this.filteredGames = [];
    this.displayH2HDetails = false;
    this.giveUpDeletion();

    let defaultParams: Params = {};
    if (params) {
      defaultParams = params;
    } else {
      defaultParams = {activeFilter: filter};
    }

    switch (defaultParams.activeFilter) {
      case 'all': {
        this.activeFilter = defaultParams.activeFilter;
        this.filteredGames = this.allGames;
        break;
      }
      case 'favorites': {
        this.activeFilter = defaultParams.activeFilter;
        this.filterFavorites();
        break;
      }
      case 'h2h': {
        this.userSlot1 = null;
        this.userSlot2 = null;
        this.activeFilter = defaultParams.activeFilter;
        this.filteredGames = [];
        if (defaultParams.user1) {
          const user1 = this.allUsers.filter(u => u.userId === defaultParams.user1)[0];
          this.selectUser(1, user1);
        }
        if (defaultParams.user2) {
          const user2 = this.allUsers.filter(u => u.userId === defaultParams.user2)[0];
          this.selectUser(2, user2);
        }

        if (this.userSlot1?.user?.userId && this.userSlot2?.user?.userId) {
          this.filterH2HGames(this.userSlot1?.user?.userId, this.userSlot2?.user?.userId);
        }
        break;
      }
      case 'game': {
        this.activeFilter = defaultParams.activeFilter;
        if (this.selectedGame?.gameId && defaultParams) {
          Object.assign(defaultParams, {gameId: this.selectedGame.gameId});
        }
        break;
      }
      default: {
        this.selectFilter('all');
        return;
      }
    }

    this.router.navigate(['/games'], {queryParams: defaultParams});
  }

  public isFilterActive(f: string): boolean {
    return this.activeFilter === f;
  }

  public isTournamentDisabled(startDate: string): boolean {
    return new Date().getTime() < new Date(+startDate).getTime();
  }

  public exportJSON(): void {
    const stringified = encodeURIComponent(JSON.stringify(this.filteredGames));

    window.location.href = `mailto:${this.user.email}?subject=${this.filteredGames.length} Chess games&body=${stringified}`;
  }

  public clearH2HFilter(): void {
    this.userSlot1 = null;
    this.userSlot2 = null;
    this.displayH2HDetails = false;

    this.filteredGames = [];
    this.availableUsers = this.allUsers;
  }

  public filterH2HGames(id1: string, id2: string): void {
    this.filteredGames = [];

    if (id1 && id2) {
      if (this.selectedTournament?.id) {
        this.filteredGames = this.allGames.filter((game) => {
          return (game.participant1.userId === id1 && game.participant2.userId === id2 && game.tournamentIds.indexOf(this.selectedTournament.id) > -1) ||
            (game.participant2.userId === id1 && game.participant1.userId === id2 && game.tournamentIds.indexOf(this.selectedTournament.id) > -1);
        });
      } else {
        this.filteredGames = this.allGames.filter((game) => {
          return (game.participant1.userId === id1 && game.participant2.userId === id2) ||
            (game.participant2.userId === id1 && game.participant1.userId === id2);
        });
      }

      this.displayH2HDetails = true;
    }

    if (!this.allUsers.length) {
      return;
    }

    if (id1) {
      this.userSlot1 = {
        user: this.allUsers.filter(u => u.userId === id1)[0],
        details: this.gamesService.countResultsForUser(id1, this.filteredGames)
      };
    }

    if (id2) {
      this.userSlot2 = {
        user: this.allUsers.filter(u => u.userId === id2)[0],
        details: this.gamesService.countResultsForUser(id2, this.filteredGames)
      };
    }
  }

  private deleteGame(): void {
    this.deletingGame = true;
    this.gamesService.deleteGameById(this.selectedGame.gameId).then(() => {
      this.snackBar.open('Game Deleted', '', {
        duration: 1500,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snack-success']
      });

      this.gamesService.refreshAllGames();
    }).finally(
      () => {
        this.giveUpDeletion();
        this.closeGamePreview();
      }
    );
  }

  private filterFavorites(): void {
    this.filteredGames = this.allGames.filter(g => this.isGameFavorite(g.gameId));
  }

  private filterAvailableUsers(): void {
    this.availableUsers = this.allUsers.filter((user) => {
      return [this.userSlot1?.user?.userId, this.userSlot2?.user?.userId].indexOf(user?.userId) === -1;
    });
  }

  private handleQueryParams(): void {
    if (this.paramsSub) {
      return;
    }

    this.paramsSub = this.activatedRoute.queryParams.subscribe((params) => {
      if (params.gameId) {
        const game = this.allGames.filter(g => g.gameId === params.gameId)[0];
        if (game) {
          this.selectedGame = game;
        } else {
          this.selectFilter('all');
        }
      } else if (params.activeFilter === 'h2h') {
        this.filterH2HGames(params.user1, params.user2);
      }

      this.selectFilter(null, params);
    });
  }

}
