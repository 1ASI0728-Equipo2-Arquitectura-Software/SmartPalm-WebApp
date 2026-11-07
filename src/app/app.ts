import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalToastComponent } from './shared/presentation/global-toast/global-toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
