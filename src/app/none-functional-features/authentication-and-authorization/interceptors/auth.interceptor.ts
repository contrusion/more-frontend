import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private oidcSecurityService: OidcSecurityService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Only intercept requests going to secure routes
    if (!this.isSecureUrl(request.url)) {
      return next.handle(request);
    }

    return from(this.oidcSecurityService.getAccessToken()).pipe(
      switchMap(token => {
        if (!token) {
          return next.handle(request);
        }

        // Clone the request and add the authorization header
        const authReq = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });

        return next.handle(authReq);
      })
    );
  }

  private isSecureUrl(url: string): boolean {
    // Add logic to determine if a URL should have the auth token added
    // For example, only add tokens to your API endpoints
    return url.startsWith('http://localhost:8081/');
  }
}