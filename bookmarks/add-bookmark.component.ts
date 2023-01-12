import { Component, ViewChild, ViewContainerRef } from "@angular/core";
import { Router } from "@angular/router";
import { InventoryService } from "@c8y/client";
import {
  ContextRouteService,
  getActivatedRoute,
  NavigatorService,
} from "@c8y/ngx-components";

@Component({
  selector: "[c8y-add-bookmark]",
  template: `
    <ng-template #template>
      <li>
        <button
          title="Bookmark device"
          class="btn btn-link"
          (click)="bookmark()"
        >
          <i [c8yIcon]="isBookmarked ? 'star' : 'star-outline'"></i>
          Bookmark device
        </button>
      </li>
    </ng-template>
  `,
})
export class AddBookmarkComponent {
  isBookmarked = true;
  @ViewChild("template", { static: true }) template;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private router: Router,
    private inventory: InventoryService,
    private contextRoute: ContextRouteService,
    private navigator: NavigatorService
  ) {}

  ngOnInit() {
    this.viewContainerRef.createEmbeddedView(this.template);
    this.isBookmarked = !!this.contextRoute.getContextData(
      getActivatedRoute(this.router)
    )?.contextData?.c8y_IsBookmarked;
  }

  async bookmark() {
    const currentDevice = this.contextRoute.getContextData(
      getActivatedRoute(this.router)
    )?.contextData;
    if (currentDevice) {
      await this.inventory.update({
        id: currentDevice.id as string,
        c8y_IsBookmarked: this.isBookmarked ? null : {},
      });
      this.isBookmarked = !this.isBookmarked;
    }
    this.navigator.refresh();
  }
}
