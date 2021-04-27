import { Injectable } from '@angular/core';
import {Book} from '../models/book';
// tslint:disable-next-line:import-blacklist
import {Subject} from 'rxjs';
import { HttpClient } from '@angular/common/http';
// @ts-ignore
import firebase from '@firebase/app';

import {database} from 'firebase-admin/lib/database';
// @ts-ignore
import { DataSnapshot } from 'firebase-admin/lib/database';
// @ts-ignore
import {error} from '@angular/compiler/src/util';
// @ts-ignore
require('firebase/database');
// @ts-ignore
require('firebase/storage');


@Injectable({
  providedIn: 'root'
})

@Injectable()
export class BooksService {

  books: Book[] = [];
  booksSubject = new Subject<Book[]>();

  constructor(private httpClient: HttpClient) {
    this.getBooks();
  }


  // tslint:disable-next-line:typedef
  emitBooks() {
    // @ts-ignore
    this.booksSubject.next(this.books);
  }

  // tslint:disable-next-line:typedef
  saveBooks() {
    // @ts-ignore
    firebase.database().ref('/books').set(this.books);

    // this.httpClient.put('https://mybibliapp-default-rtdb.firebaseio.com/books.json',
    //   this.books).subscribe(
    //   () => {
    //     console.log('Enregistrement terminé !');
    //   },
    //   // tslint:disable-next-line:no-shadowed-variable
    //   (error) => {
    //     console.log('Erreur ! : ' + error);
    //   }
    // );
  }

  // tslint:disable-next-line:typedef
  getBooks() {
    // @ts-ignore
    firebase.database().ref('/books').on('value', (data: DataSnapshot) => {
      this.books = data.val() ? data.val() : [];
      this.emitBooks();
    }
  );
  //   this.httpClient
  //     .get<any[]>('https://mybibliapp-default-rtdb.firebaseio.com/books.json')
  //     .subscribe(
  //     (response) => {
  //       this.books = response;
  //       this.emitBooks();
  //       // @ts-ignore
  //       console.log(response[this.booksSubject.forEach(this.books.findIndex)]);
  //     },
  //     (error1 ) => {
  //       console.log('Erreur ! : ' + error);
  //     }
  //   );
  }

  // tslint:disable-next-line:typedef
  onFetch() {
    this.getBooks();
  }

  // Récupérer un livre par son id
  // tslint:disable-next-line:typedef
  // getSingleBook(id: number) {
  //   const book = this.books.find(
  //     (s) => {
  //       // @ts-ignore
  //       return s.id === id;
  //     }
  //   );
  //   return book;
  // }

  // tslint:disable-next-line:typedef
  getSingleBook(id: number) {
    console.log('je suis dans books.services.ts, fonction: getSingleBook, id récupéré = ' + id);
    return new Promise(
      (resolve, reject) => {
        // On utilise once() pour ne faire qu'une seule requêtte
        // @ts-ignore
        firebase.database().ref('/books' + id).once('value').then(
          (data: DataSnapshot) => {
            // La methode val() retourne la valeur des données.
            resolve(data.val());
            // tslint:disable-next-line:no-shadowed-variable
          }, (error) => {
            reject(error);
          }
        );
      }
    );
  }

  // Création d'un nouveau livre
  // tslint:disable-next-line:typedef
  createNewBook(newBook: Book) {
    this.books.push(newBook);
    this.saveBooks();
    this.emitBooks();
  }

  // Suppression d'un livre
  // tslint:disable-next-line:typedef
  removeBook(book: Book) {
    // supprime la photo lié au livre lors de sa supression
    if (book.photo) {
      // Puisque qu'il faut une référence pour supprimer un fichier avec la méthode delete(),
      // On passe l'URL du fichier à refFromUrl() pour en récupérer la référence.
      // @ts-ignore
      const storageRef = firebase.storage().refFromURL(book.photo);
      storageRef.delete().then(
        () => {
          console.log('Could not remove photo! : ' + error);
        }
      );
    }
    const bookIndexToRemove = this.books.findIndex(
      // tslint:disable-next-line:no-shadowed-variable
      (bookE1) => {
        if (bookE1 === book) {
          return true;
        }
      }
    );
    console.log('je suis dans removeBook dans book-list.component');
    console.log('book-id = ' + this.books.slice(bookIndexToRemove, 1));
    this.books.splice(bookIndexToRemove, 1);
    this.saveBooks();
    this.emitBooks();
  }

  // *************************************************************
  // Methode qui permet d'uploader une photo
  // comme l'action de télécharger prend du temps on va créez une méthode asynchrone qui retourne une Promise;
// tslint:disable-next-line:typedef
  uploadFile(file: File) {
    return new Promise(
      (resolve, reject) => {
        // création d'un string à partir de Date.now(), pour avoir un nom unique pour le fichier
        const almostUniqueFileName = Date.now().toString();
        // @ts-ignore
        // création d'une tâche de chargement upload qui retourne une ref()
        const upload = firebase.storage().ref()
          // la méthode child() retourne une référence au sous-dossier images
          // et à un nouveau fichier dont le nom est l'identifiant unique + le nom original du fichier
          // permettant de garder le format d'origine également
          .child('images/' + almostUniqueFileName + file.name).put(file);
        // @ts-ignore

        // methode on() de la tâche upload pour en suivre l'état, en y passant trois fonctions:
        upload.on(firebase.storage.TaskEvent.STATE_CHANGED,
          // déclenchement quand les données sont envoyées vers le serveur
          () => {
            console.log('Chargement…');
          },
          // déclenchement quand le serveur renvoie une erreur
          // tslint:disable-next-line:no-shadowed-variable
          (error) => {
            console.log('Erreur de chargement ! : ' + error);
            reject();
          },
          // déclenchement lorsque le chargement est terminé et permet de retourner l'URL unique du fichier chargé
          () => {
            resolve(upload.snapshot.ref.getDownloadURL());
          }
        );
      }
    );
  }
}
