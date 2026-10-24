import type { Role, User } from "../../types";
import { agents } from "./agents";
import { agencies } from "./agencies";
import { PORTRAITS, portrait } from "./images";
import { daysAgo } from "./random";

/** bcrypt hash (cost 10) of the shared demo password "Demo@1234". */
export const DEMO_PASSWORD_HASH = "$2b$10$AF3qY2sMFxLSDsp/BFbZje6urPZ1XpMDcmQX1BcMUxSr9GX8KS3B.";

const u = (
  id: string,
  name: string,
  email: string,
  role: Role,
  extra: Partial<User> = {},
): User => ({
  id,
  name,
  email,
  passwordHash: DEMO_PASSWORD_HASH,
  role,
  avatar: null,
  phone: null,
  agentId: null,
  agencyId: null,
  status: "active",
  createdAt: daysAgo(120),
  ...extra,
});

const demoUsers: User[] = [
  u("u-seeker", "Ayesha Malik", "seeker@demo.com", "seeker",
    { avatar: portrait(PORTRAITS.women[7]), phone: "+92 321 5550101" }),
  u("u-owner", "Bilal Ahmed", "owner@demo.com", "owner", { phone: "+92 333 5550102" }),
  u("u-agency", "Sana Rafiq", "agency@demo.com", "agency_admin", { agencyId: "ag-1" }),
  u("u-admin", "Nestly Admin", "admin@demo.com", "admin"),
];

const agentUsers: User[] = agents.map((a) =>
  u(a.userId, a.name, a.email, "agent", {
    avatar: a.photo,
    phone: a.phone,
    agentId: a.id,
    agencyId: a.agencyId,
  }),
);

const agencyAdmins: User[] = agencies.slice(1).map((ag) =>
  u(`u-agency-${ag.id.split("-")[1]}`, `${ag.name} Admin`, `admin@${ag.email.split("@")[1]}`,
    "agency_admin", { agencyId: ag.id }),
);

/** Background people who own listings or appear in leads and messages. */
const extras: User[] = [
  u("u-owner-2", "Nadia Chaudhry", "nadia.chaudhry@example.com", "owner"),
  u("u-owner-3", "Imran Butt", "imran.butt@example.com", "owner"),
  u("u-owner-4", "Rabia Anwar", "rabia.anwar@example.com", "owner"),
  u("u-seeker-2", "Haris Mehmood", "haris.mehmood@example.com", "seeker"),
  u("u-seeker-3", "Komal Zafar", "komal.zafar@example.com", "seeker"),
  u("u-seeker-4", "Junaid Akhtar", "junaid.akhtar@example.com", "seeker"),
  u("u-seeker-5", "Sobia Rehman", "sobia.rehman@example.com", "seeker", { status: "suspended" }),
];

export const users: User[] = [...demoUsers, ...agentUsers, ...agencyAdmins, ...extras];
