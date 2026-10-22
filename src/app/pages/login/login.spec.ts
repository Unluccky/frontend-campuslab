import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { MicrosoftAuth } from '../../core/microsoft-auth';
import { signal } from '@angular/core';
import { AuthService } from '../../core/auth';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{provide: MicrosoftAuth, useValue: {account: signal(null), busy: signal(false), error: signal(''), login: () => Promise.resolve()}}, provideRouter([]), provideHttpClient(), {provide: AuthService, useValue: {hasValidToken: () => false}}],
      imports: [Login],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
