import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs/operators';

@Component({
    selector: 'app-business-queue',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './business-queue.component.html',
    styleUrls: ['./business-queue.component.css']
})
export class BusinessQueueComponent implements OnInit {
    uniqueId: string = '';
    isLoading: boolean = false;
    message: string | null = null;
    messageType: 'success' | 'error' | null = null;
    servedCustomer: any = null;

    constructor(
        private http: HttpClient,
        private cd: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
    }

    markAsServed() {
        if (!this.uniqueId.trim()) {
            this.showMessage('Please enter a unique ID', 'error');
            return;
        }

        this.isLoading = true;
        this.message = null;
        this.servedCustomer = null;

        const apiUrl = `https://queueswap-production.up.railway.app/api/business/queue/update`;

        console.log('[BusinessQueueComponent] Marking as served:', this.uniqueId);

        this.http.put<any>(apiUrl, {
            uniqueId: this.uniqueId,
            status: 'Served'
        }).pipe(
            timeout(10000)
        ).subscribe({
            next: (response) => {
                console.log('[BusinessQueueComponent] Success:', response);
                this.servedCustomer = response.queueEntry;
                this.showMessage(response.message, 'success');
                this.uniqueId = '';
                this.isLoading = false;
                this.cd.detectChanges();
            },
            error: (err) => {
                console.error('[BusinessQueueComponent] Error:', err);
                const errorMsg = err.error?.message || 'Failed to update queue entry';
                this.showMessage(errorMsg, 'error');
                this.isLoading = false;
                this.cd.detectChanges();
            }
        });
    }

    showMessage(msg: string, type: 'success' | 'error') {
        this.message = msg;
        this.messageType = type;
        setTimeout(() => {
            this.message = null;
            this.messageType = null;
            this.cd.detectChanges();
        }, 5000);
    }
}
