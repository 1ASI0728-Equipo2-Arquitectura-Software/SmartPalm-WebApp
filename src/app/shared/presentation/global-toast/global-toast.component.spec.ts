import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { GlobalToastService } from '../../infrastructure/global-toast.service';
import { TranslationService } from '../../../i18n/translation.service';
import { GlobalToastComponent } from './global-toast.component';

describe('GlobalToastComponent', () => {
  let fixture: ComponentFixture<GlobalToastComponent>;
  let toastService: GlobalToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalToastComponent],
      providers: [
        GlobalToastService,
        {
          provide: TranslationService,
          useValue: { translate: vi.fn((key: string) => key === 'notifications.close' ? 'Cerrar notificación' : key) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GlobalToastComponent);
    toastService = TestBed.inject(GlobalToastService);
  });

  it('renders success and error messages with accessible roles', () => {
    toastService.showSuccess('Usuario eliminado con éxito.');
    fixture.detectChanges();

    let element = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    expect(element.textContent).toContain('Usuario eliminado con éxito.');

    toastService.showError('No se pudo eliminar el usuario.');
    fixture.detectChanges();

    element = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(element.textContent).toContain('No se pudo eliminar el usuario.');
  });

  it('dismisses the toast from the close button', () => {
    toastService.showSuccess('Usuario eliminado.');
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(toastService.toast()).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
  });
});
