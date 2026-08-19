import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { DatePipe } from '@angular/common';

import { IconOfPipe } from '../shared/icon';

interface KpiCard {
  label: string;
  value: string;
  meta: string;
  icon: string;
  trend: string;
  trendLabel: string;
  trendDirection: 'up' | 'down' | 'flat';
  detail: string;
}

interface DonutSegment {
  label: string;
  value: number;
  color: string;
  dashArray: string;
  dashOffset: number;
}

interface Appointment {
  time: string;
  customer: string;
  vehicle: string;
  type: string;
  status: string;
}

interface ActivityEntry {
  initials: string;
  actor: string;
  action: string;
  when: string;
  avatarBg: string;
}

interface PipelineStage {
  label: string;
  value: number;
}

const DONUT_RADIUS = 42;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

/**
 * Dashboard, reproducing the legacy `dashboardMarkup()` layout: greeting
 * header, KPI cards, workshop/revenue/pipeline visual panels (rendered as
 * native SVG instead of Chart.js), and the calendar/appointments/recent
 * activity row. All data is static, matching the reference's demo content.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [IconOfPipe, LucideDynamicIcon, DatePipe],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly destroyRef = inject(DestroyRef);
  protected readonly hoveredWorkshopSegment = signal<DonutSegment | null>(null);
  protected readonly liveJobs = signal(44);
  protected readonly completedJobs = signal(6);
  protected readonly liveRevenue = signal(189300);
  protected readonly lastUpdated = signal(new Date());
  protected readonly kpis = computed<KpiCard[]>(() => [
    { label: 'Workshop Jobs Today', value: String(this.liveJobs()), meta: `${this.liveJobs() - this.completedJobs()} open | ${this.completedJobs()} complete`, icon: 'wrench', trend: '8.3%', trendLabel: 'vs yesterday', trendDirection: 'up', detail: 'New workshop activity is reflected automatically as jobs are opened and completed.' },
    { label: 'Vehicle Sales Today', value: '9 units', meta: '€386k total', icon: 'car', trend: '2 units', trendLabel: 'ahead of yesterday', trendDirection: 'up', detail: 'Five new and four used vehicles sold. Average transaction value is €42,900.' },
    { label: 'Revenue Today', value: this.euroCompact(this.liveRevenue()), meta: `${Math.round((this.liveRevenue() / 197000) * 100)}% of daily target`, icon: 'trending-up', trend: '4.7%', trendLabel: 'below target pace', trendDirection: 'down', detail: 'Revenue updates as simulated sales, workshop and parts transactions are posted.' },
    { label: 'Pending Deliveries', value: '6', meta: '2 due before noon', icon: 'truck', trend: 'No change', trendLabel: 'since yesterday', trendDirection: 'flat', detail: 'Four vehicles are prepared. Two are waiting on registration documentation.' },
  ]);

  protected readonly appointments: Appointment[] = [
    { time: '09:00', customer: 'Marcus Reynolds', vehicle: 'BMW 5 Series 530i', type: 'Test Drive', status: 'Confirmed' },
    { time: '09:30', customer: 'Priya Sharma', vehicle: 'Mercedes-Benz C220d', type: 'Finance Review', status: 'Confirmed' },
    { time: '10:15', customer: 'Johan van der Berg', vehicle: 'Volkswagen Tiguan 2.0T', type: 'Delivery', status: 'Active' },
    { time: '11:00', customer: 'Sipho Dlamini', vehicle: 'Toyota Fortuner GD-6', type: 'Service Drop', status: 'Pending' },
  ];

  protected readonly activity: ActivityEntry[] = [
    { initials: 'TN', actor: 'Thabo Nkosi', action: 'closed vehicle order', when: '8m ago', avatarBg: 'bg-blue-500' },
    { initials: 'SY', actor: 'System', action: 'PO-2847 approved', when: '24m ago', avatarBg: 'bg-slate-400' },
    { initials: 'AD', actor: 'Aneesa Davids', action: 'new lead registered', when: '1h ago', avatarBg: 'bg-violet-500' },
  ];

  protected readonly donutSegments = computed(() => this.buildDonutSegments([
    { label: 'In Progress', value: 18, color: 'var(--theme-primary)' },
    { label: 'Complete', value: this.completedJobs(), color: '#22C55E' },
    { label: 'Waiting Parts', value: 5, color: '#F59E0B' },
    { label: 'Open', value: Math.max(0, this.liveJobs() - 23 - this.completedJobs()), color: '#CBD5E1' },
  ]));
  protected readonly workshopTotal = computed(() => this.liveJobs());
  protected readonly activeWorkshopSegment = computed(() => this.hoveredWorkshopSegment());

  protected workshopShare(segment: DonutSegment): number {
    return Math.round((segment.value / this.workshopTotal()) * 100);
  }

  protected readonly revenuePoints = this.buildLinePoints([0, 29400, 61800, 104200, 130500, 149800, 172400, 189300]);
  protected readonly revenueArea = `M0,100 L${this.revenuePoints} L300,100 Z`;
  protected readonly revenueLine = `M${this.revenuePoints}`;
  protected readonly revenueLabels = ['08:00', '10:00', '12:00', '14:00'];

  protected readonly pipeline: PipelineStage[] = [
    { label: 'New', value: 84 },
    { label: 'Contacted', value: 61 },
    { label: 'Test', value: 38 },
    { label: 'Proposal', value: 24 },
    { label: 'Negotiation', value: 14 },
    { label: 'Won', value: 9 },
  ];
  protected readonly pipelineMax = Math.max(...this.pipeline.map((stage) => stage.value));

  constructor() {
    const timer = window.setInterval(() => this.refreshLiveMetrics(), 45_000);
    this.destroyRef.onDestroy(() => window.clearInterval(timer));
  }

  protected revenueDisplay(): string {
    return this.euroCompact(this.liveRevenue());
  }

  protected revenueTargetPercent(): number {
    return Math.round((this.liveRevenue() / 197000) * 100);
  }

  private refreshLiveMetrics(): void {
    const event = Math.random();
    if (event > 0.66) {
      this.liveJobs.update((value) => value + 1);
    } else if (event < 0.25 && this.liveJobs() > this.completedJobs()) {
      this.completedJobs.update((value) => value + 1);
    }
    this.liveRevenue.update((value) => value + Math.round(350 + Math.random() * 2100));
    this.lastUpdated.set(new Date());
  }

  private euroCompact(value: number): string {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }

  private buildDonutSegments(source: { label: string; value: number; color: string }[]): DonutSegment[] {
    const total = source.reduce((sum, item) => sum + item.value, 0);
    let offset = 0;
    return source.map((item) => {
      const length = (item.value / total) * DONUT_CIRCUMFERENCE;
      const segment: DonutSegment = {
        label: item.label,
        value: item.value,
        color: item.color,
        dashArray: `${length} ${DONUT_CIRCUMFERENCE - length}`,
        dashOffset: -offset,
      };
      offset += length;
      return segment;
    });
  }

  private buildLinePoints(values: number[]): string {
    const max = Math.max(...values) || 1;
    const step = 300 / (values.length - 1);
    return values.map((value, index) => `${index * step},${100 - (value / max) * 92}`).join(' L');
  }
}
