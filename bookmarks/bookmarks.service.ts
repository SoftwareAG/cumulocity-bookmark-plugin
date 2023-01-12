import { Injectable } from "@angular/core";
import { InventoryService } from "@c8y/client";
import { NavigatorNode } from "@c8y/ngx-components";
import { AssetNode, AssetNodeService } from "@c8y/ngx-components/assets-navigator";

@Injectable({
  providedIn: "root",
})
export class BookmarksService {
  constructor(private inventory: InventoryService, private assetService: AssetNodeService) {}

  async get() {
    const { data: bookmarkedDevices } = await this.inventory.list({
      fragmentType: "c8y_IsBookmarked",
      pageSize: 2000
    });

    const children = bookmarkedDevices.map((mo) => new AssetNode(this.assetService, { mo }));

    const rootNode = new NavigatorNode({
      label: "Bookmarks",
      icon: "bookmark",
      priority: -1000,
    });

    rootNode.children = children;

    return rootNode;
  }
}
