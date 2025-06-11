export type Email = {
  id: number;
  filename: string;
  filePath: string;
  subject: string | null;
  analyzed: boolean;
  screenshotUrl: string | null;
  linksId: number | null;
  imagesId: number | null;
  createdAt: number;
  updatedAt: number;
};

export type Link = {
  id: number;
  text: string | null;
  utmParams: Record<string, string>;
  status: number | null;
  screenshotUrl: string | null;
  createdAt: number;
  updatedAt: number;
  emailId: number | null;
  url: string | null;
  redirectChain: Record<string, string>;
  finalUrl: string | null;
  screenshotPath: string | null;
};

export type Image = {
  id: number;
  status: number | null;
  src: string | null;
  alt: string | null;
  emailId: number | null;
  createdAt: number;
  updatedAt: number;
  height: number | null;
  width: number | null;
};

export type SpellError = {
  id: number;
  emailId: number;
  word: string;
  position: number;
  suggestions: string;
  context: string;
  createdAt: number;
  updatedAt: number;
};

export type QaChecklist = {
  id: number;
  emailId: number;
  itemId: string;
  itemText: string;
  completed: boolean;
  note: string | null;
  createdAt: number;
  updatedAt: number;
};

export type QaNote = {
  id: number;
  emailId: number;
  text: string;
  createdAt: number;
  updatedAt: number;
};

export type EmailWithRelations = Email & {
  links: Link[];
  images: Image[];
  spellErrors: SpellError[];
  qaChecklist: QaChecklist[];
  qaNotes: QaNote[];
};
