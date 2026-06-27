interface Contact {
  id: string;
  name: string;
  number: string;
  avatar?: string;
  isPreset?: boolean;
}

interface YpContact {
  mnt: string;
  number: string;
  name: string;
  type: string;
  language: string;
}

export type { Contact, YpContact };
