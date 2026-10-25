import type { Repository } from "../../repository";
import { toPublicUser, type User } from "../../types";
import { newId, now, patchById, store } from "../store";

export const users: Repository["users"] = {
  findById: async (id) => store().users.find((u) => u.id === id) ?? null,
  findByEmail: async (email) =>
    store().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) ?? null,
  findManyByIds: async (ids) => store().users.filter((u) => ids.includes(u.id)).map(toPublicUser),
  create: async (input) => {
    const user: User = {
      id: newId("u"),
      name: input.name,
      email: input.email.trim().toLowerCase(),
      passwordHash: input.passwordHash,
      role: input.role,
      avatar: input.avatar ?? null,
      phone: null,
      agentId: null,
      agencyId: input.agencyId ?? null,
      status: "active",
      createdAt: now(),
    };
    store().users.push(user);
    return user;
  },
  update: async (id, patch) => patchById(store().users, id, patch),
  setPassword: async (id, passwordHash) => {
    patchById(store().users, id, { passwordHash });
  },
  list: async () => store().users.map(toPublicUser),
};

export const passwordResets: Repository["passwordResets"] = {
  create: async (token) => {
    const s = store();
    s.resetTokens = s.resetTokens.filter((t) => t.userId !== token.userId).concat(token);
  },
  consume: async (token) => {
    const s = store();
    const found = s.resetTokens.find((t) => t.token === token) ?? null;
    s.resetTokens = s.resetTokens.filter((t) => t.token !== token);
    return found && new Date(found.expiresAt).getTime() > Date.now() ? found : null;
  },
};
