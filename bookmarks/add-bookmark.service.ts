import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { ActionBarItem } from "@c8y/ngx-components";
import { AddBookmarkComponent } from "./add-bookmark.component";

@Injectable({
  providedIn: "root",
})
export class AddBookmarkService {
  constructor(private router: Router) {}

  get() {
    if (/device\/\w+/.test(this.router.url)) {
      return {
        template: AddBookmarkComponent,
        priority: 0,
        placement: "more",
      } as ActionBarItem;
    }
    return [];
  }
}
