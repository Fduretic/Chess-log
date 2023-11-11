import {Injectable} from '@angular/core';
import {ChessTournament} from '../../assets/chess-log.model';
import {AngularFirestore} from '@angular/fire/firestore';
import * as uuid from 'uuid';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TournamentsService {

  public allTournaments: BehaviorSubject<ChessTournament[]>;

  constructor(private db: AngularFirestore) {
    this.allTournaments = new BehaviorSubject<ChessTournament[]>([]);
  }

  public getTournamentsByIDs(ids: string[]): ChessTournament[] {
    if (!ids || !ids.length) {
      return [];
    }

    return this.allTournaments.getValue().filter(t => ids.indexOf(t.id) > -1);
  }

  public createTournament(tournament: ChessTournament): Promise<any> {
    const tournamentId = uuid.v4();

    tournament.dateTimeCreated = new Date().getTime().toString();
    tournament.id = tournamentId;
    return this.db.collection('tournaments').doc(tournamentId).set(tournament);
  }

  public fetchAllTournaments(): any {
    return this.db.collection('tournaments').get();
  }

  public refreshAllTournaments(): void {
    let allTournaments = [];
    this.fetchAllTournaments().subscribe((response) => {
      response.forEach((t) => {
        allTournaments.push(t.data());
      });

      allTournaments = JSON.parse(JSON.stringify(allTournaments)).sort((a, b) => {
        return (b.dateTimeCreated - a.dateTimeCreated);
      }).sort((a, b) => {
        return (a.startDateTime - b.startDateTime);
      });
      this.allTournaments.next(allTournaments);
    });
  }
}
