import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environments';
import { AuthStatus, CheckTokenResponse, LoginResponse, User } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly baseUrl:string = environment.baseUrl;
  private httpClient = inject(HttpClient)

  private _currentUser = signal<User|null>(null);
  private _authStatus = signal<AuthStatus>(AuthStatus.checking);

  public currentUser = computed(() => this._currentUser());
  public authStatus = computed(() => this._authStatus());

  constructor() {
    this.checkAuthStatus().subscribe();
  }

  private setAuthentication(user:User, token:string):boolean {
    this._currentUser.set(user);
    this._authStatus.set(AuthStatus.authenticated);
    localStorage.setItem('token', token);
    return true;
  }
  private setUnAuthorication():Observable<boolean> {
    this._currentUser.set(null);
    this._authStatus.set(AuthStatus.notAuthenticated);
    localStorage.setItem('token', '');
    return of(false)
  }

  login(email:string, password:string):Observable<boolean> {
    const url = `${this.baseUrl}/auth/login`;
    const body = {email: email, password: password};

    return this.httpClient.post<LoginResponse>(url, body)
      .pipe(
        map( ({user, token}) =>{
          return this.setAuthentication(user, token);
          // this._currentUser.set(user);
          // this._authStatus.set(AuthStatus.authenticated);
          // localStorage.setItem('token', token);
          // console.log({user, token});
        }),
        // map(() => true),

        catchError(err => {
          return this.setUnAuthorication();
          // console.log({err});
          // this._currentUser.set(null);
          // this._authStatus.set(AuthStatus.notAuthenticated);
          // return throwError(() => err.error.message);
        })
      );

    return of(true);
  }

  checkAuthStatus():Observable<boolean> {
    const url = `${this.baseUrl}/auth/check-token`;
    const token = localStorage.getItem('token');

    // if (!token) return of(false);
    if (!token) {
      this.logout();
      return of(false);
    }

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`);

    return this.httpClient.get<CheckTokenResponse>(url, {headers: headers})
      .pipe(
        map(({user, token}) =>{
          return this.setAuthentication(user, token);
          // this._currentUser.set(user);
          // this._authStatus.set(AuthStatus.authenticated);
          // localStorage.setItem('token', token);
          // return true;
        }),
        catchError(() => {
          return this.setUnAuthorication();
          // this._currentUser.set(null);
          // this._authStatus.set(AuthStatus.notAuthenticated);
          // return of(false)
        })
      )
  }

  logout():Observable<boolean> {
    return this.setUnAuthorication();
  }
}
