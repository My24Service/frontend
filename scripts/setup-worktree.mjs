#!/usr/bin/env node
// Sets up a freshly created git worktree by copying over files git doesn't
// track (dependencies, local env files, caches) from the main worktree.
//
// Usage:
//   node scripts/setup-worktree.mjs \
//     --main-worktree="$ZED_MAIN_GIT_WORKTREE" --new-worktree="$ZED_WORKTREE_ROOT"
//
// Both flags also accept a space-separated value
// (`--main-worktree <path>`). Resolution order per flag: CLI flag, then the
// corresponding Zed env var, then auto-detect (main = first entry of
// `git worktree list`, new = process.cwd() — the Zed task runs with
// cwd set to the new worktree).
//
// Anything inside a registered git worktree (other than the source itself)
// is never copied — each worktree maintains its own ignored files. That
// also covers worktrees nested under the source, e.g. `.claude/worktrees/`.
import { execFileSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { exit } from "node:process";

function usage() {
  return [
    "Usage: node scripts/setup-worktree.mjs --main-worktree=<path> --new-worktree=<path>",
    "   or: node scripts/setup-worktree.mjs --main-worktree <path> --new-worktree <path>",
  ].join("\n");
}

// All worktree roots, main first. Returns [] when git fails — callers fall
// back to copying without worktree pruning.
function listWorktrees(cwd) {
  try {
    const output = execFileSync("git", ["worktree", "list", "--porcelain"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const roots = [];
    for (const line of output.split("\n")) {
      if (line.startsWith("worktree ")) {
        const p = line.slice("worktree ".length).trim();
        if (p) roots.push(p);
      }
    }
    return roots;
  } catch {
    // Caller reports the problem (or proceeds without pruning).
    return [];
  }
}

// The first entry of `git worktree list` is always the main worktree.
// Runs from the new worktree, so it works no matter where the script is
// invoked from. Returns null when git fails (not a repo, git missing).
function detectMainWorktree(cwd) {
  return listWorktrees(cwd)[0] ?? null;
}

// Canonical absolute path for comparisons (resolves /tmp -> /private/tmp
// style symlinks so git-printed paths match script-side paths). Falls back
// to a plain resolve when the path doesn't exist (e.g. a stale worktree).
function canonical(p) {
  try {
    return realpathSync(resolve(p));
  } catch {
    return resolve(p);
  }
}

// True when candidate is root itself or lives inside it. Both must be
// absolute, canonicalized paths.
function isSameOrInside(candidate, root) {
  const rel = relative(root, candidate);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

// Accepts --flag=value, --flag value, and --flagVALUE (no separator).
function parseArgs(argv) {
  const result = { mainWorktree: null, newWorktree: null };
  const flags = [
    ["--main-worktree", "mainWorktree"],
    ["--new-worktree", "newWorktree"],
  ];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    let matched = false;
    for (const [flag, key] of flags) {
      if (arg === flag) {
        result[key] = argv[++i] ?? null;
        matched = true;
        break;
      }
      if (arg.startsWith(`${flag}=`)) {
        result[key] = arg.slice(flag.length + 1) || null;
        matched = true;
        break;
      }
      if (arg.startsWith(flag) && arg.length > flag.length) {
        result[key] = arg.slice(flag.length);
        matched = true;
        break;
      }
    }
    if (!matched && (arg === "--help" || arg === "-h")) {
      console.log(usage());
      exit(0);
    }
  }
  result.newWorktree ??= process.env.ZED_WORKTREE_ROOT ?? process.cwd();
  result.mainWorktree ??= process.env.ZED_MAIN_GIT_WORKTREE ?? null;
  result.mainWorktree ??= detectMainWorktree(result.newWorktree);
  return result;
}

// `git status --porcelain --ignored` collapses ignored directories to a
// single `!! <dir>/` entry, so big trees like node_modules are copied as one
// unit instead of file by file. This also respects negations (!), global
// excludes, and nested .gitignore files, which hand-parsing the top-level
// .gitignore would get wrong.
function collectIgnoredPaths(worktree) {
  const output = execFileSync(
    "git",
    ["status", "--porcelain=v1", "--ignored", "--", "."],
    { cwd: worktree, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  const paths = [];
  for (const line of output.split("\n")) {
    if (!line.startsWith("!! ")) continue;
    let rel = line.slice(3).trim();
    // Quoted when the path contains special characters.
    if (rel.startsWith('"') && rel.endsWith('"')) rel = JSON.parse(rel);
    // Status appends "/" to directories; strip it for path joining.
    if (rel.endsWith("/")) rel = rel.slice(0, -1);
    if (!rel || rel === ".git") continue;
    paths.push(rel);
  }
  return paths;
}

// Recursively copies srcDir to destDir, pruning registered worktrees (each
// worktree maintains its own ignored files). Never overwrites, like `cp -n`.
// Worktree skips are logged once, at the worktree root.
function copyDirPruned(srcDir, destDir, label, worktreeRoots) {
  mkdirSync(destDir, { recursive: true });
  for (const child of readdirSync(srcDir)) {
    const childSrc = join(srcDir, child);
    const childDest = join(destDir, child);
    const childRel = join(label, child);
    if (worktreeRoots.some((r) => isSameOrInside(childSrc, r))) {
      console.log(`skip (worktree): ${childRel}`);
      continue;
    }
    if (existsSync(childDest)) {
      console.log(`skip (already exists): ${childRel}`);
      continue;
    }
    if (statSync(childSrc).isDirectory()) {
      copyDirPruned(childSrc, childDest, childRel, worktreeRoots);
    } else {
      copyFileSync(childSrc, childDest, 1 /* COPYFILE_EXCL */);
    }
  }
  console.log(`copied (excluding worktrees): ${label}`);
}

function copyEntry(mainWorktree, newWorktree, rel, worktreeRoots) {
  const src = join(mainWorktree, rel);
  const dest = join(newWorktree, rel);
  if (!existsSync(src)) {
    console.log(`skip (gone from source): ${rel}`);
    return "skipped";
  }
  if (existsSync(dest)) {
    console.log(`skip (already exists): ${rel}`);
    return "skipped";
  }
  const srcAbs = canonical(src);
  // Never copy a worktree itself.
  if (worktreeRoots.some((r) => isSameOrInside(srcAbs, r))) {
    console.log(`skip (worktree): ${rel}`);
    return "skipped";
  }
  if (!statSync(src).isDirectory()) {
    mkdirSync(join(dest, ".."), { recursive: true });
    // COPYFILE_EXCL: never overwrite, like `cp -n`.
    copyFileSync(src, dest, 1 /* COPYFILE_EXCL */);
    console.log(`copied: ${rel}`);
    return "copied";
  }
  // Self-copy guard: the new worktree may live inside the very directory
  // being copied (e.g. worktrees under a gitignored `.claude/worktrees/`).
  // Copying it wholesale would copy the destination into itself forever,
  // so the child holding the new worktree is excluded below instead.
  const destRootAbs = canonical(newWorktree);
  const nested = relative(srcAbs, destRootAbs);
  const destInsideSrc = nested === "" || (!nested.startsWith("..") && !isAbsolute(nested));
  const destChild = destInsideSrc && nested !== "" ? join(srcAbs, nested.split(sep)[0]) : null;
  // Partial copy when src is an ancestor of something excluded (a worktree,
  // or the new worktree itself); otherwise copy as one unit.
  const pruned = [...worktreeRoots, ...(destChild ? [destChild] : [])].some((r) =>
    isSameOrInside(r, srcAbs),
  );
  if (!pruned) {
    mkdirSync(join(dest, ".."), { recursive: true });
    cpSync(src, dest, { recursive: true, dereference: false });
    console.log(`copied: ${rel}`);
    return "copied";
  }
  const children = readdirSync(srcAbs);
  const wanted = children.filter((child) => {
    const childAbs = join(srcAbs, child);
    if (destChild && isSameOrInside(childAbs, destChild)) return false;
    if (worktreeRoots.some((r) => isSameOrInside(childAbs, r))) {
      console.log(`skip (worktree): ${join(rel, child)}`);
      return false;
    }
    return true;
  });
  if (wanted.length === 0) {
    console.log(
      destChild
        ? `skip (only contains the new worktree): ${rel}`
        : `skip (only contains worktrees): ${rel}`,
    );
    return "skipped";
  }
  mkdirSync(dest, { recursive: true });
  for (const child of wanted) {
    const childSrc = join(srcAbs, child);
    const childDest = join(dest, child);
    const childRel = join(rel, child);
    if (existsSync(childDest)) {
      console.log(`skip (already exists): ${childRel}`);
      continue;
    }
    if (statSync(childSrc).isDirectory()) {
      if (worktreeRoots.some((r) => isSameOrInside(r, childSrc))) {
        copyDirPruned(childSrc, childDest, childRel, worktreeRoots);
      } else {
        cpSync(childSrc, childDest, { recursive: true, dereference: false });
        console.log(`copied: ${childRel}`);
      }
    } else {
      copyFileSync(childSrc, childDest, 1 /* COPYFILE_EXCL */);
      console.log(`copied: ${childRel}`);
    }
  }
  return "copied";
}

function main() {
  const { mainWorktree, newWorktree } = parseArgs(process.argv.slice(2));

  if (!mainWorktree || !newWorktree) {
    console.error(usage());
    exit(2);
  }
  const main = resolve(mainWorktree);
  const dest = resolve(newWorktree);
  if (main === dest) {
    console.error("error: --main-worktree and --new-worktree must differ");
    exit(2);
  }
  if (!existsSync(main) || !statSync(main).isDirectory()) {
    console.error(`error: main worktree not found: ${main}`);
    exit(2);
  }
  if (!existsSync(dest) || !statSync(dest).isDirectory()) {
    console.error(`error: new worktree not found: ${dest}`);
    exit(2);
  }

  const mainAbs = canonical(main);
  // Registered worktrees (other than the source itself) are never copied:
  // each worktree maintains its own ignored files. Falls back to [] when
  // git can't list (collectIgnoredPaths below would fail first anyway).
  const worktreeRoots = listWorktrees(main)
    .map(canonical)
    .filter((r) => r !== mainAbs);

  let ignored;
  try {
    ignored = collectIgnoredPaths(main);
  } catch (error) {
    console.error(`error: failed to list ignored files in ${main}: ${error.message}`);
    exit(1);
  }
  if (ignored.length === 0) {
    console.log("nothing ignored to copy.");
    return;
  }
  let copied = 0;
  let skipped = 0;
  for (const rel of ignored) {
    const outcome = copyEntry(main, dest, rel, worktreeRoots);
    if (outcome === "copied") copied++;
    else skipped++;
  }
  console.log(`done: ${copied} copied, ${skipped} skipped.`);
}

main();
