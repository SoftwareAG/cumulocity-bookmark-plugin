import { NgModule } from "@angular/core";
import { CommonModule } from "@c8y/ngx-components";
import { BookmarksService } from "./bookmarks.service";
import { AddBookmarkService } from "./add-bookmark.service";
import { HOOK_ACTION_BAR, HOOK_NAVIGATOR_NODES } from "@c8y/ngx-components";
import { AddBookmarkComponent } from "./add-bookmark.component";

@NgModule({
  declarations: [AddBookmarkComponent],
  imports: [CommonModule],
  exports: [],
  providers: [
    BookmarksService,
    { provide: HOOK_NAVIGATOR_NODES, useClass: BookmarksService, multi: true },
    { provide: HOOK_ACTION_BAR, useClass: AddBookmarkService, multi: true }
  ],
})
export class BookmarksModule {}
