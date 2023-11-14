import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
declare var webkitSpeechRecognition: any;

@Injectable({
  providedIn: 'root',
})
export class VoiceRecognitionService {
  recognition = new webkitSpeechRecognition();
  isStoppedSpeechRecog = false;
  public text = '';
  tempWords: any;
  transcript_arr = new Subject<string>();
  confidence_arr = [];
  isStarted = false; //<< this Flag to check if the user stop the service
  isStoppedAutomatically = true; //<< this Flag to check if the service stopped automaticically.
  constructor() {
    // Check if the webkitSpeechRecognition API is available
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new webkitSpeechRecognition();
      // Additional configuration and event handling can be done here
    } else {
      console.error('Speech recognition is not supported in this browser.');
    }

  }

  init() {
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'hr-HR';

    this.recognition.addEventListener('result', (e: any) => {
      this.transcript_arr.next(null);
      const transcript = Array.from(e.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join('');
      this.transcript_arr.next(transcript);
      this.tempWords = transcript;
      console.log(this.transcript_arr);

      this.confidence_arr = [];
      const confidence = Array.from(e.results)
        .map((result: any) => result[0])
        .map((result) => result.confidence)
        .join('');
      this.confidence_arr.push(confidence);
      console.log(this.confidence_arr);
    });

    this.recognition.addEventListener('end', (condition: any) => {
      this.wordConcat();
      console.log('automatic!!');
      if (this.isStoppedAutomatically) {
        this.recognition.stop();
        this.recognition.start();
        this.isStoppedAutomatically = true;
      }
    });
  }

  start() {
    if (!this.isStarted) {
      this.recognition.start();
      this.isStarted = true;
      console.log('Speech recognition started');
    }
    return true;
  }
  stop() {
    if (this.isStarted) {
      this.isStoppedAutomatically = false;
      this.wordConcat();
      this.recognition.stop();
      this.isStarted = false;
      this.text = '';
      this.transcript_arr.next(null);
      this.confidence_arr = null;
      console.log('End speech recognition2');
    }
    return false;
  }

  wordConcat() {
    this.text = this.text + ' ' + this.tempWords + '.';
    this.tempWords = '';
  }
}