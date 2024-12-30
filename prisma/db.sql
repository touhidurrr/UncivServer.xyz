--- SQL that was actually executed into database
--- Observe changes in generated.sql and apply them here
--- DO NOT REWRITE THIS FILE IN ANY WAY
--- Just add new changes to the end of the file
create table "Variable" (
  "id" text not null primary key,
  "value" text,
  "createdAt" bigint not null default (cast(1000 * unixepoch ('subsec') as integer)),
  "updatedAt" bigint not null default (cast(1000 * unixepoch ('subsec') as integer))
);

create table "Game" (
  "id" text not null primary key,
  "save" text not null,
  "preview" text,
  "name" text,
  "turns" integer not null default 0,
  "currentPlayer" text,
  "playerId" text,
  "createdAt" bigint not null default (cast(1000 * unixepoch ('subsec') as integer)),
  "updatedAt" bigint not null default (cast(1000 * unixepoch ('subsec') as integer))
);

create table "User" (
  "id" text not null primary key,
  "createdAt" bigint not null default (cast(1000 * unixepoch ('subsec') as integer))
);

create table "UsersInGame" (
  "id" integer not null primary key autoincrement,
  "gameId" text not null,
  "userId" text not null,
  "createdAt" bigint not null default (cast(1000 * unixepoch ('subsec') as integer)),
  constraint "UsersInGame_gameId_fkey" foreign key ("gameId") references "Game" ("id") on delete restrict on update cascade,
  constraint "UsersInGame_userId_fkey" foreign key ("userId") references "User" ("id") on delete restrict on update cascade
);

create table "Profile" (
  "id" integer not null primary key autoincrement,
  "discordId" bigint,
  "rating" real not null default 1000,
  "dmChannel" bigint,
  "notifications" text not null default 'enabled',
  "createdAt" bigint not null default (cast(1000 * unixepoch ('subsec') as integer)),
  "updatedAt" bigint not null default (cast(1000 * unixepoch ('subsec') as integer))
);

create table "UsersInProfile" (
  "id" integer not null primary key autoincrement,
  "userId" text not null,
  "profileId" integer not null,
  "createdAt" bigint not null default (cast(1000 * unixepoch ('subsec') as integer)),
  constraint "UsersInProfile_userId_fkey" foreign key ("userId") references "User" ("id") on delete restrict on update cascade,
  constraint "UsersInProfile_profileId_fkey" foreign key ("profileId") references "Profile" ("id") on delete restrict on update cascade
);

create table "ErrorLog" (
  "id" integer not null primary key autoincrement,
  "type" text not null,
  "message" text,
  "createdAt" bigint not null default (cast(1000 * unixepoch ('subsec') as integer))
);

create table "DiscordPoll" (
  "id" bigint not null primary key,
  "authorId" bigint not null,
  "createdAt" bigint not null default (cast(1000 * unixepoch ('subsec') as integer))
);

create table "DiscordPollEntry" (
  "id" integer not null primary key autoincrement,
  "pollId" bigint not null,
  "order" integer not null,
  "label" text not null,
  "createdAt" bigint not null default (cast(1000 * unixepoch ('subsec') as integer)),
  "updatedAt" bigint not null default (cast(1000 * unixepoch ('subsec') as integer)),
  constraint "DiscordPollEntry_pollId_fkey" foreign key ("pollId") references "DiscordPoll" ("id") on delete restrict on update cascade
);

create table "DiscordPollVote" (
  "id" integer not null primary key autoincrement,
  "entryId" integer not null,
  "discordId" bigint not null,
  "createdAt" bigint not null default (cast(1000 * unixepoch ('subsec') as integer)),
  constraint "DiscordPollVote_entryId_fkey" foreign key ("entryId") references "DiscordPollEntry" ("id") on delete restrict on update cascade
);

create unique index "Variable_id_key" on "Variable" ("id");

create index "Variable_createdAt_idx" on "Variable" ("createdAt");

create index "Variable_updatedAt_idx" on "Variable" ("updatedAt");

create index "Game_playerId_idx" on "Game" ("playerId");

create index "Game_createdAt_idx" on "Game" ("createdAt");

create index "Game_updatedAt_idx" on "Game" ("updatedAt");

create index "User_createdAt_idx" on "User" ("createdAt");

create index "UsersInGame_createdAt_idx" on "UsersInGame" ("createdAt");

create unique index "UsersInGame_userId_gameId_key" on "UsersInGame" ("userId", "gameId");

create index "Profile_createdAt_idx" on "Profile" ("createdAt");

create index "Profile_updatedAt_idx" on "Profile" ("updatedAt");

create index "Profile_discordId_idx" on "Profile" ("discordId");

create index "Profile_dmChannel_idx" on "Profile" ("dmChannel");

create unique index "UsersInProfile_userId_key" on "UsersInProfile" ("userId");

create index "UsersInProfile_profileId_idx" on "UsersInProfile" ("profileId");

create index "UsersInProfile_createdAt_idx" on "UsersInProfile" ("createdAt");

create unique index "UsersInProfile_userId_profileId_key" on "UsersInProfile" ("userId", "profileId");

create index "ErrorLog_createdAt_idx" on "ErrorLog" ("createdAt");

create index "DiscordPoll_createdAt_idx" on "DiscordPoll" ("createdAt");

create index "DiscordPollEntry_createdAt_idx" on "DiscordPollEntry" ("createdAt");

create index "DiscordPollEntry_updatedAt_idx" on "DiscordPollEntry" ("updatedAt");

create unique index "DiscordPollEntry_pollId_order_key" on "DiscordPollEntry" ("pollId", "order");

create index "DiscordPollVote_createdAt_idx" on "DiscordPollVote" ("createdAt");

create unique index "DiscordPollVote_entryId_discordId_key" on "DiscordPollVote" ("entryId", "discordId");
