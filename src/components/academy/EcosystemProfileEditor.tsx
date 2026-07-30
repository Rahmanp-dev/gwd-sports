"use client";
import React from "react";
import { Plus, Trophy, Users, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE ACADEMY'S PUBLIC ECOSYSTEM PROFILE
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Star players, registered teams and achievements are what the GWD ecosystem
 * map shows a visitor who taps an academy's pin. They were editable only by a
 * super admin, buried in the "Pin Map" modal — so the person who actually
 * knows which of their players made the state squad had no way to say so, and
 * the map went stale the moment GWD stopped hand-maintaining it.
 *
 * ONE COMPONENT, TWO CALLERS, on purpose. The super admin's modal and the
 * owner's own settings render this same editor, so the two surfaces cannot
 * drift into disagreeing about what a star player is — which is exactly what
 * happened to the branding editor before it was unified.
 *
 * Controlled and stateless: whoever renders it owns loading and saving. The
 * super admin saves through the admin academy route, the owner through their
 * own PUT — where `starPlayers`/`registeredTeams`/`achievements` are on the
 * owner-writable allowlist and `ecosystemScore`/`verificationStatus` are
 * deliberately NOT (see lib/academy/updateGuard).
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface StarPlayer {
  name: string;
  role: string;
  badge?: string;
  avatarUrl?: string;
}

export interface RegisteredTeam {
  name: string;
  category: string;
  winRate?: string;
}

/**
 * NOTE — `achievements` is deliberately NOT here.
 *
 * It lives on the same Academy document and is already edited by the branding
 * editor's Achievements card. Putting it in this editor too would mean two
 * controls writing one field, on the same screen, with whichever saved last
 * winning — the exact failure that made the old BrandingStudio and
 * AcademyBrandingSettings disagree about who owned the tagline.
 */
export interface EcosystemProfile {
  coachName: string;
  establishedYear: number | "";
  starPlayers: StarPlayer[];
  registeredTeams: RegisteredTeam[];
}

/** The badges the map legend knows how to render. */
export const STAR_BADGES = ["STATE", "NATIONAL", "DISTRICT", "ACADEMY"] as const;

export function emptyEcosystemProfile(): EcosystemProfile {
  return {
    coachName: "",
    establishedYear: "",
    starPlayers: [],
    registeredTeams: [],
  };
}

export function ecosystemProfileFromAcademy(academy?: any): EcosystemProfile {
  return {
    coachName: academy?.coachName ?? "",
    establishedYear: academy?.establishedYear ?? "",
    starPlayers: Array.isArray(academy?.starPlayers) ? academy.starPlayers : [],
    registeredTeams: Array.isArray(academy?.registeredTeams)
      ? academy.registeredTeams
      : [],
  };
}

/** The exact payload shape both callers PUT. */
export function ecosystemProfileToUpdate(
  profile: EcosystemProfile,
): Record<string, unknown> {
  return {
    coachName: profile.coachName,
    // "" would fail the Number cast and write NaN; omitting is the honest
    // representation of "not stated".
    ...(profile.establishedYear === ""
      ? {}
      : { establishedYear: Number(profile.establishedYear) }),
    /**
     * Both fields, not just `name` — and via String() rather than `.trim()`
     * directly.
     *
     * `role` and `category` are `required` in the schema, so a row with a name
     * but no role failed validation and rejected the WHOLE save (every branding
     * change in the same sitting with it). And a legacy row persisted without a
     * name at all made `p.name.trim()` throw a TypeError before the request was
     * even sent, which looked like the Save button doing nothing.
     */
    starPlayers: profile.starPlayers.filter(
      (p) => String(p?.name ?? "").trim() && String(p?.role ?? "").trim(),
    ),
    registeredTeams: profile.registeredTeams.filter(
      (t) => String(t?.name ?? "").trim() && String(t?.category ?? "").trim(),
    ),
  };
}

export interface Props {
  value: EcosystemProfile;
  onChange: (next: EcosystemProfile) => void;
  disabled?: boolean;
}

export default function EcosystemProfileEditor({
  value,
  onChange,
  disabled = false,
}: Props) {
  const patch = (partial: Partial<EcosystemProfile>) =>
    onChange({ ...value, ...partial });

  return (
    <div className="space-y-5">
      {/* ── Basics ──────────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Head coach
          </label>
          <Input
            value={value.coachName}
            disabled={disabled}
            placeholder="Name shown on your map profile"
            onChange={(e) => patch({ coachName: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Established
          </label>
          <Input
            type="number"
            min={1900}
            max={new Date().getFullYear()}
            value={value.establishedYear}
            disabled={disabled}
            placeholder="e.g. 2015"
            onChange={(e) =>
              patch({
                establishedYear: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
          />
        </div>
      </div>

      {/* ── Star players ────────────────────────────────────────────────── */}
      <div>
        <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          <Users className="h-3 w-3" /> Star players
        </p>
        <p className="mb-2 text-[11px] leading-relaxed text-slate-400">
          Shown publicly on your ecosystem map profile. Only list players who
          have agreed to be named.
        </p>
        <div className="space-y-2">
          {value.starPlayers.map((player, index) => (
            <div
              key={index}
              className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3"
            >
              <div className="flex gap-1.5">
                <Input
                  value={player.name}
                  disabled={disabled}
                  placeholder="Player name"
                  onChange={(e) => {
                    const next = [...value.starPlayers];
                    next[index] = { ...player, name: e.target.value };
                    patch({ starPlayers: next });
                  }}
                />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    patch({
                      starPlayers: value.starPlayers.filter((_, i) => i !== index),
                    })
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500"
                  aria-label={`Remove player ${index + 1}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Input
                  value={player.role}
                  disabled={disabled}
                  placeholder="Role, e.g. Opening batter"
                  onChange={(e) => {
                    const next = [...value.starPlayers];
                    next[index] = { ...player, role: e.target.value };
                    patch({ starPlayers: next });
                  }}
                />
                <select
                  value={player.badge ?? "ACADEMY"}
                  disabled={disabled}
                  onChange={(e) => {
                    const next = [...value.starPlayers];
                    next[index] = { ...player, badge: e.target.value };
                    patch({ starPlayers: next });
                  }}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm"
                  aria-label={`Level for player ${index + 1}`}
                >
                  {STAR_BADGES.map((badge) => (
                    <option key={badge} value={badge}>
                      {badge}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="mt-2 w-full"
          onClick={() =>
            patch({
              starPlayers: [
                ...value.starPlayers,
                { name: "", role: "", badge: "ACADEMY" },
              ],
            })
          }
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add player
        </Button>
      </div>

      {/* ── Teams ───────────────────────────────────────────────────────── */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          <Users className="h-3 w-3" /> Registered teams
        </p>
        <div className="space-y-2">
          {value.registeredTeams.map((team, index) => (
            <div key={index} className="flex flex-wrap gap-1.5">
              <Input
                value={team.name}
                disabled={disabled}
                placeholder="Team name"
                onChange={(e) => {
                  const next = [...value.registeredTeams];
                  next[index] = { ...team, name: e.target.value };
                  patch({ registeredTeams: next });
                }}
                className="min-w-[8rem] flex-1"
              />
              <Input
                value={team.category}
                disabled={disabled}
                placeholder="Category, e.g. Under 16"
                onChange={(e) => {
                  const next = [...value.registeredTeams];
                  next[index] = { ...team, category: e.target.value };
                  patch({ registeredTeams: next });
                }}
                className="min-w-[8rem] flex-1"
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  patch({
                    registeredTeams: value.registeredTeams.filter(
                      (_, i) => i !== index,
                    ),
                  })
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500"
                aria-label={`Remove team ${index + 1}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="mt-2 w-full"
          onClick={() =>
            patch({
              registeredTeams: [
                ...value.registeredTeams,
                { name: "", category: "" },
              ],
            })
          }
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add team
        </Button>
      </div>
    </div>
  );
}
