import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Students table for fee collection app
 * Stores student information including email and password for authentication
 */
export const students = mysqlTable("students", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  class: varchar("class", { length: 50 }).notNull(),
  monthlyFee: int("monthlyFee").notNull(),
  monthlyDueDate: int("monthlyDueDate"), // Day of month (1-31)
  dueDate: varchar("dueDate", { length: 50 }), // ISO date string
  email: varchar("email", { length: 320 }),
  password: text("password"), // Hashed password
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentDB = typeof students.$inferSelect;
export type InsertStudentDB = typeof students.$inferInsert;

/**
 * Payments table for tracking student fee payments
 */
export const payments = mysqlTable("payments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  studentId: varchar("studentId", { length: 64 }).notNull(),
  month: int("month").notNull(), // 0-11 (Jan-Dec)
  year: int("year").notNull(),
  paidDate: varchar("paidDate", { length: 50 }).notNull(), // ISO date string
  amount: int("amount").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentDB = typeof payments.$inferSelect;
export type InsertPaymentDB = typeof payments.$inferInsert;
