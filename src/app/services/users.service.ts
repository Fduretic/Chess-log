import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {BasicUserModel} from '../../assets/chess-log.model';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  public allUsers: BehaviorSubject<BasicUserModel[]>;

  public myUser: BasicUserModel;

  constructor(private fireStore: AngularFirestore,
              private auth: AngularFireAuth) {
    this.allUsers = new BehaviorSubject<BasicUserModel[]>([]);
  }

  public refreshAllUsers(): void {
    let users = [];

    this.fireStore.collection('users').get().subscribe(
      (res) => {
        res.forEach((data: any) => {
          users.push(data.data());
        });
        users = users.sort((a, b) => {
          return a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase());
        });

        this.assignMyUser();
        this.allUsers.next(users);
      });
  }

  private assignMyUser(): void {
    this.auth.user.subscribe((user) => {
      this.myUser = this.allUsers.getValue().filter(u => u.userId === user.uid)[0];
    });
  }

}
