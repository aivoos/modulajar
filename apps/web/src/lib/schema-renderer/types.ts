// Dynamic form renderer types — derived from ModuleTemplate.schema JSONB

export interface SchemaField {
  key: string;
  label: string;
  type: "text" | "textarea" | "table" | "checkbox" | "select";
  required?: boolean;
  hint?: string;
  options?: string[];      // for select
  columns?: string[];       // for table
}

export interface SchemaSection {
  id: string;
  title: string;
  order: number;
  fields: SchemaField[];
  sections?: SchemaSection[];  // nested sections
}

export interface ModuleTemplateSchema {
  sections: SchemaSection[];
}

export type ContentValue = string | string[] | Record<string, string> | null;
export type ModuleContent = Record<string, ContentValue>;
