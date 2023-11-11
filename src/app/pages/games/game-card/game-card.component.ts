import {Component, Input, OnInit} from '@angular/core';
import {ChessGame, ChessGameComment} from '../../../../assets/chess-log.model';
import * as uuid from 'uuid';
import {GamesService} from '../../../services/games.service';
import {UsersService} from '../../../services/users.service';
import {AngularFireStorage} from '@angular/fire/storage';

@Component({
  selector: 'app-game-card',
  templateUrl: './game-card.component.html',
  styleUrls: ['./game-card.component.scss']
})
export class GameCardComponent implements OnInit {

  @Input() game: ChessGame;
  @Input() displayDetails = false;
  @Input() isFavorite: boolean;

  public file: any;
  public newComment: ChessGameComment;
  public submittingPhoto: boolean;
  public submittingComment: boolean;

  constructor(private gamesService: GamesService,
              private storage: AngularFireStorage,
              private usersService: UsersService) {
    this.initComment();
  }

  ngOnInit(): void {
  }

  public toggleFavorite(): void {
    if (this.isFavorite) {
      this.gamesService.removeFromFavorites(this.game.gameId);
    } else {
      this.gamesService.addToFavorites(this.game.gameId);
    }
  }

  public removePhoto(): void {
    this.file = null;
    this.newComment.imageUrl = '';
  }

  public addPhoto(): void {
    const el = document.createElement('INPUT') as HTMLInputElement;
    el.type = 'file';
    el.accept = 'image/*';

    el.addEventListener('change', (event) => {
      if (el.files.length) {
        this.file = el.files[0];
        this.submittingPhoto = true;

        this.storage.upload(`/comment-images/${this.game.gameId}/${this.newComment.commentId}`, this.file).then(
          (onFulfilled) => {
            onFulfilled.ref.getDownloadURL().then((url) => {
              this.file = null;
              this.submittingPhoto = false;
              this.newComment.imageUrl = url;
            }).catch(() => {
              this.submittingPhoto = false;
            });
          });
      } else {
        this.submittingPhoto = false;
      }
    });

    el.click(); // open
  }

  public submitComment(): void {
    this.submittingComment = true;

    this.gamesService.submitComment(this.game.gameId, this.usersService.myUser, this.newComment).then((x) => {
      this.gamesService.addCommentToGame(this.game.gameId, this.newComment);
      this.initComment();
    }).catch(
      (error) => {
        console.log('ERROR ', error);
      }).finally(
      () => {
        this.submittingComment = false;
      });
  }

  private initComment(): void {
    this.newComment = {
      commentId: uuid.v4(),
      creator: this.usersService.myUser,
      dateTimeCreated: null,
      content: ''
    };
  }

}
