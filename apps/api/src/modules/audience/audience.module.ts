import { Module } from "@nestjs/common";
import { ProfilesController } from "./profiles.controller.js";
import { RelationshipsController } from "./relationships.controller.js";
import { InteractionsController } from "./interactions.controller.js";
import { TagsController } from "./tags.controller.js";
import { TaggingsController } from "./taggings.controller.js";
import { ProfilesService } from "./profiles.service.js";
import { RelationshipsService } from "./relationships.service.js";
import { InteractionsService } from "./interactions.service.js";
import { TagsService } from "./tags.service.js";
import { TaggingsService } from "./taggings.service.js";

@Module({
  controllers: [
    ProfilesController,
    RelationshipsController,
    InteractionsController,
    TagsController,
    TaggingsController
  ],
  providers: [ProfilesService, RelationshipsService, InteractionsService, TagsService, TaggingsService]
})
export class AudienceModule {}
