import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {HomeComponent} from './pages/home/home.component';
import {MyProfileComponent} from './pages/my-profile/my-profile.component';
import {NewGameComponent} from './pages/new-game/new-game.component';
import {AuthenticationComponent} from './pages/authentication/authentication.component';
import {environment} from '../environments/environment';
import {AngularFireModule} from '@angular/fire';
import {FormsModule} from '@angular/forms';
import {RulesComponent} from './pages/rules/rules.component';
import {GamesComponent} from './pages/games/games.component';
import {TournamentsComponent} from './pages/tournaments/tournaments.component';
import {CommunityComponent} from './pages/community/community.component';
import {GameClockComponent} from './pages/game-clock/game-clock.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatInputModule} from '@angular/material/input';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule, MatOptionModule} from '@angular/material/core';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatSelectModule} from '@angular/material/select';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import { GameCardComponent } from './pages/games/game-card/game-card.component';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    MyProfileComponent,
    NewGameComponent,
    AuthenticationComponent,
    RulesComponent,
    GamesComponent,
    TournamentsComponent,
    CommunityComponent,
    GameClockComponent,
    GameCardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebase),
    FormsModule,
    MatInputModule,
    BrowserAnimationsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonToggleModule,
    MatSelectModule,
    MatOptionModule,
    MatSnackBarModule,
    MatIconModule,
    MatButtonModule
  ],
  providers: [MatDatepickerModule],
  bootstrap: [AppComponent]
})
export class AppModule {
}
