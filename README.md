# Cumulocity Plugin Demo
This is an inofficial demo showing how to build a simple plugin for the Cumulocity UI. 

> In this example the `widget-plugin` app was scaffold in version 1015.164.0. It is recommended to use your platform version. You can do this by running `c8ycli new` and select your preferred version. However, for plugins it is recommended to use at least 1016.0.0, as it is only in beta mode in 1015.x.x.

## Prepare
 - node 14
 - npm i -g @c8y/cli@next 
 - clone this repository
 - switch to cumulocity-plugin-demo

## 1. Step
Add your tenant and shell to npm start command. Run `npm start` and checkout the two application started.

 - shows exports/remotes in package.json
 - shows debugging with `--shell`

<details>
  <summary>Diff</summary>

``` 
diff --git a/package.json b/package.json
index b100dfe..a2dfd14 100644
--- a/package.json
+++ b/package.json
@@ -3,7 +3,7 @@
   "version": "1.0.0",
   "description": "This is the Cumulocity module federation plugin. Plugins can be developed like any Cumulocity application, but can be used at runtime by other applications. Therefore, they export an Angular module which can then be imported by any other application. The exports are defined in `package.json`:",
   "scripts": {
-    "start": "c8ycli server",
+    "start": "c8ycli server -u http://demos.cumulocity.com --shell cockpit",
     "build": "c8ycli build",
     "deploy": "c8ycli deploy",
     "postinstall": "ngcc"

```

</details>

 > If not working -> checkout `step1` branch
 
## 2. Step
Add a new plugin adding a navigator node

 - shows how simple a new plugin can be added
 - shows how to add a navigator node with useClass

<details>
  <summary>Diff</summary>

``` 
diff --git a/bookmarks/bookmarks.module.ts b/bookmarks/bookmarks.module.ts
new file mode 100644
index 0000000..9907e4a
--- /dev/null
+++ b/bookmarks/bookmarks.module.ts
@@ -0,0 +1,15 @@
+import { NgModule } from "@angular/core";
+import { CommonModule } from "@angular/common";
+import { BookmarksService } from "./bookmarks.service";
+import { HOOK_NAVIGATOR_NODES } from "@c8y/ngx-components";
+
+@NgModule({
+  declarations: [],
+  imports: [CommonModule],
+  exports: [],
+  providers: [
+    BookmarksService,
+    { provide: HOOK_NAVIGATOR_NODES, useClass: BookmarksService, multi: true },
+  ],
+})
+export class BookmarksModule {}
diff --git a/bookmarks/bookmarks.service.ts b/bookmarks/bookmarks.service.ts
new file mode 100644
index 0000000..a3e0765
--- /dev/null
+++ b/bookmarks/bookmarks.service.ts
@@ -0,0 +1,15 @@
+import { Injectable } from '@angular/core';
+import { NavigatorNode } from '@c8y/ngx-components';
+
+@Injectable({
+  providedIn: 'root'
+})
+export class BookmarksService {
+  get() {
+    return new NavigatorNode({
+      label: 'Bookmarks',
+      icon: 'bookmark',
+      priority: -1000
+    });
+  }
+}
\ No newline at end of file
diff --git a/package.json b/package.json
index a2dfd14..bd81906 100644
--- a/package.json
+++ b/package.json
@@ -62,11 +62,17 @@
           "module": "WidgetPluginModule",
           "path": "./widget/widget-plugin.module.ts",
           "description": "Adds a custom widget to the shell application"
+        },
+        {
+          "name": "Device bookmarks",
+          "module": "BookmarksModule",
+          "path": "./bookmarks/bookmarks.module.ts",
+          "description": "Allows you to bookmark your favorite device"
         }
       ],
       "remotes": {
         "summit-ui-demo": [
-          "WidgetPluginModule"
+          "WidgetPluginModule", "BookmarksModule"
         ]
       }
     }

```

</details>

 > If not working -> checkout `step2` branch
 
 
 ## 3. Step
Add logic and injection to the HOOK

 - injection can be tricky. Here it's quite simple as all is on the root injector.

<details>
  <summary>Diff</summary>

```
diff --git a/bookmarks/bookmarks.service.ts b/bookmarks/bookmarks.service.ts
index a3e0765..00c23fc 100644
--- a/bookmarks/bookmarks.service.ts
+++ b/bookmarks/bookmarks.service.ts
@@ -1,15 +1,30 @@
-import { Injectable } from '@angular/core';
-import { NavigatorNode } from '@c8y/ngx-components';
+import { Injectable } from "@angular/core";
+import { InventoryService } from "@c8y/client";
+import { NavigatorNode } from "@c8y/ngx-components";
+import { AssetNode, AssetNodeService } from "@c8y/ngx-components/assets-navigator";
 
 @Injectable({
-  providedIn: 'root'
+  providedIn: "root",
 })
 export class BookmarksService {
-  get() {
-    return new NavigatorNode({
-      label: 'Bookmarks',
-      icon: 'bookmark',
-      priority: -1000
+  constructor(private inventory: InventoryService, private assetService: AssetNodeService) {}
+
+  async get() {
+    const { data: bookmarkedDevices } = await this.inventory.list({
+      fragmentType: "c8y_IsBookmarked",
+      pageSize: 2000
+    });
+
+    const children = bookmarkedDevices.map((mo) => new AssetNode(this.assetService, { mo }));
+
+    const rootNode = new NavigatorNode({
+      label: "Bookmarks",
+      icon: "bookmark",
+      priority: -1000,
     });
+
+    rootNode.children = children;
+
+    return rootNode;
   }
-}
\ No newline at end of file
+}
```

</details>

 > If not working -> checkout `step3` branch
 
## 4. Step
Add a action bar for all devices

 - use routing to check if on a device
 - use content projection to avoid root element
 
<details>
  <summary>Diff</summary>

```
  diff --git a/bookmarks/add-bookmark.component.ts b/bookmarks/add-bookmark.component.ts
new file mode 100644
index 0000000..8adaff1
--- /dev/null
+++ b/bookmarks/add-bookmark.component.ts
@@ -0,0 +1,24 @@
+import { Component, ViewChild, ViewContainerRef } from "@angular/core";
+
+@Component({
+  selector: "[c8y-add-bookmark]",
+  template: `
+    <ng-template #template>
+      <li>
+        <button title="Bookmark device" class="btn btn-link">
+          <i [c8yIcon]="'star'"></i>
+          Bookmark device
+        </button>
+      </li>
+    </ng-template>
+  `,
+})
+export class AddBookmarkComponent {
+  @ViewChild("template", { static: true }) template;
+
+  constructor(private viewContainerRef: ViewContainerRef) {}
+
+  ngOnInit() {
+    this.viewContainerRef.createEmbeddedView(this.template);
+  }
+}
diff --git a/bookmarks/add-bookmark.service.ts b/bookmarks/add-bookmark.service.ts
new file mode 100644
index 0000000..242e9e5
--- /dev/null
+++ b/bookmarks/add-bookmark.service.ts
@@ -0,0 +1,22 @@
+import { Injectable } from "@angular/core";
+import { Router } from "@angular/router";
+import { ActionBarItem } from "@c8y/ngx-components";
+import { AddBookmarkComponent } from "./add-bookmark.component";
+
+@Injectable({
+  providedIn: "root",
+})
+export class AddBookmarkService {
+  constructor(private router: Router) {}
+
+  get() {
+    if (/device\/\w+/.test(this.router.url)) {
+      return {
+        template: AddBookmarkComponent,
+        priority: 0,
+        placement: "more",
+      } as ActionBarItem;
+    }
+    return [];
+  }
+}
diff --git a/bookmarks/bookmarks.module.ts b/bookmarks/bookmarks.module.ts
index 9907e4a..c370178 100644
--- a/bookmarks/bookmarks.module.ts
+++ b/bookmarks/bookmarks.module.ts
@@ -1,15 +1,18 @@
 import { NgModule } from "@angular/core";
-import { CommonModule } from "@angular/common";
+import { CommonModule } from "@c8y/ngx-components";
 import { BookmarksService } from "./bookmarks.service";
-import { HOOK_NAVIGATOR_NODES } from "@c8y/ngx-components";
+import { AddBookmarkService } from "./add-bookmark.service";
+import { HOOK_ACTION_BAR, HOOK_NAVIGATOR_NODES } from "@c8y/ngx-components";
+import { AddBookmarkComponent } from "./add-bookmark.component";
 
 @NgModule({
-  declarations: [],
+  declarations: [AddBookmarkComponent],
   imports: [CommonModule],
   exports: [],
   providers: [
     BookmarksService,
     { provide: HOOK_NAVIGATOR_NODES, useClass: BookmarksService, multi: true },
+    { provide: HOOK_ACTION_BAR, useClass: AddBookmarkService, multi: true }
   ],
 })
 export class BookmarksModule {}

```

</details>
  
## 5. Step
Add the logic to bookmark a device

 - get the context
 - update the device
 
<details>
  <summary>Diff</summary>

```
diff --git a/bookmarks/add-bookmark.component.ts b/bookmarks/add-bookmark.component.ts
index d16c009..bc69b7d 100644
--- a/bookmarks/add-bookmark.component.ts
+++ b/bookmarks/add-bookmark.component.ts
@@ -1,4 +1,11 @@
 import { Component, ViewChild, ViewContainerRef } from "@angular/core";
+import { Router } from "@angular/router";
+import { InventoryService } from "@c8y/client";
+import {
+  ContextRouteService,
+  getActivatedRoute,
+  NavigatorService,
+} from "@c8y/ngx-components";
 
 @Component({
   selector: "[c8y-add-bookmark]",
@@ -8,8 +15,9 @@ import { Component, ViewChild, ViewContainerRef } from "@angular/core";
         <button
           title="Bookmark device"
           class="btn btn-link"
+          (click)="bookmark()"
         >
-          <i [c8yIcon]="'star'"></i>
+          <i [c8yIcon]="isBookmarked ? 'star' : 'star-outline'"></i>
           Bookmark device
         </button>
       </li>
@@ -17,11 +25,35 @@ import { Component, ViewChild, ViewContainerRef } from "@angular/core";
   `,
 })
 export class AddBookmarkComponent {
+  isBookmarked = true;
   @ViewChild("template", { static: true }) template;
 
-  constructor(private viewContainerRef: ViewContainerRef) {}
+  constructor(
+    private viewContainerRef: ViewContainerRef,
+    private router: Router,
+    private inventory: InventoryService,
+    private contextRoute: ContextRouteService,
+    private navigator: NavigatorService
+  ) {}
 
   ngOnInit() {
     this.viewContainerRef.createEmbeddedView(this.template);
+    this.isBookmarked = !!this.contextRoute.getContextData(
+      getActivatedRoute(this.router)
+    )?.contextData?.c8y_IsBookmarked;
+  }
+
+  async bookmark() {
+    const currentDevice = this.contextRoute.getContextData(
+      getActivatedRoute(this.router)
+    )?.contextData;
+    if (currentDevice) {
+      await this.inventory.update({
+        id: currentDevice.id as string,
+        c8y_IsBookmarked: this.isBookmarked ? null : {},
+      });
+      this.isBookmarked = !this.isBookmarked;
+    }
+    this.navigator.refresh();
   }
 }

```

</details>
