import { pgEnum } from "drizzle-orm/pg-core";

export const GenderValues = [
  "MALE",
  "FEMALE",
  "OTHER",
  "PREFER_NOT_TO_SAY",
] as const;
export type Gender = (typeof GenderValues)[number];
export const Gender = Object.assign(
  pgEnum("Gender", GenderValues),
  {
    MALE: "MALE",
    FEMALE: "FEMALE",
    OTHER: "OTHER",
    PREFER_NOT_TO_SAY: "PREFER_NOT_TO_SAY",
  } as const,
);

export const UserStatusValues = [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "DELETED",
] as const;
export type UserStatus = (typeof UserStatusValues)[number];
export const UserStatus = Object.assign(
  pgEnum("UserStatus", UserStatusValues),
  {
    PENDING: "PENDING",
    ACTIVE: "ACTIVE",
    SUSPENDED: "SUSPENDED",
    DELETED: "DELETED",
  } as const,
);

export const RequestTypeValues = [
  "COMPLAINT",
  "GRIEVANCE",
  "SERVICE_REQUEST",
  "INQUIRY",
  "SUGGESTION",
  "APPEAL",
] as const;
export type RequestType = (typeof RequestTypeValues)[number];
export const RequestType = Object.assign(
  pgEnum("RequestType", RequestTypeValues),
  {
    COMPLAINT: "COMPLAINT",
    GRIEVANCE: "GRIEVANCE",
    SERVICE_REQUEST: "SERVICE_REQUEST",
    INQUIRY: "INQUIRY",
    SUGGESTION: "SUGGESTION",
    APPEAL: "APPEAL",
  } as const,
);

export const RequestStatusValues = [
  "DRAFT",
  "SUBMITTED",
  "ASSIGNED",
  "UNDER_REVIEW",
  "WAITING_FOR_STUDENT",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
  "CLOSED",
  "CANCELLED",
] as const;
export type RequestStatus = (typeof RequestStatusValues)[number];
export const RequestStatus = Object.assign(
  pgEnum("RequestStatus", RequestStatusValues),
  {
    DRAFT: "DRAFT",
    SUBMITTED: "SUBMITTED",
    ASSIGNED: "ASSIGNED",
    UNDER_REVIEW: "UNDER_REVIEW",
    WAITING_FOR_STUDENT: "WAITING_FOR_STUDENT",
    IN_PROGRESS: "IN_PROGRESS",
    RESOLVED: "RESOLVED",
    REJECTED: "REJECTED",
    CLOSED: "CLOSED",
    CANCELLED: "CANCELLED",
  } as const,
);

export const PriorityValues = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
] as const;
export type Priority = (typeof PriorityValues)[number];
export const Priority = Object.assign(
  pgEnum("Priority", PriorityValues),
  {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
    URGENT: "URGENT",
  } as const,
);

export const ActivityTypeValues = [
  "CREATED",
  "ASSIGNED",
  "FORWARDED",
  "STATUS_CHANGED",
  "COMMENTED",
  "ATTACHMENT_ADDED",
  "RESOLVED",
  "CLOSED",
  "REOPENED",
  "ESCALATED",
] as const;
export type ActivityType = (typeof ActivityTypeValues)[number];
export const ActivityType = Object.assign(
  pgEnum("ActivityType", ActivityTypeValues),
  {
    CREATED: "CREATED",
    ASSIGNED: "ASSIGNED",
    FORWARDED: "FORWARDED",
    STATUS_CHANGED: "STATUS_CHANGED",
    COMMENTED: "COMMENTED",
    ATTACHMENT_ADDED: "ATTACHMENT_ADDED",
    RESOLVED: "RESOLVED",
    CLOSED: "CLOSED",
    REOPENED: "REOPENED",
    ESCALATED: "ESCALATED",
  } as const,
);

export const AssignmentRoleValues = [
  "PRIMARY",
  "SECONDARY",
] as const;
export type AssignmentRole = (typeof AssignmentRoleValues)[number];
export const AssignmentRole = Object.assign(
  pgEnum("AssignmentRole", AssignmentRoleValues),
  {
    PRIMARY: "PRIMARY",
    SECONDARY: "SECONDARY",
  } as const,
);

export const AssignmentStatusValues = [
  "PENDING",
  "ACCEPTED",
  "IN_PROGRESS",
  "COMPLETED",
  "DECLINED",
] as const;
export type AssignmentStatus = (typeof AssignmentStatusValues)[number];
export const AssignmentStatus = Object.assign(
  pgEnum("AssignmentStatus", AssignmentStatusValues),
  {
    PENDING: "PENDING",
    ACCEPTED: "ACCEPTED",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
    DECLINED: "DECLINED",
  } as const,
);
