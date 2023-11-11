import {Injectable} from '@angular/core';
import * as uuid from 'uuid';
import {AngularFirestore} from '@angular/fire/firestore';
import {Subject} from 'rxjs';
import {ChessLocation} from '../../assets/chess-log.model';

@Injectable({
  providedIn: 'root'
})
export class LocationsService {

  public allLocations: Subject<ChessLocation[]>;

  constructor(private db: AngularFirestore) {
    this.allLocations = new Subject<ChessLocation[]>();
  }

  public addLocation(locationName: string): Promise<any> {
    const newLocation = {
      name: locationName,
      dateTimeCreated: new Date().getTime().toString(),
      id: uuid.v4()
    };
    return this.db.collection('location').doc(newLocation.id).set(newLocation);
  }

  public fetchAllLocations(): any {
    return this.db.collection('location').get();
  }

  public refreshAllLocations(): void {
    let allLocations = [];
    this.fetchAllLocations().subscribe((response) => {
      response.forEach((game) => {
        allLocations.push(game.data());
      });

      allLocations = JSON.parse(JSON.stringify(allLocations)).sort((a, b) => {
        return (b.name - a.name);
      }).sort((a, b) => {
        return (b.name - a.name);
      });
      this.allLocations.next(allLocations);
    });
  }

}
