import { relations } from "drizzle-orm";
import {
  pgTableCreator,
  timestamp,
  text,
  integer,
  uuid,
} from "drizzle-orm/pg-core";

export const createTableTests = pgTableCreator((testTable) => `qagent_tests`);
export const createTableSteps = pgTableCreator((stepTable) => `qagent_steps`);
export const createTableUsers = pgTableCreator((users) => `qagent_users`)

// tables defined here

export const users = createTableUsers(
  "users",
  {
    // so apparently the clerk id is its own kind of id format, not sure if should be text, just placeholder for now
    id: text("id").primaryKey().notNull().unique(),
    name: text("name").notNull(),
    joinedAt: timestamp('timestamp', { mode: "date" }).defaultNow(),
    //TODO: use zod to validate the type when inserting
    email: text("email").notNull(),
    //TODO:  use default if this isnt provided
    avatarLink: text("avatar_link"),
  }
)

export const tests = createTableTests(
  "tests",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull().unique(),
    name: text("name").notNull(),
    createdAt: timestamp('created_at', { mode: "date" }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: "date" }).defaultNow(),
    queuedAt: timestamp('queued_at', { mode: "date" }).defaultNow(),
    duration: integer('duration'),
    description: text('description').notNull(),
    //NOTE: what is sample input? - not sure used it for a mock test
    sampleInput: text("sample_input"),
    expectedOutput: text('expected_output'),
    //NOTE: what are these ? - status was thinking an integer saying if its failed, running, or passed
    // trigger is from the example template
    status: integer("status").default(0),
    trigger: text("trigger"),


    // foreign keys
    author_id: text("author").references(() => users.id).notNull(),
    updatedBy: text("updated_by").references(() => users.id).notNull(),
  }
)

export const steps = createTableSteps(
  "steps",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull().unique(),
    order: integer("order").notNull(),

    // NOTE: maybe show like a warning when user deletes these
    test_id: uuid("test_id").references(() => tests.id, { onDelete: "cascade" }).notNull(),
    author_id: text("author").references(() => users.id, { onDelete: "cascade" }).notNull(),

    // everything down here can be nullable
    actionType: text("action_type"),
    scrollDirection: text("scroll_direction"),
    tapType: text("tap_type"),
    description: text("description"),

  }
)

// relations defiend here

export const userRelations = relations(users, ({ many }) => ({
  ownedTests: many(tests),
  ownedSteps: many(steps)

  //TODO: maybe we could do updated tests
}))


export const testRelations = relations(tests, ({ many, one }) => ({

  author: one(users, {
    fields: [tests.author_id],
    references: [users.id]
  }),

  updatedBy: one(users, {
    fields: [tests.updatedBy],
    references: [users.id]
  }),

  steps: many(steps)

}))

export const stepRelations = relations(steps, ({ one }) => ({

  author: one(users, {
    fields: [steps.author_id],
    references: [users.id]
  }),

  parent_test: one(tests, {
    fields: [steps.test_id],
    references: [tests.id]
  }),

}))