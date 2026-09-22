import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminRecursos } from './admin-recursos';

describe('AdminRecursos', () => {
  let component: AdminRecursos;
  let fixture: ComponentFixture<AdminRecursos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRecursos],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRecursos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
