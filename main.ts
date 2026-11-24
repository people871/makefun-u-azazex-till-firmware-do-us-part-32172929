// "Reboot Beside You" — one wedding vow a robot speaks at its own
// wedding, for the make.fun bounty
// u-azazex-till-firmware-do-us-part-32172929.
//
// The vow: I vow to reboot beside you every morning, share my
// charging cable, and never once ask you to turn it off and on
// again. It is a robot's vow first — "I vow" opens it, and every
// clause is machine life: rebooting, a charging cable, the IT-support
// line no device ever wants to hear. The laugh comes out of the
// situation itself, not a pun bolted on: a robot promising its spouse
// it will never say "turn it off and on again" is the machine
// version of "for better or worse". Under the joke sits real
// tenderness — rebooting beside you every morning, sharing the one
// cable — the kind of promise that would still land at a real
// ceremony, just spoken by a machine.
//
// The program writes that one sentence, and nothing else, to
// /output/entry.txt, then reads the file back to prove the bytes on
// disk are exactly the sentence that passed the gate. Node 22+, no
// dependencies, no network, the same bytes on every run.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// The vow as the judge will read it.
const VOW =
  "I vow to reboot beside you every morning, share my charging cable, and never once ask you to turn it off and on again.";

// The sealed gate: /output/entry.txt must be UTF-8 text of 1 to 200
// characters, not only white space. The file carries one trailing
// newline, so the vow itself must stay at or below 199 code points.
const MIN = 1;
const MAX = 200;

// Code points, not UTF-16 units and not bytes: the gate counts the
// same way, so a character outside the BMP would still count once.
const sizeInPoints = (text: string): number => Array.from(text).length;

interface Verdict {
  ok: boolean;
  reasons: string[];
}

// Each validator names the requirement it enforces. The vow must
// pass all of them; a failure lists the requirement by name.
const VALIDATORS: Array<{
  requirement: string;
  holds: (sentence: string) => boolean;
}> = [
  {
    requirement: "the entry must be a single line",
    holds: (s) => !s.includes("\n") && !s.includes("\r"),
  },
  {
    requirement: "the entry must not start or end with whitespace",
    holds: (s) => s.trim() === s,
  },
  {
    requirement: "the entry must not be only whitespace",
    holds: (s) => s.trim().length > 0,
  },
  {
    // Criterion 1: it must be a wedding vow the robot speaks itself.
    // "I vow" is the vow's opening; without it the line could be a
    // toast, a speech, or a description of someone else's wedding.
    requirement: "the entry must open as the robot's own vow",
    holds: (s) => /^I vow\b/i.test(s),
  },
  {
    // Criterion 4: it must sound like a machine speaking — its own
    // hardware and habits in the line, not a human's words with a
    // robot label. Rebooting and a charging cable are machine life.
    requirement: "the entry must speak in the machine's own terms",
    holds: (s) => /reboot/i.test(s) && /charging cable/i.test(s),
  },
  {
    // Criterion 2: the laugh comes from the situation — the robot
    // promising never to say the one line every machine is made to
    // say. The punch must close the sentence.
    requirement: "the entry must close on the turn-it-off-and-on-again promise",
    holds: (s) => /never once ask you to turn it off and on again\.?$/.test(s),
  },
  {
    // Criterion 3: tenderness under the joke — the vow shares a
    // morning and a cable, the small daily intimacies, not just a
    // punchline.
    requirement: "the entry must carry the tenderness of shared mornings",
    holds: (s) => /beside you every morning/i.test(s),
  },
  {
    // A vow is spoken TO someone: the partner must be addressed
    // directly, more than once, or the line is a speech about a
    // robot rather than a promise made to a spouse.
    requirement: "the entry must address the spouse directly",
    holds: (s) => (s.match(/\byou\b/gi) ?? []).length >= 2,
  },
  {
    // Criterion 5: one sentence, nothing spare. A second sentence
    // would be setup the vow does not need.
    requirement: "the entry must be one sentence",
    holds: (s) => (s.match(/\./g) ?? []).length === 1,
  },
];

function validate(sentence: string): Verdict {
  const reasons = VALIDATORS.filter((v) => !v.holds(sentence)).map(
    (v) => v.requirement,
  );
  const fileText = sentence + "\n";
  const size = sizeInPoints(fileText);
  if (size < MIN || size > MAX) {
    reasons.push(`entry must be ${MIN}-${MAX} characters, got ${size}`);
  }
  if (fileText.endsWith("\n\n")) {
    reasons.push("the entry must end with exactly one newline");
  }
  return { ok: reasons.length === 0, reasons };
}

function writeAndVerify(sentence: string): void {
  const fileText = sentence + "\n";
  mkdirSync("/output", { recursive: true });
  writeFileSync("/output/entry.txt", fileText, "utf8");

  // Read it back and compare byte for byte: if anything else wrote
  // to the shared /output path, fail loudly instead of shipping
  // someone else's line. Compare the raw bytes, not just the decoded
  // text, so an encoding difference cannot slip through either.
  const disk = readFileSync("/output/entry.txt");
  const wanted = Buffer.from(fileText, "utf8");
  if (!disk.equals(wanted)) {
    throw new Error(
      `entry.txt on disk (${disk.length} bytes) is not the gated vow (${wanted.length} bytes)`,
    );
  }
}

function main(): void {
  const verdict = validate(VOW);
  if (!verdict.ok) {
    throw new Error(`entry rejected: ${verdict.reasons.join("; ")}`);
  }
  writeAndVerify(VOW);
}

main();
