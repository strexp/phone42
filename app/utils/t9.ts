import type { Contact } from "@/types/contact";

const T9_MAP: Record<string, string> = {
    a: "2", b: "2", c: "2",
    d: "3", e: "3", f: "3",
    g: "4", h: "4", i: "4",
    j: "5", k: "5", l: "5",
    m: "6", n: "6", o: "6",
    p: "7", q: "7", r: "7", s: "7",
    t: "8", u: "8", v: "8",
    w: "9", x: "9", y: "9", z: "9"
};

export function nameToT9(name: string): string {
    return name
        .toLowerCase()
        .split("")
        .map((char) => T9_MAP[char] || char)
        .join("")
        .replace(/[^0-9]/g, "");
}

export function getInitialsT9(name: string): string {
    return name
        .toLowerCase()
        .split(/[\s_]+/)
        .filter((word) => word.length > 0)
        .map((word) => T9_MAP[word[0]!] || word[0])
        .join("")
        .replace(/[^0-9]/g, "");
}

export function searchT9(contacts: Contact[], input: string): Contact[] {
    if (!input) return [];

    const cleanInput = input.replace(/[^0-9*#+]/g, "");
    if (!cleanInput) return [];

    const results: Contact[] = [];
    const seen = new Set<string>();

    for (const contact of contacts) {
        if (seen.has(contact.number)) continue;

        let matched = false;
      
        if (contact.number.includes(cleanInput) && contact.number !== cleanInput) {
            matched = true;
        }

        if (!matched && contact.name) {
            const t9Name = nameToT9(contact.name);
            if (t9Name.includes(cleanInput)) {
                matched = true;
            }
        }

        if (!matched && contact.name) {
            const t9Initials = getInitialsT9(contact.name);
            if (t9Initials.includes(cleanInput)) {
                matched = true;
            }
        }

        if (matched) {
            results.push(contact);
            seen.add(contact.number);
        }
    }

    return results;
}
