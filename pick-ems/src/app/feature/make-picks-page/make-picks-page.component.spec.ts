import { ComponentFixture, TestBed } from '@angular/core/testing';

import MakePicksPageComponent from './make-picks-page.component';

describe('MakePicksPageComponent', () => {
  let component: MakePicksPageComponent;
  let fixture: ComponentFixture<MakePicksPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MakePicksPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MakePicksPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
