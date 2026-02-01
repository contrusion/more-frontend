import { NgModule } from '@angular/core';
import { AuthModule, LogLevel, StsConfigLoader, StsConfigStaticLoader } from 'angular-auth-oidc-client';

@NgModule({
  imports: [
    AuthModule.forRoot({
      loader: {
        provide: StsConfigLoader,
        useFactory: () => 
          new StsConfigStaticLoader({
            authority: 'http://localhost:8080/realms/mo',
            redirectUrl: window.location.origin + '/callback',
            postLogoutRedirectUri: window.location.origin,
            clientId: 'mo-fe',
            scope: 'openid profile email offline_access',
            responseType: 'code',
            silentRenew: true,
            useRefreshToken: true,
            logLevel: LogLevel.Debug,
            secureRoutes: ['http://localhost:8081/']
          }),
      },
    }),
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}