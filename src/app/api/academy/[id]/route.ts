import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Academy from "@/lib/models/Academy";
import { cascadeAcademyRename } from "@/lib/academy/renameCascade";
import { adminMiddleware, roleMiddleware } from "@/lib/middleware/auth";
import { filterAcademyUpdate } from "@/lib/academy/updateGuard";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const academy = await Academy.findById(id);
    return NextResponse.json({ success: true, data: { academy } });
  } catch (error) {
    console.error('[api/academy/[id]]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error)
      return NextResponse.json({ success: false }, { status: auth.status });
    await connectToDatabase();
    const { id } = await params;

    const isSuperAdmin = auth.user.role === "gwd_super_admin";

    if (!isSuperAdmin && auth.academyId !== id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to edit this academy" },
        { status: 403 },
      );
    }

    /**
     * The body used to go straight into findByIdAndUpdate. "It is your own
     * academy" is NOT sufficient authorisation to write every field on it —
     * platformFeePercent, verificationStatus, ecosystemScore, rzp_account and
     * ownerId are GWD's side of the relationship. See lib/academy/updateGuard.
     */
    const raw = await req.json();
    const { update, rejected } = filterAcademyUpdate(raw, isSuperAdmin);

    if (rejected.length > 0) {
      console.warn(
        `[academy:PUT] ${auth.user._id} (${auth.user.role}) attempted to set ` +
          `protected field(s) on ${id}: ${rejected.join(", ")}`,
      );
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { success: false, message: "No editable fields in request" },
        { status: 400 },
      );
    }

    /**
     * A rename has to be detected BEFORE the write, because afterwards there
     * is nothing left to compare against. Read only the one field.
     */
    const previous = await Academy.findById(id)
      .select("name")
      .lean<{ name?: string } | null>();
    const nextName =
      typeof update.name === "string" ? update.name.trim() : null;
    const renamed = !!nextName && !!previous && nextName !== previous.name;

    const academy = await Academy.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!academy) {
      return NextResponse.json(
        { success: false, message: "Academy not found" },
        { status: 404 },
      );
    }

    /**
     * The academy's name is copied into three other collections so a child's
     * history survives the academy being deleted (see lib/academy/renameCascade
     * for why those copies are a cache and not a snapshot). Left stale, one
     * student would see two different names for the same academy on the same
     * page. Cascaded here so a rename is complete rather than cosmetic.
     *
     * NOT swallowed: unlike a metric, a half-applied rename is visible to
     * users, so a failure has to reach the caller rather than be logged and
     * reported as success.
     */
    let renameCascade = null;
    if (renamed) {
      try {
        renameCascade = await cascadeAcademyRename(id, nextName!);
        console.info("[academy:rename]", {
          by: String(auth.user._id),
          academyId: id,
          from: previous?.name,
          to: nextName,
          ...renameCascade,
        });
      } catch (cascadeError: any) {
        console.error(
          "[academy:rename] cascade failed",
          cascadeError?.message || cascadeError,
        );
        return NextResponse.json(
          {
            success: false,
            message:
              "The academy was renamed, but updating its name on student passports and " +
              "achievements failed. Re-save the name to finish the change.",
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: renameCascade
        ? `Renamed. Updated ${renameCascade.academyHistory} passport record(s) and ` +
          `${renameCascade.achievements} achievement(s).`
        : undefined,
      data: { academy, renameCascade },
    });
  } catch (error: any) {
    /**
     * This used to return a bare `{ success: false }` with no message and log
     * nothing. Combined with `runValidators`, that made a single blank row in
     * an editor array present as "Could not save your changes." with no way —
     * client-side OR server-side — to learn which field was at fault. A
     * validation error and a database outage were indistinguishable.
     */
    console.error("[API_ACADEMY_PUT]", error?.message || error);

    if (error?.name === "ValidationError") {
      // Name the offending paths. These are field names, not internals, and
      // the owner is the only person who can correct them.
      const fields = Object.keys(error.errors ?? {}).join(", ");
      return NextResponse.json(
        {
          success: false,
          message: fields
            ? `Some fields could not be saved: ${fields}. Check for incomplete rows.`
            : "Some fields could not be saved. Check for incomplete rows.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Could not save. Please try again." },
      { status: 500 },
    );
  }
}

/**
 * Super admin only.
 *
 * This had NO ownership check whatsoever — `adminMiddleware` admits any
 * academy admin, and the handler deleted whatever id it was given. Any
 * academy's admin could delete any OTHER academy on the platform, including
 * a competitor's, by id alone.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await roleMiddleware(req, ["gwd_super_admin"]);
    if (auth?.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status },
      );
    }
    await connectToDatabase();
    const { id } = await params;
    await Academy.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/academy/[id]]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
