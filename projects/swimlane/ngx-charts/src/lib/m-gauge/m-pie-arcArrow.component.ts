import {
  Component,
  Input,
  ElementRef,
  SimpleChanges,
  OnChanges,
  ChangeDetectionStrategy
} from '@angular/core';
import { DataItem } from '../models/chart-data.model';

@Component({
  standalone: false,
  selector: 'g[ngx-m-charts-pie-arcArrow]',
  template: `
      <svg:g class="arc-group" style="transform: {{rotation}} translateY(-1.5%) var(--scale) ; {{animation}}">
        <svg:path
          style="transform: ;"
          [attr.d]="'M -8 8 L -150 8 L -150 0 L -8 0 Z'"
          [attr.fill]="'#000'"
        />
        <svg:path
          style="transform:  translate(-9px, 8px);"
          [attr.d]="'M -1 -4 A 1 1 0 0 0 16 -4 A 1 1 0 0 0 -1 -4 Z'"
          [attr.fill]="'#000'"
        />
      </svg:g>
  `,
  styles: [`
    @keyframes rotate {
      0% {
        transform: rotate(0deg) var(--scale) translateY(-1.5%);
      }
      100% {
        transform: var(--rotation) var(--scale) translateY(-1.5%);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MPieArcArrowComponent implements OnChanges {
  @Input() fill: string;
  @Input() max: number;
  @Input() min: number;
  @Input() data: DataItem;
  @Input() scale: number = 1;

  element: HTMLElement;
  rotation = 'rotate(0deg)';
  animation = 'animation: rotate 1s';

  constructor(element: ElementRef) {
    this.element = element.nativeElement;
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.update();
  }

  update(): void {
    this.animation = 'none';
    const val = (this.data.value - this.min) * 180 / (this.max- this.min);
    this.rotation = `rotate(${val > 180 ? 180 : val}deg)`;
    this.element.style.setProperty('--rotation', this.rotation);
    this.element.style.setProperty('--scale', `scale(${(this.scale/150)})`);
    this.animation = 'animation: rotate 1s';
  }
}
