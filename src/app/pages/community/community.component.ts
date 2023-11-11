import {Component, OnDestroy, OnInit} from '@angular/core';
import {BasicUserModel, ExpandedUserModel} from '../../../assets/chess-log.model';
import {Subscription} from 'rxjs';
import {UsersService} from '../../services/users.service';
import {GamesService} from '../../services/games.service';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';

@Component({
  selector: 'app-community',
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.scss']
})
export class CommunityComponent implements OnInit, OnDestroy {

  public users: BasicUserModel[];
  public myUser: BasicUserModel;
  public userDetails: ExpandedUserModel[];

  private subs: Subscription[];

  constructor(private usersService: UsersService,
              private router: Router,
              private auth: AngularFireAuth,
              private gamesService: GamesService) {
    this.userDetails = [];
    this.subs = [];
  }

  ngOnInit(): void {
    const s = this.usersService.allUsers.subscribe((users) => {
      this.users = users;

      const s1 = this.auth.user.subscribe((u) => {
        for (const user of this.users) {
          const details = {
            user,
            details: this.gamesService.countResultsForUser(user.userId)
          };

          if (user.userId === u.uid) {
            this.myUser = user;
            this.userDetails.unshift(details);
          } else {
            this.userDetails.push(details);
          }
        }
      });
      this.subs.push(s1);
    });
    this.subs.push(s);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  public openH2H(forPlayer: BasicUserModel): void {
    const params = {
      activeFilter: 'h2h',
      user1: this.myUser.userId,
      user2: forPlayer.userId
    };
    this.router.navigate(['/games'], {queryParams: params});
  }

}
