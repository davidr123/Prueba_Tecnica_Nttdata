import { Component, input } from '@angular/core';

@Component({
  selector: 'app-tooltip-icon',
  standalone: true,
  templateUrl: './tooltip-icon.component.html',
  styleUrls: ['./tooltip-icon.component.css'],
})
export class TooltipIconComponent {
  readonly text = input.required<string>();
}
