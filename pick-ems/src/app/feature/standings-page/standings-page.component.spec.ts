import { ComponentFixture, TestBed } from '@angular/core/testing';

import StandingsPageComponent from './standings-page.component';

describe('StandingsPageComponent', () => {
  let component: StandingsPageComponent;
  let fixture: ComponentFixture<StandingsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StandingsPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StandingsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
