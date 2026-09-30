import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { App } from './app';import { Home } from './pages/home/home';
describe('Application routing',()=>{
 it('renders the CampusLab home at the root route',async()=>{
  TestBed.configureTestingModule({imports:[App],providers:[provideRouter([{path:'',component:Home}])]});
  const fixture=TestBed.createComponent(App);await TestBed.inject(Router).navigateByUrl('/');await fixture.whenStable();
  expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain('Tu laboratorio');
 });
});
