import {AfterViewInit, Component, OnInit} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';
import {PasswordModel} from '../../../assets/chess-log.model';
import {AngularFirestore} from '@angular/fire/firestore';
import {GamesService} from '../../services/games.service';

@Component({
  selector: 'app-authentication',
  templateUrl: './authentication.component.html',
  styleUrls: ['./authentication.component.scss']
})
export class AuthenticationComponent implements OnInit, AfterViewInit {

  public submitting: boolean;
  public email: string;
  public password: PasswordModel;
  public displayName: string;
  public authType: 'login' | 'register';

  private readonly defaultPhotoURL = 'https://t3.ftcdn.net/jpg/03/52/12/58/360_F_352125886_7MsbhxC3xK4lCCfjJ7MezzmAv9x0qico.jpg';

  constructor(private auth: AngularFireAuth,
              private fireStore: AngularFirestore,
              private gamesService: GamesService,
              private router: Router) {
    this.clearPassword();
    this.setAuthType('login');
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.selectInput('e-mail-input');
  }

  public togglePasswordDisplay(): void {
    this.password.displayPassword = !this.password.displayPassword;
  }

  public submit(): void {
    this.submitting = true;
    if (this.authType === 'register') {
      this.register();
    } else {
      this.login();
    }
  }

  public setAuthType(action: 'login' | 'register'): void {
    this.displayName = '';
    this.authType = action;
    this.selectInput('e-mail-input');
  }

  public selectInput(id: string): void {
    const element = document.getElementById(id) as HTMLInputElement;
    if (!!element) {
      element.select();
    }
  }

  private register(): void {
    this.auth.createUserWithEmailAndPassword(this.email, this.password.newPassword).then(
      (response) => {
        this.submitting = false;
        response.user.updateProfile({displayName: this.displayName, photoURL: this.defaultPhotoURL}).then(() => {

          this.fireStore.collection('users').doc(response.user.uid).set({
            displayName: response.user.displayName,
            photoURL: response.user.photoURL,
            userId: response.user.uid,
            dateTimeCreated: new Date().toString()
          }).then(
            () => {
              this.router.navigate(['home']);
            });

        });
      }, error => {
        this.submitting = false;
      }
    );
  }

  private clearPassword(): void {
    this.password = {
      newPassword: '',
      displayPassword: false
    };
  }

  private login(): void {
    this.auth.signInWithEmailAndPassword(this.email, this.password.newPassword).then(
      (response) => {
        this.submitting = false;
        this.router.navigate(['home']);
        this.gamesService.refreshAllGames();
      }, error => {
        this.submitting = false;
      }
    );
  }
}
