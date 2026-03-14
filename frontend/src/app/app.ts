import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  template: `
    <main class="app-container">
      <router-outlet />
    </main>
  `,
  styles: [`
    .app-container {
      width: 100%;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
  `],
})
export class App implements OnInit {
  protected readonly title = signal('Queue Swap App');
  private http = inject(HttpClient);
  protected backendMessage = signal<string>('Checking connection...');

  ngOnInit() {
    this.http.get<{ message: string }>('http://localhost:5000/api/health').subscribe({
      next: (response) => {
        this.backendMessage.set(response.message);
      },
      error: (err) => {
        this.backendMessage.set('Failed to connect to backend');
        console.error('Backend connection error:', err);
      }
    });
  }
}
