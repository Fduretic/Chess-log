import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {BehaviorSubject, forkJoin} from 'rxjs';
import {BasicUserModel, ChessGame, ChessGameComment, ResultsPreview} from '../../assets/chess-log.model';
import {AngularFireAuth} from '@angular/fire/auth';
import firebase from 'firebase';
import {TournamentsService} from './tournaments.service';

@Injectable({
  providedIn: 'root'
})
export class GamesService {

  public allGames: BehaviorSubject<ChessGame[]>;

  // MyGames je možda nepotreban. To consider...
  public myGames: BehaviorSubject<ChessGame[]>;
  public favoriteIDs: BehaviorSubject<string[]>;

  constructor(
    private db: AngularFirestore,
    private auth: AngularFireAuth,
    private tournamentsService: TournamentsService) {
    this.allGames = new BehaviorSubject<ChessGame[]>([]);
    this.myGames = new BehaviorSubject<ChessGame[]>([]);
    this.favoriteIDs = new BehaviorSubject<string[]>([]);
  }

  public countResultsForUser(userId: string, games?: ChessGame[]): ResultsPreview {
    if (!games) {
      games = this.allGames.getValue().filter(g => [g.participant1.userId, g.participant2.userId].indexOf(userId) > -1);
    }

    if (!games?.length) {
      return {
        won: 0,
        lost: 0,
        stalemate: 0,
        total: 0,
        playedBlack: 0,
        playedWhite: 0
      };
    }

    let won = 0;
    let stalemate = 0;
    let lost = 0;
    let playedBlack = 0;
    let playedWhite = 0;
    const total = games.length;

    for (const game of games) {
      if (game.participant1.userId === userId) {
        playedWhite++;

        if (game.result === 1) {
          won++;
        } else if (game.result === 0) {
          stalemate++;
        } else {
          lost++;
        }

      } else if (game.participant2.userId === userId) {
        playedBlack++;

        if (game.result === 2) {
          won++;
        } else if (game.result === 0) {
          stalemate++;
        } else {
          lost++;
        }
      }
    }

    return {
      won,
      stalemate,
      lost,
      total,
      playedWhite,
      playedBlack
    };
  }

  public refreshMyGames(uid): void {
    const myGames: ChessGame[] = [];

    this.fetchGamesByUserId(uid).subscribe(
      (responses) => {
        for (const response of responses) {
          response.forEach((r) => {
            myGames.push(r.data());
          });
        }
        this.myGames.next(myGames);
      }, (errors) => {
        this.myGames.next([]);
      });
  }

  public fetchAllGames(): any {
    return this.db.collection('games').get();
  }

  public clearFavoriteIDs(): void {
    this.favoriteIDs.next([]);
  }

  public removeFromFavorites(gameId: string): void {
    this.auth.user.subscribe(user => {
      this.db.collection('favorites').doc(user.uid).update({
        gameIds: firebase.firestore.FieldValue.arrayRemove(gameId)
      }).then(() => {
        this.refreshFavoriteIDs();
      }).catch(
        () => {
          this.refreshFavoriteIDs();
        });
    });
  }

  public addToFavorites(gameId: string): void {
    this.auth.user.subscribe(user => {
      this.db.collection('favorites').doc(user.uid).update({
        gameIds: firebase.firestore.FieldValue.arrayUnion(gameId)
      }).then(() => {
        this.refreshFavoriteIDs();
      }).catch(
        () => {
          this.refreshFavoriteIDs();
        });
    });
  }

  public refreshAllGames(): void {
    let allGames = [];

    this.fetchAllGames().subscribe((response) => {
      response.forEach((game) => {
        allGames.push(game.data());
      });


      allGames = JSON.parse(JSON.stringify(allGames)).sort((a, b) => {
        return (b.dateTimeCreated - a.dateTimeCreated);
      }).sort((a, b) => {
        return (b.dateTimePlayed - a.dateTimePlayed);
      });
      localStorage.setItem('ChessGames', JSON.stringify(allGames));
      this.allGames.next(allGames);
    });
  }

  public refreshFavoriteIDs(): any {
    this.auth.user.subscribe(user => {
      this.db.collection('favorites').doc(user.uid).get().subscribe(
        (res: any) => {
          this.favoriteIDs.next(res.data().gameIds);
        }, () => {
          this.favoriteIDs.next([]);
        });
    });
  }

  public deleteGameById(gameId: string): Promise<void> {
    return this.db.collection('games').doc(gameId).delete();
  }

  // public remapGames(): void {
  //   const newGames = this.allGames.getValue();
  //   newGames.forEach((game) => {
  //     game.participant1 = game.participant1[0];
  //     game.participant2 = game.participant2[0];
  //
  //     this.db.collection('games').doc(game.gameId).update({
  //       participant1: game.participant1,
  //       participant2: game.participant2
  //     }).then(() => {
  //     }).catch(
  //       () => {
  //       });
  //   });
  // }

  public submitComment(gameId: string, myUser: BasicUserModel, comment: ChessGameComment): any {
    comment.creator = myUser;
    comment.dateTimeCreated = new Date().getTime().toString();

    return this.db.collection('games').doc(gameId).update({
      comments: firebase.firestore.FieldValue.arrayUnion(comment)
    });
  }

  public addCommentToGame(gameId: string, comment: ChessGameComment): void {
    // DA IZBJEGNEMO POZIV NA BACKEND NAKON KREIRANJA, SAMO SE UBACI NOVI KOMENTAR U LISTU
    const games = this.allGames.getValue();
    for (const game of games) {
      if (game.gameId === gameId) {
        game.comments.push(comment);
        break;
      }
    }

    this.allGames.next(games);
  }

  public fetchGamesByUserId(uid: string): any {
    const requests = [];

    const req1 = this.db.collection('games', ref => ref.where('participant1.userId', '==', uid)).get();
    const req2 = this.db.collection('games', ref => ref.where('participant2.userId', '==', uid)).get();

    requests.push(req1);
    requests.push(req2);
    return forkJoin(requests);
  }

  public addGameToTournament(gameId: string, tournamentId: string): any {
    return this.db.collection('games').doc(gameId).update({
      tournamentIds: firebase.firestore.FieldValue.arrayUnion(tournamentId)
    });
  }
}
