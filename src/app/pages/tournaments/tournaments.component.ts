import {Component, OnDestroy, OnInit} from '@angular/core';
import {ChessLocation, ChessTournament} from '../../../assets/chess-log.model';
import {TournamentsService} from '../../services/tournaments.service';
import {Subscription} from 'rxjs';
import {LocationsService} from '../../services/locations.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-tournaments',
  templateUrl: './tournaments.component.html',
  styleUrls: ['./tournaments.component.scss']
})
export class TournamentsComponent implements OnInit, OnDestroy {

  public readonly multipleLocation: ChessLocation = {
    name: 'More Locations',
    dateTimeCreated: null,
    id: '00000000-0000-0000-0000-000000000000'
  };

  public activeTab: string;
  public newLocationName: string;
  public submitting: boolean;
  public enteringNewLocation: boolean;
  public submittingNewLocation: boolean;
  public allTournaments: ChessTournament[];

  public newTournament: ChessTournament;
  public locations: ChessLocation[];
  public startDate: Date;
  public endDate: Date;

  private subs: Subscription[];

  constructor(private tournamentsService: TournamentsService,
              private locationsService: LocationsService,
              private snackBar: MatSnackBar) {
    this.locations = [];
    this.allTournaments = [];
    this.subs = [];
    this.activeTab = 'all';
    this.clearTournament();
  }

  ngOnInit(): void {
    this.fetchLocations();

    this.tournamentsService.allTournaments.subscribe((tournaments) => {
      this.allTournaments = tournaments;
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  public assignDate(period: 'start' | 'end', value: any): void {
    switch (period) {
      case 'start': {
        this.newTournament.startDateTime = new Date(value).getTime().toString();
        break;
      }
      case 'end': {
        this.newTournament.endDateTime = new Date(value).getTime().toString();
        break;
      }
    }
  }

  public isTabActive(tab: string): boolean {
    return tab === this.activeTab;
  }

  public selectTab(tab: string): void {
    this.activeTab = tab;
  }

  public createTournament(): void {
    this.submitting = true;
    this.assignDate('start', this.startDate);
    this.assignDate('end', this.endDate);

    this.tournamentsService.createTournament(this.newTournament).then(
      () => {
        this.snackBar.open('Tournament Created', '', {
          duration: 1500,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snack-success']
        });

        this.tournamentsService.refreshAllTournaments();
        this.clearTournament();
      }
    );
  }

  public addLocation(): void {
    this.submittingNewLocation = true;
    this.locationsService.addLocation(this.newLocationName).then(
      () => {
        this.submittingNewLocation = false;
        this.fetchLocations(this.newLocationName);
      });
  }

  public selectLocation(location: ChessLocation): void {
    this.enteringNewLocation = false;
    this.newLocationName = '';
    this.newTournament.location = location;
  }

  public enterNewLocation(): void {
    this.enteringNewLocation = true;
  }

  public isSubmitDisabled(): boolean {
    return this.submitting ||
      !this.newTournament?.name ||
      !this.newTournament?.location?.id ||
      !this.startDate ||
      !this.endDate;
  }

  private clearTournament(): void {
    this.submitting = false;
    this.startDate = null;
    this.endDate = null;

    this.newTournament = {
      comments: [],
      dateTimeCreated: '',
      description: '',
      endDateTime: '',
      gamesPlayed: 0,
      id: '',
      images: [],
      location: null,
      name: '',
      startDateTime: ''
    };
  }

  private fetchLocations(preselect?: string): void {
    this.locations = [this.multipleLocation];

    this.locationsService.fetchAllLocations().subscribe(
      response => {
        if (!response) {
          return;
        }
        response.forEach((l) => {
          this.locations.push(l.data());
        });

        if (this.locations.length) {
          if (preselect) {
            const location = this.locations.filter(l => l.name === preselect)[0];
            this.selectLocation(location);
          } else {
            this.selectLocation(this.locations[0]);
          }
        }
      });
  }

}
