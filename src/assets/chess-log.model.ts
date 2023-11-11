export interface HomeButton {
  iconClass: string;
  label: string;
  routerLink: string;
}

export interface PasswordModel {
  newPassword?: string;
  oldPassword?: string;
  displayPassword?: boolean;
}

export interface BasicUserModel {
  displayName: string;
  photoURL: string;
  userId: string;
  dateTimeCreated?: string;
}

export interface ExpandedUserModel {
  user: BasicUserModel;
  details: ResultsPreview;
}

export interface ResultsPreview {
  won: number;
  stalemate: number;
  lost: number;
  total: number;
  playedWhite: number;
  playedBlack: number;
}

export interface ChessGame {
  authorId: string;
  authorName: string;
  comments?: ChessGameComment[];
  dateTimePlayed: string;
  dateTimeCreated: string;
  gameId: string;
  participant1: BasicUserModel;
  participant2: BasicUserModel;
  result?: GameResult;
  note: string;
  tournamentIds: string[];
  tournaments?: ChessTournament[];
}

export enum GameResult {
  Stalemate,
  Player1,
  Player2
}

export interface ChessGameComment {
  commentId: string;
  creator: BasicUserModel;
  dateTimeCreated: string;
  content: string;
  imageUrl?: string;
}

export interface ChessLocation {
  name: string;
  id: string;
  dateTimeCreated: string;
}

export interface ChessTournament {
  comments: ChessGameComment[];
  dateTimeCreated: string;
  description: string;
  endDateTime: string;
  gamesPlayed: number;
  id: string;
  images: string[];
  location: ChessLocation;
  name: string;
  startDateTime: string;
}
