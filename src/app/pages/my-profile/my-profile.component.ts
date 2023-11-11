import {Component, OnDestroy, OnInit} from '@angular/core';
import firebase from 'firebase';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFireStorage} from '@angular/fire/storage';
import {Subscription} from 'rxjs';
import {PasswordModel, ResultsPreview} from '../../../assets/chess-log.model';
import {Router} from '@angular/router';
import {AngularFirestore} from '@angular/fire/firestore';
import {GamesService} from '../../services/games.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss']
})
export class MyProfileComponent implements OnInit, OnDestroy {

  public user: firebase.User;
  public file: any;
  public changingPhoto: boolean;
  public changingPassword: boolean;
  public passwordChange: PasswordModel;
  public resultsPreview: ResultsPreview;

  private subs: Subscription[];

  constructor(
    private router: Router,
    private storage: AngularFireStorage,
    private fireStore: AngularFirestore,
    private db: AngularFirestore,
    private auth: AngularFireAuth,
    private gamesService: GamesService,
    private snackBar: MatSnackBar) {
    this.subs = [];

    this.clearPasswordChange();
  }

  ngOnInit(): void {
    const s1 = this.auth.user.subscribe((user) => {
      this.user = user;

      const s2 = this.gamesService.allGames.subscribe(
        (games) => {
          this.resultsPreview = this.gamesService.countResultsForUser(this.user.uid);
        }
      );
      this.subs.push(s2);
    });

    this.subs.push(s1);
  }

  ngOnDestroy(): void {
    for (const s of this.subs) {
      s.unsubscribe();
    }
  }

  public changeProfilePhoto(): void {
    if (this.changingPhoto) {
      return;
    }

    const el = document.createElement('INPUT') as HTMLInputElement;
    el.type = 'file';
    el.accept = 'image/*';

    el.addEventListener('change', (event) => {
      if (el.files.length) {
        this.changingPhoto = true;
        this.file = el.files[0];

        this.user.updateProfile({photoURL: null}).then(() => {
          this.uploadImage();
        });
      }
    });

    el.click(); // open
  }

  public changePassword(): void {
    this.changingPassword = true;
    this.user.updatePassword(this.passwordChange.newPassword).finally(
      () => {
        this.changingPassword = false;

        this.snackBar.open('Password changed. Please log in again.', '', {
          duration: 1500,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snack-success']
        });

        this.auth.signOut().then(
          (response) => {
            this.router.navigate(['login']);
          }
        );
      }
    );
  }

  public toggleDisplayPassword(): void {
    this.passwordChange.displayPassword = !this.passwordChange.displayPassword;
  }

  private clearPasswordChange(): void {
    this.passwordChange = {
      newPassword: '',
      displayPassword: false
    };
  }

  private uploadImage(): void {
    this.storage.upload(`/profile-pics/${this.user.uid}`, this.file).then(
      (onFulfilled) => {
        onFulfilled.ref.getDownloadURL().then((url) => {
          this.file = null;
          this.changingPhoto = false;
          this.user.updateProfile({photoURL: url}).then(() => {
            this.fireStore.collection('users').doc(this.user.uid).update({photoURL: url});
          });
        });
      });
  }
}
